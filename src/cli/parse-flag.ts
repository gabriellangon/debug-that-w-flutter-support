import type { FlagValue } from "./types.ts";

/**
 * Parse a string flag value as an integer.
 * Returns undefined if the flag is not set or if parsing fails (NaN).
 */
export function parseIntFlag(flags: Record<string, FlagValue>, name: string): number | undefined {
	const value = flags[name];
	if (typeof value !== "string") return undefined;
	const num = parseInt(value, 10);
	return Number.isNaN(num) ? undefined : num;
}

export function parseStringArrayFlag(
	flags: Record<string, FlagValue>,
	name: string,
): string[] | undefined {
	const value = flags[name];
	if (typeof value === "string") return [value];
	return Array.isArray(value) ? value : undefined;
}
