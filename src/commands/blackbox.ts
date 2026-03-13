import { registerCommand } from "../cli/registry.ts";
import { daemonRequest } from "../daemon/client.ts";

registerCommand("blackbox", async (args) => {
	const session = args.global.session;

	const patterns: string[] = [];
	if (args.subcommand) {
		patterns.push(args.subcommand);
	}
	for (const p of args.positionals) {
		patterns.push(p);
	}

	if (patterns.length === 0) {
		console.error("No patterns specified");
		console.error("  -> Try: dbg blackbox node_modules");
		return 1;
	}

	const data = await daemonRequest(session, "blackbox", { patterns });
	if (!data) return 1;

	if (args.global.json) {
		console.log(JSON.stringify(data, null, 2));
	} else {
		console.log("Blackbox patterns:");
		for (const p of data) {
			console.log(`  ${p}`);
		}
	}

	return 0;
});
