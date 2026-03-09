import { describe, expect, test } from "bun:test";
import { suggestEvalFix } from "../../src/daemon/eval-suggestions.ts";

describe("suggestEvalFix", () => {
	test("suggests modules for 'invalid use of this'", () => {
		const suggestion = suggestEvalFix(
			"invalid use of 'this' outside of a non-static member function",
		);
		expect(suggestion).toContain("modules");
		expect(suggestion).toContain("--frame");
	});

	test("suggests props for 'no member named'", () => {
		const suggestion = suggestEvalFix("no member named 'foo' in 'Bar'");
		expect(suggestion).toContain("props");
	});

	test("suggests vars for 'undeclared identifier'", () => {
		const suggestion = suggestEvalFix("use of undeclared identifier 'xyz'");
		expect(suggestion).toContain("vars");
	});

	test("suggests vars for 'is not defined'", () => {
		const suggestion = suggestEvalFix("ReferenceError: foo is not defined");
		expect(suggestion).toContain("vars");
	});

	test("suggests pause when not paused", () => {
		const suggestion = suggestEvalFix("Cannot eval: process is not paused");
		expect(suggestion).toContain("pause");
	});

	test("suggests timeout increase for timed out", () => {
		const suggestion = suggestEvalFix("Evaluation timed out after 5000ms");
		expect(suggestion).toContain("--timeout");
	});

	test("suggests removing flag for side effect errors", () => {
		const suggestion = suggestEvalFix("Expression has a possible side effect");
		expect(suggestion).toContain("--side-effect-free");
	});

	test("suggests syntax fix for SyntaxError", () => {
		const suggestion = suggestEvalFix("SyntaxError: Unexpected token ')'");
		expect(suggestion).toContain("syntax");
	});

	test("suggests vars for null property access", () => {
		const suggestion = suggestEvalFix("Cannot read properties of undefined");
		expect(suggestion).toContain("vars");
	});

	test("returns undefined for unrecognized errors", () => {
		const suggestion = suggestEvalFix("Some completely unknown error");
		expect(suggestion).toBeUndefined();
	});
});
