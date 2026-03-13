import { registerCommand } from "../cli/registry.ts";
import { daemonRequest } from "../daemon/client.ts";
import { shortPath } from "../formatter/path.ts";

registerCommand("status", async (args) => {
	const session = args.global.session;

	const data = await daemonRequest(session, "status");
	if (!data) return 1;

	if (args.global.json) {
		console.log(JSON.stringify(data, null, 2));
	} else {
		const stateIcon =
			data.state === "paused" ? "Paused" : data.state === "running" ? "Running" : "Idle";
		console.log(`${stateIcon} — Session "${data.session}" — ${data.state}`);

		if (data.pid) console.log(`  PID: ${data.pid}`);
		if (data.wsUrl) console.log(`  Inspector: ${data.wsUrl}`);
		console.log(`  Uptime: ${Math.round(data.uptime)}s`);
		console.log(`  Scripts loaded: ${data.scriptCount}`);

		if (data.pauseInfo) {
			const loc = data.pauseInfo.url
				? `${shortPath(data.pauseInfo.url)}:${data.pauseInfo.line}${data.pauseInfo.column !== undefined ? `:${data.pauseInfo.column}` : ""}`
				: "unknown";
			console.log(`  Paused: ${data.pauseInfo.reason} at ${loc}`);
		}

		if (data.lastException) {
			const desc = data.lastException.description ?? data.lastException.text;
			const firstLine = desc.split("\n")[0] ?? desc;
			console.log(`  Last exception: ${firstLine}`);
		}
	}

	return 0;
});
