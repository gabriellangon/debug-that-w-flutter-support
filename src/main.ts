#!/usr/bin/env bun
// When spawned as a daemon subprocess, run daemon entry directly
if (process.argv.includes("--daemon")) {
	await import("./daemon/entry.ts");
} else {
	await import("./commands/index.ts");

	const { deriveParserConfig } = await import("./cli/command.ts");
	const { parseArgs, run } = await import("./cli/parser.ts");

	const config = deriveParserConfig();
	const args = parseArgs(process.argv.slice(2), config);
	const exitCode = await run(args);
	process.exit(exitCode);
}
