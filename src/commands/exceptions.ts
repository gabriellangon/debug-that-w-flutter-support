import { parseIntFlag } from "../cli/parse-flag.ts";
import { registerCommand } from "../cli/registry.ts";
import { daemonRequest } from "../daemon/client.ts";
import { formatTimestamp } from "../formatter/timestamp.ts";

registerCommand("exceptions", async (args) => {
	const session = args.global.session;

	const since = parseIntFlag(args.flags, "since");
	const entries = await daemonRequest(session, "exceptions", {
		...(since !== undefined && { since }),
	});
	if (!entries) return 1;

	if (args.global.json) {
		console.log(JSON.stringify(entries, null, 2));
		return 0;
	}

	if (entries.length === 0) {
		console.log("(no exceptions)");
		return 0;
	}

	for (const entry of entries) {
		const ts = formatTimestamp(entry.timestamp);
		console.log(`[${ts}] ${entry.text}`);
		if (entry.description) {
			console.log(`  ${entry.description}`);
		}
		if (entry.stackTrace) {
			console.log(entry.stackTrace);
		}
	}

	return 0;
});
