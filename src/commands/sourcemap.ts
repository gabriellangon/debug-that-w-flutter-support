import { registerCommand } from "../cli/registry.ts";
import { daemonRequest } from "../daemon/client.ts";

registerCommand("sourcemap", async (args) => {
	const session = args.global.session;

	// Handle --disable flag
	if (args.flags.disable === true) {
		const result = await daemonRequest(session, "sourcemap-disable", {});
		if (!result) return 1;
		console.log("Source map resolution disabled");
		return 0;
	}

	// Query source map info
	const data = await daemonRequest(session, "sourcemap", {
		...(args.subcommand && { file: args.subcommand }),
	});
	if (!data) return 1;

	if (args.global.json) {
		console.log(JSON.stringify(data, null, 2));
		return 0;
	}

	if (data.length === 0) {
		console.log("No source maps loaded");
		return 0;
	}

	for (const entry of data) {
		console.log(`Script: ${entry.generatedUrl}`);
		console.log(`  Map: ${entry.mapUrl}`);
		console.log(`  Sources: ${entry.sources.join(", ")}`);
		console.log(`  Has sourcesContent: ${entry.hasSourcesContent}`);
	}

	return 0;
});
