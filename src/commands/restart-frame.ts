import { registerCommand } from "../cli/registry.ts";
import { daemonRequest } from "../daemon/client.ts";

registerCommand("restart-frame", async (args) => {
	const session = args.global.session;

	const frameRef = args.subcommand ?? undefined;

	const data = await daemonRequest(session, "restart-frame", {
		frameRef,
	});
	if (!data) return 1;

	if (args.global.json) {
		console.log(JSON.stringify(data, null, 2));
	} else {
		console.log("Frame restarted");
	}

	return 0;
});
