import { parseIntFlag } from "../cli/parse-flag.ts";
import { registerCommand } from "../cli/registry.ts";
import { daemonRequest } from "../daemon/client.ts";
import { detectLanguage, shouldEnableColor } from "../formatter/color.ts";
import { shortPath } from "../formatter/path.ts";
import type { SourceLine } from "../formatter/source.ts";
import { formatSource } from "../formatter/source.ts";

registerCommand("source", async (args) => {
	const session = args.global.session;

	const data = await daemonRequest(session, "source", {
		lines: parseIntFlag(args.flags, "lines"),
		file: typeof args.flags.file === "string" ? args.flags.file : undefined,
		all: args.flags.all === true ? true : undefined,
		generated: args.flags.generated === true ? true : undefined,
	});
	if (!data) return 1;

	if (args.global.json) {
		console.log(JSON.stringify(data, null, 2));
		return 0;
	}

	const color = shouldEnableColor(args.global.color);
	console.log(`Source: ${shortPath(data.url)}`);
	const sourceLines: SourceLine[] = data.lines.map((l) => ({
		lineNumber: l.line,
		content: l.text,
		isCurrent: l.current,
	}));
	console.log(formatSource(sourceLines, { color, language: detectLanguage(data.url) }));

	return 0;
});
