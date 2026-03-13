import { parseIntFlag } from "../cli/parse-flag.ts";
import { registerCommand } from "../cli/registry.ts";
import { daemonRequest } from "../daemon/client.ts";

registerCommand("props", async (args) => {
	const session = args.global.session;

	const ref = args.subcommand;
	if (!ref) {
		console.error("No ref specified");
		console.error("  -> Try: dbg props @v1");
		return 1;
	}

	const data = await daemonRequest(session, "props", {
		ref,
		own: args.flags.own === true || args.flags.own === false ? args.flags.own : undefined,
		internal: args.flags.internal === true || args.flags.private === true ? true : undefined,
		depth: parseIntFlag(args.flags, "depth"),
	});
	if (!data) return 1;

	if (args.global.json) {
		console.log(JSON.stringify(data, null, 2));
		return 0;
	}

	if (data.length === 0) {
		console.log("(no properties)");
		return 0;
	}

	// Format output with aligned columns
	const maxRefLen = Math.max(...data.map((p) => (p.ref ? p.ref.length : 0)));
	const maxNameLen = Math.max(...data.map((p) => p.name.length));

	for (const prop of data) {
		const refCol = prop.ref ? prop.ref.padEnd(maxRefLen) : " ".repeat(maxRefLen);
		const nameCol = prop.name.padEnd(maxNameLen);
		const accessor = prop.isAccessor ? " [accessor]" : "";
		console.log(`${refCol}  ${nameCol}  ${prop.value}${accessor}`);
	}

	return 0;
});
