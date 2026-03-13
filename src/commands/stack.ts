import { parseIntFlag } from "../cli/parse-flag.ts";
import { registerCommand } from "../cli/registry.ts";
import { daemonRequest } from "../daemon/client.ts";
import { formatStack } from "../formatter/stack.ts";

registerCommand("stack", async (args) => {
	const session = args.global.session;

	const data = await daemonRequest(session, "stack", {
		asyncDepth: parseIntFlag(args.flags, "async-depth"),
		generated: args.flags.generated === true ? true : undefined,
		filter: typeof args.flags.filter === "string" ? args.flags.filter : undefined,
	});
	if (!data) return 1;

	if (args.global.json) {
		console.log(JSON.stringify(data, null, 2));
		return 0;
	}

	if (data.length === 0) {
		console.log("No stack frames");
		return 0;
	}

	console.log(formatStack(data));

	return 0;
});
