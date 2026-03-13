import { registerCommand } from "../cli/registry.ts";
import { daemonRequest } from "../daemon/client.ts";
import { shouldEnableColor } from "../formatter/color.ts";
import { printState } from "./print-state.ts";

registerCommand("continue", async (args) => {
	const session = args.global.session;

	const data = await daemonRequest(session, "continue");
	if (!data) return 1;

	if (args.global.json) {
		console.log(JSON.stringify(data, null, 2));
	} else {
		printState(data, { color: shouldEnableColor(args.global.color) });
	}

	return 0;
});
