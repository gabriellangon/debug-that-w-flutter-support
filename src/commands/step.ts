import { registerCommand } from "../cli/registry.ts";
import { daemonRequest } from "../daemon/client.ts";
import { shouldEnableColor } from "../formatter/color.ts";
import { printState } from "./print-state.ts";

registerCommand("step", async (args) => {
	const session = args.global.session;

	// The subcommand is the step mode: over, into, or out (default: over)
	const validModes = new Set(["over", "into", "out"]);
	const mode = (args.subcommand && validModes.has(args.subcommand) ? args.subcommand : "over") as
		| "over"
		| "into"
		| "out";

	const data = await daemonRequest(session, "step", { mode });
	if (!data) return 1;

	if (args.global.json) {
		console.log(JSON.stringify(data, null, 2));
	} else {
		printState(data, { color: shouldEnableColor(args.global.color) });
	}

	return 0;
});
