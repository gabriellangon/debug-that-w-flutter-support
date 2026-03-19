package com.debugthat.adapter;

import com.microsoft.java.debug.core.adapter.ICompletionsProvider;
import com.microsoft.java.debug.core.protocol.Types;
import com.sun.jdi.StackFrame;

import java.util.*;

/**
 * No-op completions provider. Completions require JDT LS.
 */
public class NoOpCompletionsProvider implements ICompletionsProvider {

    @Override
    public List<Types.CompletionItem> codeComplete(StackFrame frame, String snippet, int line, int column) {
        return Collections.emptyList();
    }
}
