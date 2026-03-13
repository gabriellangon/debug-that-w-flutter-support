import { registerCommand } from "../cli/registry.ts";
import { daemonRequest } from "../daemon/client.ts";

registerCommand("set", async (args) => {
	const session = args.global.session;

	const varName = args.subcommand;
	if (!varName) {
		console.error("No variable name specified");
		console.error("  -> Try: dbg set counter 42");
		return 1;
	}

	const valueParts = args.positionals;
	if (valueParts.length === 0) {
		console.error("No value specified");
		console.error("  -> Try: dbg set counter 42");
		return 1;
	}
	const value = valueParts.join(" ");

	const data = await daemonRequest(session, "set", {
		name: varName,
		value,
		...(typeof args.flags.frame === "string" && { frame: args.flags.frame }),
	});
	if (!data) return 1;

	if (args.global.json) {
		console.log(JSON.stringify(data, null, 2));
		return 0;
	}

	console.log(`${data.name} = ${data.newValue}`);

	return 0;
});
