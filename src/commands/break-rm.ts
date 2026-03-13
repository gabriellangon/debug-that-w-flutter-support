import { registerCommand } from "../cli/registry.ts";
import { daemonRequest } from "../daemon/client.ts";

registerCommand("break-rm", async (args) => {
	const session = args.global.session;

	const ref = args.subcommand;
	if (!ref) {
		console.error("No breakpoint ref specified");
		console.error("  -> Try: dbg break-rm BP#1");
		return 1;
	}

	const data = await daemonRequest(session, "break-rm", { ref });
	if (!data) return 1;

	if (args.global.json) {
		console.log(JSON.stringify({ ok: true, ref }, null, 2));
	} else {
		if (ref === "all") {
			console.log("All breakpoints and logpoints removed");
		} else {
			console.log(`${ref} removed`);
		}
	}

	return 0;
});
