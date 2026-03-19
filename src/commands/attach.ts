import { z } from "zod";
import { defineCommand } from "../cli/command.ts";
import { FLUTTER_DAEMON_REQUEST_TIMEOUT_MS } from "../constants.ts";
import { DaemonClient } from "../daemon/client.ts";
import { ensureDaemon } from "../daemon/spawn.ts";
import { detectAttachRuntime } from "../util/detect-runtime.ts";

defineCommand({
	name: "attach",
	description: "Attach to running process",
	usage: "attach [target]",

	category: "session",
	positional: { kind: "joined", name: "target", description: "PID, WebSocket URL, or port" },
	flags: z.object({
		runtime: z.string().optional().meta({ description: "Runtime override" }),
		timeout: z.coerce.number().optional().meta({ description: "Daemon startup timeout" }),
		"tool-arg": z
			.array(z.string())
			.optional()
			.meta({ description: "Repeatable adapter/tool argument" }),
	}),
	handler: async (ctx) => {
		const session = ctx.global.session;
		const target = ctx.positional || undefined;
		const runtime =
			ctx.flags.runtime ?? (target ? detectAttachRuntime(target)?.runtime : undefined);

		if (!target && runtime !== "flutter") {
			console.error("No attach target specified");
			console.error("  -> Try: dbg attach <ws-url | port>");
			console.error("  -> For Flutter discovery: dbg attach --runtime flutter");
			return 1;
		}

		// Check if daemon already running (PID-aware — stale sockets won't block)
		if (DaemonClient.isRunning(session)) {
			console.error(`Session "${session}" is already active`);
			console.error(`  -> Try: dbg stop --session ${session}`);
			return 1;
		}

		// Ensure daemon is running — auto-cleans stale sockets if daemon is dead
		await ensureDaemon(session, { timeout: ctx.flags.timeout });

		// Send attach command
		const client = new DaemonClient(session);
		const response = await client.request("attach", {
			target,
			runtime,
			toolArgs: ctx.flags["tool-arg"],
		}, {
			timeoutMs: runtime === "flutter" ? FLUTTER_DAEMON_REQUEST_TIMEOUT_MS : undefined,
		});

		if (!response.ok) {
			console.error(`${response.error}`);
			if (response.suggestion) console.error(`  ${response.suggestion}`);
			return 1;
		}

		const data = response.data as { wsUrl: string };

		if (ctx.global.json) {
			console.log(JSON.stringify(data, null, 2));
		} else {
			console.log(`Session "${session}" attached`);
			console.log(`Connected to ${data.wsUrl}`);
		}

		return 0;
	},
});
