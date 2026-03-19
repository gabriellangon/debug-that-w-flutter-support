import { javaInstaller } from "./java.ts";
import { lldbInstaller } from "./lldb.ts";
import type { AdapterInstaller } from "./types.ts";

const ADAPTERS: Record<string, AdapterInstaller> = {
	lldb: lldbInstaller,
	java: javaInstaller,
};

export function getAdapterInstaller(name: string): AdapterInstaller | undefined {
	return ADAPTERS[name];
}

export function listAdapterNames(): string[] {
	return Object.keys(ADAPTERS);
}

export { getJavaAdapterClasspath, isJavaAdapterInstalled } from "./java.ts";
