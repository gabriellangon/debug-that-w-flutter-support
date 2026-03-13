import { registerCommand } from "../cli/registry.ts";
import { daemonRequest } from "../daemon/client.ts";

registerCommand("break-toggle", async (args) => {
	const session = args.global.session;

	const ref = args.subcommand;
	if (!ref) {
		console.error("No breakpoint ref specified");
		console.error("  -> Try: dbg break-toggle BP#1");
		return 1;
	}

	const data = await daemonRequest(session, "break-toggle", { ref });
	if (!data) return 1;

	if (args.global.json) {
		console.log(JSON.stringify(data, null, 2));
	} else {
		if (data.ref === "all") {
			console.log(`All breakpoints ${data.state}`);
		} else {
			console.log(`${data.ref} ${data.state}`);
		}
	}

	return 0;
});
