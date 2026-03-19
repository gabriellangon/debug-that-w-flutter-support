package com.debugthat.adapter;

import com.microsoft.java.debug.core.adapter.IVirtualMachineManagerProvider;
import com.sun.jdi.Bootstrap;
import com.sun.jdi.VirtualMachineManager;

/**
 * Default VMM provider using JDI Bootstrap.
 */
public class DefaultVirtualMachineManagerProvider implements IVirtualMachineManagerProvider {

    @Override
    public VirtualMachineManager getVirtualMachineManager() {
        return Bootstrap.virtualMachineManager();
    }
}
