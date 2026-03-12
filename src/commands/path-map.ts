import { registerCommand } from "../cli/registry.ts";
import { DaemonClient } from "../daemon/client.ts";

registerCommand("path-map", async (args) => {
	const session = args.global.session;
	const action = args.subcommand;

	const client = new DaemonClient(session);

	if (action === "add") {
		const from = args.positionals[0];
		const to = args.positionals[1];
		if (!from || !to) {
			console.error("Usage: dbg path-map add <from> <to>");
			return 1;
		}
		const response = await client.request("path-map-add", { from, to });
		if (!response.ok) {
			console.error(`${response.error}`);
			if (response.suggestion) console.error(`  → ${response.suggestion}`);
			return 1;
		}
		if (args.global.json) {
			console.log(JSON.stringify({ ok: true, from, to }));
		} else {
			const result = response.data as string;
			console.log(result || `Mapped "${from}" -> "${to}"`);
		}
		return 0;
	}

	if (action === "list") {
		const response = await client.request("path-map-list");
		if (!response.ok) {
			console.error(`${response.error}`);
			if (response.suggestion) console.error(`  → ${response.suggestion}`);
			return 1;
		}
		if (args.global.json) {
			console.log(JSON.stringify({ ok: true, data: response.data }));
		} else {
			console.log(response.data as string);
		}
		return 0;
	}

	if (action === "clear") {
		const response = await client.request("path-map-clear");
		if (!response.ok) {
			console.error(`${response.error}`);
			if (response.suggestion) console.error(`  → ${response.suggestion}`);
			return 1;
		}
		if (args.global.json) {
			console.log(JSON.stringify({ ok: true }));
		} else {
			console.log("Path remappings cleared");
		}
		return 0;
	}

	console.error("Unknown path-map action. Use: add, list, or clear");
	console.error("  → dbg path-map add <from> <to>");
	console.error("  → dbg path-map list");
	console.error("  → dbg path-map clear");
	return 1;
});
