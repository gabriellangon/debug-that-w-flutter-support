import { registerCommand } from "../cli/registry.ts";
import { daemonRequest } from "../daemon/client.ts";
import type { Variable } from "../formatter/variables.ts";
import { formatVariables } from "../formatter/variables.ts";

registerCommand("vars", async (args) => {
	const session = args.global.session;

	// Optional name filter from subcommand + positionals
	const names: string[] = [];
	if (args.subcommand) {
		names.push(args.subcommand);
	}
	names.push(...args.positionals);

	const data = await daemonRequest(session, "vars", {
		names: names.length > 0 ? names : undefined,
		frame: typeof args.flags.frame === "string" ? args.flags.frame : undefined,
		allScopes: args.flags["all-scopes"] === true ? true : undefined,
	});
	if (!data) return 1;

	if (args.global.json) {
		console.log(JSON.stringify(data, null, 2));
		return 0;
	}

	if (data.length === 0) {
		console.log("(no variables)");
		return 0;
	}

	const vars: Variable[] = data.map((v) => ({
		ref: v.ref,
		name: v.name,
		value: v.value,
		scope: v.scope,
	}));
	const formatted = formatVariables(vars);
	if (formatted) {
		console.log(formatted);
	}

	return 0;
});
