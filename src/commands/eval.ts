import { parseIntFlag } from "../cli/parse-flag.ts";
import { registerCommand } from "../cli/registry.ts";
import { daemonRequest } from "../daemon/client.ts";

registerCommand("eval", async (args) => {
	const session = args.global.session;

	// Build expression from subcommand + positionals
	const parts: string[] = [];
	if (args.subcommand) {
		parts.push(args.subcommand);
	}
	parts.push(...args.positionals);
	const expression = parts.join(" ");

	if (!expression) {
		console.error("No expression specified");
		console.error("  -> Try: dbg eval 1 + 2");
		return 1;
	}

	const data = await daemonRequest(session, "eval", {
		expression,
		frame: typeof args.flags.frame === "string" ? args.flags.frame : undefined,
		throwOnSideEffect: args.flags["side-effect-free"] === true ? true : undefined,
		timeout: parseIntFlag(args.flags, "timeout"),
		awaitPromise: args.flags.await === true ? true : undefined,
	});
	if (!data) return 1;

	if (args.global.json) {
		console.log(JSON.stringify(data, null, 2));
		return 0;
	}

	if (args.flags.silent !== true) {
		console.log(`${data.ref}  ${data.value}`);
	}

	return 0;
});
