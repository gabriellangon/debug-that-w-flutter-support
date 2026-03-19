package com.debugthat.adapter;

import com.microsoft.java.debug.core.IEvaluatableBreakpoint;
import com.microsoft.java.debug.core.adapter.IDebugAdapterContext;
import com.microsoft.java.debug.core.adapter.IEvaluationProvider;

import java.util.*;
import java.util.concurrent.*;

import com.sun.jdi.*;

/**
 * Lightweight expression evaluation via JDI.
 * Supports: simple variable names, field access (a.b), method invoke (a.m()).
 * Does NOT support: arithmetic, new objects, lambdas, ternary.
 * For full expression eval, upgrade to JDT LS with `dbg install java-full`.
 */
public class SimpleEvaluationProvider implements IEvaluationProvider {

    private final Set<Long> activeEvals = ConcurrentHashMap.newKeySet();
    private final ExecutorService evalExecutor = Executors.newCachedThreadPool(r -> {
        Thread t = new Thread(r, "debug-that-eval");
        t.setDaemon(true);
        return t;
    });

    @Override
    public void initialize(IDebugAdapterContext context, Map<String, Object> options) {
        // No initialization needed for lightweight provider
    }

    @Override
    public CompletableFuture<Value> evaluate(String expression, ThreadReference thread, int depth) {
        return CompletableFuture.supplyAsync(() -> {
            long threadId = thread.uniqueID();
            activeEvals.add(threadId);
            try {
                return evaluateSync(expression, thread, depth);
            } finally {
                activeEvals.remove(threadId);
            }
        }, evalExecutor);
    }

    @Override
    public CompletableFuture<Value> evaluate(String expression, ObjectReference thisContext, ThreadReference thread) {
        return CompletableFuture.supplyAsync(() -> {
            long threadId = thread.uniqueID();
            activeEvals.add(threadId);
            try {
                // Try field access on provided context
                if (expression.matches("[a-zA-Z_$][a-zA-Z0-9_$]*")) {
                    Field field = thisContext.referenceType().fieldByName(expression);
                    if (field != null) {
                        return thisContext.getValue(field);
                    }
                }
                throw new RuntimeException("Cannot evaluate: " + expression);
            } finally {
                activeEvals.remove(threadId);
            }
        }, evalExecutor);
    }

    @Override
    public CompletableFuture<Value> evaluateForBreakpoint(IEvaluatableBreakpoint breakpoint, ThreadReference thread) {
        String expression = breakpoint.getCondition();
        if (expression == null || expression.isEmpty()) {
            expression = breakpoint.getLogMessage();
        }
        if (expression == null) {
            return CompletableFuture.completedFuture(null);
        }
        return evaluate(expression, thread, 0);
    }

    @Override
    public CompletableFuture<Value> invokeMethod(ObjectReference obj, String methodName,
            String methodSignature, Value[] args, ThreadReference thread, boolean invokeSuper) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                List<Method> methods = obj.referenceType().methodsByName(methodName);
                Method method = null;
                for (Method m : methods) {
                    if (methodSignature == null || m.signature().equals(methodSignature)) {
                        method = m;
                        break;
                    }
                }
                if (method == null) {
                    throw new RuntimeException("Method not found: " + methodName);
                }
                List<Value> argList = args != null ? Arrays.asList(args) : Collections.emptyList();
                int options = invokeSuper ? ObjectReference.INVOKE_NONVIRTUAL : 0;
                return obj.invokeMethod(thread, method, argList, options);
            } catch (Exception e) {
                throw new RuntimeException("Method invocation failed: " + e.getMessage(), e);
            }
        }, evalExecutor);
    }

    @Override
    public boolean isInEvaluation(ThreadReference thread) {
        return activeEvals.contains(thread.uniqueID());
    }

    @Override
    public void clearState(ThreadReference thread) {
        activeEvals.remove(thread.uniqueID());
    }

    private Value evaluateSync(String expression, ThreadReference thread, int depth) {
        try {
            StackFrame frame = thread.frame(depth);

            // Simple variable name
            if (expression.matches("[a-zA-Z_$][a-zA-Z0-9_$]*")) {
                LocalVariable var = frame.visibleVariableByName(expression);
                if (var != null) {
                    return frame.getValue(var);
                }
                // Try 'this' field access
                ObjectReference thisObj = frame.thisObject();
                if (thisObj != null) {
                    ReferenceType type = thisObj.referenceType();
                    Field field = type.fieldByName(expression);
                    if (field != null) {
                        return thisObj.getValue(field);
                    }
                }
                throw new RuntimeException("Variable not found: " + expression);
            }

            // Field access chain: a.b.c
            if (expression.contains(".") && !expression.contains("(")) {
                return evaluateFieldChain(expression, frame);
            }

            // Method invocation: obj.method() or method()
            if (expression.contains("(") && expression.endsWith(")")) {
                return evaluateMethodCall(expression, frame, thread);
            }

            throw new RuntimeException(
                "Expression evaluation not supported: " + expression
                + ". Only variable names, field access, and simple method calls are supported."
                + " For full expression evaluation, use `dbg install java-full`."
            );

        } catch (IncompatibleThreadStateException | AbsentInformationException e) {
            throw new RuntimeException("Cannot evaluate: " + e.getMessage(), e);
        }
    }

    private Value evaluateFieldChain(String expression, StackFrame frame)
            throws IncompatibleThreadStateException, AbsentInformationException {
        String[] parts = expression.split("\\.");
        Value current = null;

        for (int i = 0; i < parts.length; i++) {
            String part = parts[i];
            if (i == 0) {
                if ("this".equals(part)) {
                    current = frame.thisObject();
                } else {
                    LocalVariable var = frame.visibleVariableByName(part);
                    if (var != null) {
                        current = frame.getValue(var);
                    } else {
                        ObjectReference thisObj = frame.thisObject();
                        if (thisObj != null) {
                            Field field = thisObj.referenceType().fieldByName(part);
                            if (field != null) {
                                current = thisObj.getValue(field);
                            }
                        }
                    }
                }
                if (current == null) {
                    throw new RuntimeException("Cannot resolve: " + part);
                }
            } else {
                if (!(current instanceof ObjectReference)) {
                    throw new RuntimeException("Cannot access field '" + part + "' on primitive value");
                }
                ObjectReference obj = (ObjectReference) current;
                Field field = obj.referenceType().fieldByName(part);
                if (field == null) {
                    throw new RuntimeException("Field not found: " + part + " on " + obj.referenceType().name());
                }
                current = obj.getValue(field);
            }
        }

        return current;
    }

    private Value evaluateMethodCall(String expression, StackFrame frame, ThreadReference thread)
            throws IncompatibleThreadStateException, AbsentInformationException {
        int parenIdx = expression.indexOf('(');
        String beforeParen = expression.substring(0, parenIdx);
        String argsStr = expression.substring(parenIdx + 1, expression.length() - 1).trim();
        if (!argsStr.isEmpty()) {
            throw new RuntimeException(
                "Method calls with arguments are not supported in lightweight mode."
                + " For full expression evaluation, use `dbg install java-full`."
            );
        }

        ObjectReference target;
        String methodName;

        int lastDot = beforeParen.lastIndexOf('.');
        if (lastDot > 0) {
            String objExpr = beforeParen.substring(0, lastDot);
            methodName = beforeParen.substring(lastDot + 1);
            Value objValue = evaluateFieldChain(objExpr, frame);
            if (!(objValue instanceof ObjectReference)) {
                throw new RuntimeException("Cannot invoke method on primitive value");
            }
            target = (ObjectReference) objValue;
        } else {
            methodName = beforeParen;
            target = frame.thisObject();
            if (target == null) {
                throw new RuntimeException("Cannot invoke method in static context without object");
            }
        }

        List<Method> methods = target.referenceType().methodsByName(methodName);
        Method method = null;
        for (Method m : methods) {
            if (m.argumentTypeNames().isEmpty()) {
                method = m;
                break;
            }
        }
        if (method == null) {
            throw new RuntimeException("No-arg method not found: " + methodName);
        }

        try {
            return target.invokeMethod(thread, method, Collections.emptyList(), 0);
        } catch (Exception e) {
            throw new RuntimeException("Method invocation failed: " + e.getMessage(), e);
        }
    }
}
