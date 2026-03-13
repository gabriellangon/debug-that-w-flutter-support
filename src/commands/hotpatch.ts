import { registerCommand } from "../cli/registry.ts";
import { daemonRequest } from "../daemon/client.ts";

registerCommand("hotpatch", async (args) => {
	const session = args.global.session;

	const file = args.subcommand;
	if (!file) {
		console.error("No file specified");
		console.error("  -> Try: dbg hotpatch app.js");
		return 1;
	}

	// Read the file contents
	let source: string;
	try {
		source = await Bun.file(file).text();
	} catch {
		console.error(`Cannot read file: ${file}`);
		return 1;
	}

	const data = await daemonRequest(session, "hotpatch", {
		file,
		source,
		dryRun: args.flags["dry-run"] === true,
	});
	if (!data) return 1;

	if (args.global.json) {
		console.log(JSON.stringify(data, null, 2));
		return 0;
	}

	if (data.exceptionDetails) {
		console.error(`hotpatch failed: ${JSON.stringify(data.exceptionDetails)}`);
		return 1;
	}

	const dryRunLabel = args.flags["dry-run"] === true ? " (dry-run)" : "";
	console.log(`hotpatch ${data.status}${dryRunLabel}: ${file}`);

	return 0;
});
