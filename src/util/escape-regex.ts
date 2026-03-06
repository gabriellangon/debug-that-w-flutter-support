/** Escape special regex characters in a string for use in RegExp or CDP urlRegex. */
export function escapeRegex(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
