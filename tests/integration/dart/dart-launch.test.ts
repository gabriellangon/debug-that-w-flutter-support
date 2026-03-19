import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import { DapSession } from "../../../src/dap/session.ts";

const HAS_DART = Bun.spawnSync(["which", "dart"]).exitCode === 0;

const HELLO_SCRIPT = resolve("tests/fixtures/dart/hello.dart");

async function withDapSession(
	name: string,
	fn: (session: DapSession) => Promise<void>,
): Promise<void> {
	const session = new DapSession(name, "dart");
	try {
		await fn(session);
	} finally {
		await session.stop();
	}
}

async function launchAtMain(session: DapSession): Promise<void> {
	await session.launch([HELLO_SCRIPT], { brk: true });
	await session.setBreakpoint(HELLO_SCRIPT, 8);
	await session.continue();
}

describe.skipIf(!HAS_DART)("Dart debugging", () => {
	test("launches and pauses with brk", () =>
		withDapSession("dart-test-launch", async (session) => {
			const result = await session.launch([HELLO_SCRIPT], { brk: true });
			expect(result.paused).toBe(true);
			expect(result.pid).toBeGreaterThan(0);
		}));

	test("breakpoint by file and line hits", () =>
		withDapSession("dart-test-bp", async (session) => {
			await launchAtMain(session);
			expect(session.getStatus().state).toBe("paused");
			const stack = session.getStack();
			expect(stack[0]?.file).toContain("hello.dart");
			expect(stack[0]?.functionName).toBe("main");
		}));

	test("eval works in paused context", () =>
		withDapSession("dart-test-eval", async (session) => {
			await launchAtMain(session);
			const result = await session.eval("user");
			expect(result.value).toContain("World");
		}));

	test("getVars returns local variables", () =>
		withDapSession("dart-test-vars", async (session) => {
			await launchAtMain(session);
			const vars = await session.getVars();
			const names = vars.map((v) => v.name);
			expect(names).toContain("user");
		}));

	test("continue runs to completion", () =>
		withDapSession("dart-test-continue", async (session) => {
			await launchAtMain(session);
			await session.continue();
			expect(session.getStatus().state).toBe("idle");
		}));
});
