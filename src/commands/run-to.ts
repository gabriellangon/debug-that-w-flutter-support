import { parseFileLine } from "../cli/parse-target.ts";
import { registerCommand } from "../cli/registry.ts";
import { daemonRequest } from "../daemon/client.ts";
import { shouldEnableColor } from "../formatter/color.ts";
import { printState } from "./print-state.ts";

registerCommand("run-to", async (args) => {
	const session = args.global.session;

	const target = args.subcommand ?? args.positionals[0];
	if (!target) {
		console.error("No target specified");
		console.error("  -> Try: dbg run-to src/file.ts:42");
		return 1;
	}

	const parsed = parseFileLine(target);
	if (!parsed) {
		console.error(`Invalid target format: "${target}"`);
		console.error("  -> Expected: <file>:<line>");
		return 1;
	}
	const { file, line } = parsed;

	const data = await daemonRequest(session, "run-to", { file, line });
	if (!data) return 1;

	if (args.global.json) {
		console.log(JSON.stringify(data, null, 2));
	} else {
		printState(data, { color: shouldEnableColor(args.global.color) });
	}

	return 0;
});
