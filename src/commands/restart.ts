import { registerCommand } from "../cli/registry.ts";
import { daemonRequest } from "../daemon/client.ts";
import { shortPath } from "../formatter/path.ts";

registerCommand("restart", async (args) => {
	const session = args.global.session;

	const data = await daemonRequest(session, "restart");
	if (!data) return 1;

	if (args.global.json) {
		console.log(JSON.stringify(data, null, 2));
	} else {
		console.log(`Session "${session}" restarted (pid ${data.pid})`);
		if (data.paused && data.pauseInfo) {
			const col = data.pauseInfo.column !== undefined ? `:${data.pauseInfo.column + 1}` : "";
			const loc = data.pauseInfo.url
				? `${shortPath(data.pauseInfo.url)}:${data.pauseInfo.line}${col}`
				: "unknown";
			console.log(`Paused at ${loc}`);
		} else {
			console.log("Running");
		}
	}

	return 0;
});
