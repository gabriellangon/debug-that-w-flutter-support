import { parseIntFlag } from "../cli/parse-flag.ts";
import { registerCommand } from "../cli/registry.ts";
import { daemonRequest } from "../daemon/client.ts";
import { shouldEnableColor } from "../formatter/color.ts";
import { printState } from "./print-state.ts";

registerCommand("state", async (args) => {
	const session = args.global.session;

	const stateArgs: Record<string, unknown> = {};

	if (args.flags.vars === true) stateArgs.vars = true;
	if (args.flags.stack === true) stateArgs.stack = true;
	if (args.flags.breakpoints === true) stateArgs.breakpoints = true;
	if (args.flags.code === true) stateArgs.code = true;
	if (args.flags.compact === true) stateArgs.compact = true;
	if (args.flags["all-scopes"] === true) stateArgs.allScopes = true;
	const depth = parseIntFlag(args.flags, "depth");
	if (depth !== undefined) stateArgs.depth = depth;
	const lines = parseIntFlag(args.flags, "lines");
	if (lines !== undefined) stateArgs.lines = lines;
	if (typeof args.flags.frame === "string") {
		stateArgs.frame = args.flags.frame;
	}
	if (args.flags.generated === true) stateArgs.generated = true;

	const data = await daemonRequest(session, "state", stateArgs);
	if (!data) return 1;

	if (args.global.json) {
		console.log(JSON.stringify(data, null, 2));
		return 0;
	}

	printState(data, { color: shouldEnableColor(args.global.color) });

	return 0;
});
