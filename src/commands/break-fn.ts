import { registerCommand } from "../cli/registry.ts";
import { daemonRequest } from "../daemon/client.ts";

registerCommand("break-fn", async (args) => {
	const session = args.global.session;

	const name = args.subcommand;
	if (!name) {
		console.error("Usage: dbg break-fn <function-name>");
		console.error("  Example: dbg break-fn __assert_rtn");
		console.error("  Example: dbg break-fn 'yoga::Style::operator=='");
		return 1;
	}

	const condition = typeof args.flags.condition === "string" ? args.flags.condition : undefined;

	const data = await daemonRequest(session, "break-fn", { name, condition });
	if (!data) return 1;

	if (args.global.json) {
		console.log(JSON.stringify(data, null, 2));
	} else {
		console.log(`${data.ref}  fn:${name}`);
	}

	return 0;
});
