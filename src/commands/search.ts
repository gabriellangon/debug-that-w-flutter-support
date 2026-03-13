import { registerCommand } from "../cli/registry.ts";
import { daemonRequest } from "../daemon/client.ts";
import { shortPath } from "../formatter/path.ts";

registerCommand("search", async (args) => {
	const session = args.global.session;

	// Query from subcommand + positionals
	const parts: string[] = [];
	if (args.subcommand) {
		parts.push(args.subcommand);
	}
	for (const p of args.positionals) {
		parts.push(p);
	}
	const query = parts.join(" ");

	if (!query) {
		console.error("No search query specified");
		console.error("  -> Try: dbg search <query> [--regex] [--case-sensitive]");
		return 1;
	}

	const data = await daemonRequest(session, "search", {
		query,
		isRegex: args.flags.regex === true ? true : undefined,
		caseSensitive: args.flags["case-sensitive"] === true ? true : undefined,
		scriptId: typeof args.flags.file === "string" ? args.flags.file : undefined,
	});
	if (!data) return 1;

	if (args.global.json) {
		console.log(JSON.stringify(data, null, 2));
		return 0;
	}

	if (data.length === 0) {
		console.log("No matches found");
		return 0;
	}

	for (const match of data) {
		console.log(`${shortPath(match.url)}:${match.line}: ${match.content}`);
	}

	return 0;
});
