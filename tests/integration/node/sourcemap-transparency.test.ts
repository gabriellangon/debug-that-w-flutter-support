import { describe, expect, test } from "bun:test";
import { withPausedSession } from "../../helpers.ts";

const TS_FIXTURE = "tests/fixtures/ts/dist/app.js";

describe("Source map transparency", () => {
	// ── Phase 1: logpoint on .ts file (currently broken — no toGenerated) ──

	test("setLogpoint on .ts file uses source-mapped line", () =>
		withPausedSession("test-smt-logpoint", TS_FIXTURE, async (session) => {
			// Set logpoint at app.ts:8 (inside greet function)
			// biome-ignore lint/suspicious/noTemplateCurlyInString: logpoint template syntax
			const lp = await session.setLogpoint("app.ts", 8, "`greeting: ${message}`");
			expect(lp.location.url).toContain("app.ts");
			expect(lp.location.line).toBe(8);

			// Continue — logpoint should fire (not pause)
			await session.continue();
			await session.waitForState("idle", 5_000);

			// Check console for logpoint output
			const messages = session.getConsoleMessages();
			const lpMsg = messages.find((m) => m.text.includes("greeting:"));
			expect(lpMsg).toBeDefined();
		}));

	// ── Phase 1: runTo on .ts file (currently broken — no toGenerated) ──

	test("runTo on .ts file pauses at source-mapped line", () =>
		withPausedSession("test-smt-runto", TS_FIXTURE, async (session) => {
			// Set initial breakpoint at app.ts:8 so we're paused in the function
			await session.setBreakpoint("app.ts", 8);
			await session.continue();
			await session.waitForState("paused");

			// Run to app.ts:13 (return statement)
			await session.runTo("app.ts", 13);
			expect(session.getStatus().state).toBe("paused");

			const stack = session.getStack();
			expect(stack[0]?.file).toContain("app.ts");
			expect(stack[0]?.line).toBe(13);
		}));

	// ── Phase 1: getBreakableLocations returns source coordinates ──

	test("getBreakableLocations returns source-mapped lines", () =>
		withPausedSession("test-smt-breakable", TS_FIXTURE, async (session) => {
			const locations = await session.getBreakableLocations("app.ts", 7, 14);
			expect(locations.length).toBeGreaterThan(0);
			// Lines should be in source coordinates (within the requested range)
			for (const loc of locations) {
				expect(loc.line).toBeGreaterThanOrEqual(7);
				expect(loc.line).toBeLessThanOrEqual(14);
			}
		}));

	// ── Phase 3: resolveToRuntime / resolveToSource helpers ──

	test("setBreakpoint on .ts returns source coordinates in result", () =>
		withPausedSession("test-smt-bp-coords", TS_FIXTURE, async (session) => {
			const bp = await session.setBreakpoint("app.ts", 17);
			// Result should be in source coordinates
			expect(bp.location.url).toContain("app.ts");
			expect(bp.location.line).toBe(17);
		}));

	test("getStack returns source-mapped locations by default", () =>
		withPausedSession("test-smt-stack", TS_FIXTURE, async (session) => {
			await session.setBreakpoint("app.ts", 8);
			await session.continue();
			await session.waitForState("paused");

			const stack = session.getStack();
			expect(stack[0]?.file).toContain("app.ts");
			// Line should be source-mapped (1-based, in .ts file)
			expect(stack[0]?.line).toBe(8);
		}));

	test("buildState location is in source coordinates", () =>
		withPausedSession("test-smt-state-loc", TS_FIXTURE, async (session) => {
			await session.setBreakpoint("app.ts", 8);
			await session.continue();
			await session.waitForState("paused");

			const state = await session.buildState({ code: true });
			expect(state.location?.url).toContain("app.ts");
			expect(state.location?.line).toBe(8);
			// Source should be TypeScript, not compiled JS
			expect(state.source?.lines.some((l) => l.text.includes(": string"))).toBe(true);
		}));

	// ── Plain .js regression ──

	test("plain .js files still work without source maps", () =>
		withPausedSession("test-smt-plain-js", "tests/fixtures/js/simple-app.js", async (session) => {
			const bp = await session.setBreakpoint("simple-app.js", 5);
			expect(bp.location.url).toContain("simple-app.js");
			await session.continue();
			await session.waitForState("paused");
			const stack = session.getStack();
			expect(stack[0]?.file).toContain("simple-app.js");
		}));
});
