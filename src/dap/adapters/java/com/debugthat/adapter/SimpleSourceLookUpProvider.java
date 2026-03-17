package com.debugthat.adapter;

import com.microsoft.java.debug.core.DebugException;
import com.microsoft.java.debug.core.JavaBreakpointLocation;
import com.microsoft.java.debug.core.adapter.IDebugAdapterContext;
import com.microsoft.java.debug.core.adapter.ISourceLookUpProvider;
import com.microsoft.java.debug.core.protocol.Types;

import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.regex.*;

/**
 * Lightweight source lookup using classpath + package convention.
 * Searches source roots for .java files matching fully qualified class names.
 */
public class SimpleSourceLookUpProvider implements ISourceLookUpProvider {

    private List<Path> sourceRoots = new ArrayList<>();

    @Override
    public void initialize(IDebugAdapterContext context, Map<String, Object> options) {
        // Auto-discover source roots from CWD
        Path cwd = Paths.get(System.getProperty("user.dir"));

        // Check for explicit sourcePaths in launch config
        Object sourcePaths = options != null ? options.get("sourcePaths") : null;
        if (sourcePaths instanceof List) {
            for (Object p : (List<?>) sourcePaths) {
                if (p instanceof String) {
                    sourceRoots.add(Paths.get((String) p));
                }
            }
        }

        if (sourceRoots.isEmpty()) {
            discoverSourceRoots(cwd);
        }
        if (sourceRoots.isEmpty()) {
            sourceRoots.add(cwd);
        }
    }

    @Override
    public boolean supportsRealtimeBreakpointVerification() {
        return false;
    }

    @Override
    public String[] getFullyQualifiedName(String uri, int[] lines, int[] columns) throws DebugException {
        try {
            Path path;
            if (uri.startsWith("file:")) {
                path = Paths.get(new java.net.URI(uri));
            } else {
                path = Paths.get(uri);
            }

            String packageName = readPackageName(path);
            String className = path.getFileName().toString().replace(".java", "");
            String fqcn;
            if (packageName != null && !packageName.isEmpty()) {
                fqcn = packageName + "." + className;
            } else {
                fqcn = className;
            }

            // Return the same FQCN for each requested line
            String[] result = new String[lines.length];
            Arrays.fill(result, fqcn);
            return result;
        } catch (Exception e) {
            return new String[lines.length];
        }
    }

    @Override
    public JavaBreakpointLocation[] getBreakpointLocations(String sourceUri, Types.SourceBreakpoint[] sourceBreakpoints) throws DebugException {
        // Resolve the FQCN for this source file
        int[] lines = new int[sourceBreakpoints.length];
        int[] columns = new int[sourceBreakpoints.length];
        for (int i = 0; i < sourceBreakpoints.length; i++) {
            lines[i] = sourceBreakpoints[i].line;
            columns[i] = sourceBreakpoints[i].column;
        }
        String[] fqcns = getFullyQualifiedName(sourceUri, lines, columns);

        JavaBreakpointLocation[] locations = new JavaBreakpointLocation[sourceBreakpoints.length];
        for (int i = 0; i < sourceBreakpoints.length; i++) {
            locations[i] = new JavaBreakpointLocation(sourceBreakpoints[i].line, sourceBreakpoints[i].column);
            if (fqcns != null && i < fqcns.length && fqcns[i] != null) {
                locations[i].setClassName(fqcns[i]);
            }
        }
        return locations;
    }

    @Override
    public String getSourceFileURI(String fullyQualifiedName, String sourcePath) {
        if (fullyQualifiedName == null) return null;

        // Handle inner classes: com.example.Foo$Bar -> com.example.Foo
        String outerClass = fullyQualifiedName;
        int dollarIdx = outerClass.indexOf('$');
        if (dollarIdx > 0) {
            outerClass = outerClass.substring(0, dollarIdx);
        }

        // Convert FQCN to path: com.example.Foo -> com/example/Foo.java
        // Always use '/' — Path.resolve handles platform conversion
        String relativePath = outerClass.replace('.', '/') + ".java";

        for (Path root : sourceRoots) {
            Path candidate = root.resolve(relativePath);
            if (Files.exists(candidate)) {
                return candidate.toUri().toString();
            }
        }

        return null;
    }

    @Override
    public String getSourceContents(String uri) {
        try {
            Path path;
            if (uri.startsWith("file:")) {
                path = Paths.get(new java.net.URI(uri));
            } else {
                path = Paths.get(uri);
            }
            return new String(Files.readAllBytes(path));
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public List<MethodInvocation> findMethodInvocations(String uri, int line) {
        // Requires JDT AST parsing — not available in lightweight mode
        return Collections.emptyList();
    }

    private String readPackageName(Path javaFile) {
        try (BufferedReader reader = Files.newBufferedReader(javaFile)) {
            String line;
            Pattern packagePattern = Pattern.compile("^\\s*package\\s+([\\w.]+)\\s*;");
            while ((line = reader.readLine()) != null) {
                Matcher m = packagePattern.matcher(line);
                if (m.find()) {
                    return m.group(1);
                }
                // Stop searching after imports or class declaration
                if (line.matches("^\\s*(import|public|class|interface|enum|abstract)\\s.*")) {
                    break;
                }
            }
        } catch (IOException e) {
            // Ignore
        }
        return "";
    }

    private void discoverSourceRoots(Path root) {
        // Guard: don't walk filesystem roots or home directories
        if (root.getNameCount() <= 1) return;

        String[] conventions = {
            "src/main/java",
            "src/test/java",
            "src",
        };

        try {
            Files.walk(root, 3)
                .filter(Files::isDirectory)
                .forEach(dir -> {
                    String relative = root.relativize(dir).toString();
                    for (String convention : conventions) {
                        if (relative.endsWith(convention) || relative.equals(convention)) {
                            sourceRoots.add(dir);
                        }
                    }
                });
        } catch (IOException e) {
            // Fallback to root
        }

        // Also add root itself for default-package sources
        if (!sourceRoots.contains(root)) {
            sourceRoots.add(root);
        }
    }
}
