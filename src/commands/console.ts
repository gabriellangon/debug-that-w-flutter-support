import { parseIntFlag } from "../cli/parse-flag.ts";
import { registerCommand } from "../cli/registry.ts";
import { daemonRequest } from "../daemon/client.ts";
import { formatTimestamp } from "../formatter/timestamp.ts";

registerCommand("console", async (args) => {
	const session = args.global.session;

	const since = parseIntFlag(args.flags, "since");
	const messages = await daemonRequest(session, "console", {
		...(typeof args.flags.level === "string" && { level: args.flags.level }),
		...(since !== undefined && { since }),
		...(args.flags.clear === true && { clear: true }),
	});
	if (!messages) return 1;

	if (args.global.json) {
		console.log(JSON.stringify(messages, null, 2));
		return 0;
	}

	if (messages.length === 0) {
		console.log("(no console messages)");
		return 0;
	}

	for (const msg of messages) {
		const ts = formatTimestamp(msg.timestamp);
		console.log(`[${ts}] [${msg.level}] ${msg.text}`);
	}

	return 0;
});
