import { registerCommand } from "../cli/registry.ts";
import { daemonRequest } from "../daemon/client.ts";

registerCommand("set-return", async (args) => {
	const session = args.global.session;

	// Build value from subcommand + positionals
	const parts: string[] = [];
	if (args.subcommand) {
		parts.push(args.subcommand);
	}
	parts.push(...args.positionals);
	const value = parts.join(" ");

	if (!value) {
		console.error("No value specified");
		console.error("  -> Try: dbg set-return 42");
		return 1;
	}

	const data = await daemonRequest(session, "set-return", { value });
	if (!data) return 1;

	if (args.global.json) {
		console.log(JSON.stringify(data, null, 2));
		return 0;
	}

	console.log(`return value set to: ${data.value}`);

	return 0;
});
