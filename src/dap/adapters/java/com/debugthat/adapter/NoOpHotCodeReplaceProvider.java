package com.debugthat.adapter;

import com.microsoft.java.debug.core.adapter.HotCodeReplaceEvent;
import com.microsoft.java.debug.core.adapter.IHotCodeReplaceProvider;

import io.reactivex.Observable;

import java.util.*;
import java.util.concurrent.*;
import java.util.function.Consumer;

/**
 * No-op hot code replace provider. HCR requires JDT LS.
 */
public class NoOpHotCodeReplaceProvider implements IHotCodeReplaceProvider {

    @Override
    public void onClassRedefined(Consumer<List<String>> consumer) {
        // No-op
    }

    @Override
    public CompletableFuture<List<String>> redefineClasses() {
        CompletableFuture<List<String>> future = new CompletableFuture<>();
        future.completeExceptionally(new UnsupportedOperationException(
            "Hot code replace is not supported in lightweight mode. Use `dbg install java-full` for HCR support."
        ));
        return future;
    }

    @Override
    public Observable<HotCodeReplaceEvent> getEventHub() {
        return Observable.empty();
    }
}
