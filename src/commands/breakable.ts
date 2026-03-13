import { registerCommand } from "../cli/registry.ts";
import { daemonRequest } from "../daemon/client.ts";

registerCommand("breakable", async (args) => {
	const session = args.global.session;

	const target = args.subcommand;
	if (!target) {
		console.error("No target specified");
		console.error("  -> Try: dbg breakable src/app.ts:10-20");
		return 1;
	}

	// Parse file:start-end from the target
	const lastColon = target.lastIndexOf(":");
	if (lastColon === -1 || lastColon === 0) {
		console.error(`Invalid target format: "${target}"`);
		console.error("  -> Expected: <file>:<start>-<end>");
		return 1;
	}

	const file = target.slice(0, lastColon);
	const range = target.slice(lastColon + 1);
	const dashIdx = range.indexOf("-");
	if (dashIdx === -1) {
		console.error(`Invalid range format: "${range}"`);
		console.error("  -> Expected: <start>-<end>");
		return 1;
	}

	const startLine = parseInt(range.slice(0, dashIdx), 10);
	const endLine = parseInt(range.slice(dashIdx + 1), 10);
	if (Number.isNaN(startLine) || Number.isNaN(endLine) || startLine <= 0 || endLine <= 0) {
		console.error(`Invalid line numbers in "${range}"`);
		console.error("  -> Expected: <start>-<end>");
		return 1;
	}

	const data = await daemonRequest(session, "breakable", { file, startLine, endLine });
	if (!data) return 1;

	if (args.global.json) {
		console.log(JSON.stringify(data, null, 2));
	} else {
		if (data.length === 0) {
			console.log("No breakable locations in range");
		} else {
			for (const loc of data) {
				console.log(`  ${file}:${loc.line}:${loc.column}`);
			}
		}
	}

	return 0;
});
