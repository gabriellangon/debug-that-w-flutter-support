/**
 * Extract complete newline-delimited lines from accumulated buffer data.
 * Returns parsed lines and the remaining incomplete data.
 */
export function extractLines(buffer: string): {
	lines: string[];
	remaining: string;
} {
	const lines: string[] = [];
	let remaining = buffer;
	for (let idx = remaining.indexOf("\n"); idx !== -1; idx = remaining.indexOf("\n")) {
		lines.push(remaining.slice(0, idx));
		remaining = remaining.slice(idx + 1);
	}
	return { lines, remaining };
}
