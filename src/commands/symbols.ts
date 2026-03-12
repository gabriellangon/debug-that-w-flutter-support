import { registerCommand } from "../cli/registry.ts";
import { DaemonClient } from "../daemon/client.ts";

registerCommand("symbols", async (args) => {
	const session = args.global.session;
	const action = args.subcommand;

	if (action !== "add") {
		console.error("Unknown symbols action. Use: add");
		console.error("  → dbg symbols add <path-to-dSYM>");
		return 1;
	}

	const path = args.positionals[0];
	if (!path) {
		console.error("Usage: dbg symbols add <path>");
		return 1;
	}

	const client = new DaemonClient(session);
	const response = await client.request("symbols-add", { path });

	if (!response.ok) {
		console.error(`${response.error}`);
		if (response.suggestion) console.error(`  → ${response.suggestion}`);
		return 1;
	}

	if (args.global.json) {
		console.log(JSON.stringify({ ok: true, path, result: response.data }));
	} else {
		const result = response.data as string;
		console.log(result || `Symbols from ${path} will be applied on next launch`);
	}

	return 0;
});
