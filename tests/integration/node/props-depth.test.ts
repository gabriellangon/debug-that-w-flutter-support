import { describe, expect, test } from "bun:test";
import { withDebuggerSession } from "../../helpers.ts";

describe("props --depth N", () => {
	test("depth 1 returns flat properties (default behavior)", () =>
		withDebuggerSession("test-depth-1", "tests/fixtures/deep-nested.js", async (session) => {
			const vars = await session.getVars();
			const dataVar = vars.find((v) => v.name === "data");
			expect(dataVar).toBeDefined();

			const props = await session.getProps(dataVar!.ref);
			const level1 = props.find((p) => p.name === "level1");
			expect(level1?.ref).toMatch(/^@o/);
			// At depth 1, children should NOT be present
			expect(level1).not.toHaveProperty("children");
		}));

	test("depth 2 expands one level of nested objects", () =>
		withDebuggerSession("test-depth-2", "tests/fixtures/deep-nested.js", async (session) => {
			const vars = await session.getVars();
			const dataVar = vars.find((v) => v.name === "data");
			expect(dataVar).toBeDefined();

			const props = await session.getProps(dataVar!.ref, { depth: 2 });
			const level1 = props.find((p) => p.name === "level1");
			expect(level1?.ref).toMatch(/^@o/);
			// At depth 2, level1 should have children expanded
			expect(level1?.children).toBeDefined();
			expect(level1!.children!.length).toBeGreaterThan(0);

			const level2Child = level1!.children!.find((c: { name: string }) => c.name === "level2");
			expect(level2Child).toBeDefined();
			expect(level2Child?.ref).toMatch(/^@o/);
			// level2 should NOT have children (only 1 extra level expanded)
			expect(level2Child).not.toHaveProperty("children");

			const countChild = level1!.children!.find((c: { name: string }) => c.name === "count");
			expect(countChild?.value).toBe("10");
		}));

	test("depth 3 expands two levels of nested objects", () =>
		withDebuggerSession("test-depth-3", "tests/fixtures/deep-nested.js", async (session) => {
			const vars = await session.getVars();
			const dataVar = vars.find((v) => v.name === "data");
			expect(dataVar).toBeDefined();

			const props = await session.getProps(dataVar!.ref, { depth: 3 });
			const level1 = props.find((p) => p.name === "level1");
			expect(level1?.children).toBeDefined();

			const level2 = level1!.children!.find((c: { name: string }) => c.name === "level2");
			expect(level2?.children).toBeDefined();

			const level3 = level2!.children!.find((c: { name: string }) => c.name === "level3");
			expect(level3).toBeDefined();
			expect(level3?.ref).toMatch(/^@o/);
			// level3 should NOT have children (only 2 extra levels expanded)
			expect(level3).not.toHaveProperty("children");

			const nameChild = level2!.children!.find((c: { name: string }) => c.name === "name");
			expect(nameChild?.value).toContain("mid");
		}));

	test("depth does not expand primitives", () =>
		withDebuggerSession("test-depth-prim", "tests/fixtures/deep-nested.js", async (session) => {
			const vars = await session.getVars();
			const dataVar = vars.find((v) => v.name === "data");
			expect(dataVar).toBeDefined();

			const props = await session.getProps(dataVar!.ref, { depth: 2 });
			const simple = props.find((p) => p.name === "simple");
			expect(simple).toBeDefined();
			expect(simple?.value).toContain("flat");
			expect(simple).not.toHaveProperty("children");
		}));
});
