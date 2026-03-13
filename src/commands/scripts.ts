import { registerCommand } from "../cli/registry.ts";
import { daemonRequest } from "../daemon/client.ts";

registerCommand("scripts", async (args) => {
	const session = args.global.session;

	// Accept filter from --filter flag or from subcommand
	const filter =
		typeof args.flags.filter === "string" ? args.flags.filter : args.subcommand || undefined;

	const data = await daemonRequest(session, "scripts", {
		filter,
	});
	if (!data) return 1;

	if (args.global.json) {
		console.log(JSON.stringify(data, null, 2));
		return 0;
	}

	if (data.length === 0) {
		console.log("No scripts loaded");
		return 0;
	}

	for (const script of data) {
		let line = `${script.scriptId}  ${script.url}`;
		if (script.sourceMapURL) {
			line += `  (sourcemap: ${script.sourceMapURL})`;
		}
		console.log(line);
	}

	return 0;
});
