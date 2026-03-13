import { registerCommand } from "../cli/registry.ts";
import { daemonRequest } from "../daemon/client.ts";

registerCommand("modules", async (args) => {
	const session = args.global.session;

	const filter =
		args.subcommand ?? (typeof args.flags.filter === "string" ? args.flags.filter : undefined);

	const data = await daemonRequest(session, "modules", {
		...(filter && { filter }),
	});
	if (!data) return 1;

	if (args.global.json) {
		console.log(JSON.stringify(data, null, 2));
		return 0;
	}

	if (data.length === 0) {
		console.log("No modules loaded");
		return 0;
	}

	// Format output: name, symbolStatus, path
	const nameWidth = Math.max(...data.map((m) => m.name.length), 4);
	const statusWidth = Math.max(...data.map((m) => (m.symbolStatus ?? "").length), 7);

	for (const mod of data) {
		const name = mod.name.padEnd(nameWidth);
		const status = (mod.symbolStatus ?? "unknown").padEnd(statusWidth);
		const path = mod.path ?? "";
		console.log(`  ${name}  ${status}  ${path}`);
	}

	return 0;
});
