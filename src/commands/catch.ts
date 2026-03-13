import { registerCommand } from "../cli/registry.ts";
import { daemonRequest } from "../daemon/client.ts";

const VALID_MODES = new Set(["all", "uncaught", "caught", "none"]);

registerCommand("catch", async (args) => {
	const session = args.global.session;

	const mode = args.subcommand ?? "all";
	if (!VALID_MODES.has(mode)) {
		console.error(`Invalid catch mode: "${mode}"`);
		console.error("  -> Try: dbg catch [all | uncaught | caught | none]");
		return 1;
	}

	const data = await daemonRequest(session, "catch", {
		mode: mode as "all" | "uncaught" | "caught" | "none",
	});
	if (!data) return 1;

	if (args.global.json) {
		console.log(JSON.stringify({ mode }, null, 2));
	} else {
		console.log(`Exception pause mode: ${mode}`);
	}

	return 0;
});
