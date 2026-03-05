import { afterEach, describe, expect, test } from "bun:test";
import { DebugSession } from "../../src/daemon/session.ts";

function waitForState(
	session: DebugSession,
	target: "paused" | "running" | "idle",
	timeoutMs = 5_000,
): Promise<void> {
	return new Promise((resolve, reject) => {
		if (session.state === target) return resolve();
		const deadline = Date.now() + timeoutMs;
		const timer = setInterval(() => {
			if (session.state === target) {
				clearInterval(timer);
				resolve();
			} else if (Date.now() > deadline) {
				clearInterval(timer);
				reject(new Error(`Timed out waiting for state=${target}, current=${session.state}`));
			}
		}, 50);
	});
}

describe("Bun debugging", () => {
	let session: DebugSession;

	afterEach(async () => {
		if (session) {
			await session.stop().catch(() => {});
		}
	});

	test("launches and pauses with --inspect-brk", async () => {
		session = new DebugSession("bun-test-launch");
		const result = await session.launch(["bun", "tests/fixtures/simple-app.js"], { brk: true });

		expect(result.paused).toBe(true);
		expect(result.pid).toBeGreaterThan(0);
		expect(result.wsUrl).toContain("ws://");
		expect(session.state).toBe("paused");
		expect(session.runtime).toBe("bun");
	});

	test("detects bun runtime", async () => {
		session = new DebugSession("bun-test-detect");
		await session.launch(["bun", "tests/fixtures/simple-app.js"], { brk: true });
		expect(session.runtime).toBe("bun");
	});

	test("state includes source-mapped location", async () => {
		session = new DebugSession("bun-test-state");
		await session.launch(["bun", "tests/fixtures/simple-app.js"], { brk: true });
		await Bun.sleep(200); // Wait for source maps to load

		const state = await session.buildState({ code: true, stack: true });
		expect(state.status).toBe("paused");
		// Source-mapped location should point to original source
		expect(state.location?.url).toContain("simple-app.js");
		expect(state.location?.line).toBe(38); // const counter = new Counter(10)
		expect(state.source?.lines?.some((l) => l.current)).toBe(true);
	});

	test("eval works in paused context", async () => {
		session = new DebugSession("bun-test-eval");
		await session.launch(["bun", "tests/fixtures/simple-app.js"], { brk: true });

		const r1 = await session.eval("1+1");
		expect(r1.value).toBe("2");

		const r2 = await session.eval("typeof Bun");
		expect(r2.value).toBe('"object"');
	});

	test("breakpoint by scriptId hits", async () => {
		session = new DebugSession("bun-test-bp");
		await session.launch(["bun", "tests/fixtures/simple-app.js"], { brk: true });
		await Bun.sleep(200); // Wait for source maps

		// Set breakpoint inside greet function (original line 6)
		const bp = await session.setBreakpoint("tests/fixtures/simple-app.js", 6);
		expect(bp.ref).toMatch(/^BP#/);

		// Continue — should hit breakpoint
		await session.continue();
		await waitForState(session, "paused");

		expect(session.state).toBe("paused");
		expect(session.pauseInfo?.reason).toBe("Breakpoint");
	});

	test("step over works", async () => {
		session = new DebugSession("bun-test-step");
		await session.launch(["bun", "tests/fixtures/simple-app.js"], { brk: true });

		const initialLine = session.pauseInfo?.line;
		await session.step("over");
		expect(session.state).toBe("paused");
		// Should have advanced at least one line
		expect(session.pauseInfo?.line).not.toBe(initialLine);
	});

	test("step into enters function", async () => {
		session = new DebugSession("bun-test-step-into");
		await session.launch(["bun", "tests/fixtures/simple-app.js"], { brk: true });

		// Step over to reach line 30 (greet call) then step into
		await session.step("over"); // past const counter
		await session.step("into"); // into greet("World")

		expect(session.state).toBe("paused");
		// Should be inside greet function
		const stack = session.getStack({});
		expect(stack[0]?.functionName).toBe("greet");
	});

	test("scripts list includes user script", async () => {
		session = new DebugSession("bun-test-scripts");
		await session.launch(["bun", "tests/fixtures/simple-app.js"], { brk: true });

		const scripts = session.getScripts();
		const userScript = scripts.find((s) => s.url.includes("simple-app.js"));
		expect(userScript).toBeDefined();
	});

	test("continue resumes execution", async () => {
		session = new DebugSession("bun-test-continue");
		await session.launch(["bun", "tests/fixtures/simple-app.js"], { brk: true });

		// Set a breakpoint so continue stops again (otherwise continue() waits for next pause indefinitely)
		await session.setBreakpoint("tests/fixtures/simple-app.js", 6);
		await session.continue();
		expect(session.state).toBe("paused");
		expect(session.pauseInfo?.reason).toBe("Breakpoint");
	});
});
