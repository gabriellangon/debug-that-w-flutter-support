import { registerCommand } from "../cli/registry.ts";
import { daemonRequest } from "../daemon/client.ts";

registerCommand("stop", async (args) => {
	const session = args.global.session;

	const result = await daemonRequest(session, "stop");
	if (!result) return 1;

	if (args.global.json) {
		console.log(JSON.stringify({ ok: true, session }));
	} else {
		console.log(`Session "${session}" stopped`);
	}

	return 0;
});
