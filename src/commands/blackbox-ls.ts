import { registerCommand } from "../cli/registry.ts";
import { daemonRequest } from "../daemon/client.ts";

registerCommand("blackbox-ls", async (args) => {
	const session = args.global.session;

	const data = await daemonRequest(session, "blackbox-ls");
	if (!data) return 1;

	if (args.global.json) {
		console.log(JSON.stringify(data, null, 2));
	} else {
		if (data.length === 0) {
			console.log("No blackbox patterns set");
		} else {
			console.log("Blackbox patterns:");
			for (const p of data) {
				console.log(`  ${p}`);
			}
		}
	}

	return 0;
});
