import { describe, expect, test } from "bun:test";
import { deriveParserConfig } from "../../src/cli/command.ts";
import { parseArgs, tokenize } from "../../src/cli/parser.ts";
import "../../src/commands/index.ts";

const config = deriveParserConfig();

// Tests for POSIX (IEEE 1003.1 §12.2) and GNU-style CLI parsing conventions:
// - Combined short flags: -abc → -a -b -c
// - Short flags with values: -f value
// - Long flags with equals: --key=value
// - Boolean negation: --no-flag
// - GNU operand reordering: flags and operands can be interleaved
// - Stop-parsing separator: --
describe("parseArgs — POSIX & GNU conventions", () => {
	// ── GNU: flags before command (operand reordering) ──────────────
	describe("GNU operand reordering: global flags before command", () => {
		test("--json before command", () => {
			const args = parseArgs(["--json", "state"], config);
			expect(args.command).toBe("state");
			expect(args.global.json).toBe(true);
		});

		test("--session <value> before command", () => {
			const args = parseArgs(["--session", "mysession", "state"], config);
			expect(args.command).toBe("state");
			expect(args.global.session).toBe("mysession");
		});

		test("multiple global flags before command", () => {
			const args = parseArgs(["--json", "--session", "test", "state", "--vars"], config);
			expect(args.command).toBe("state");
			expect(args.global.json).toBe(true);
			expect(args.global.session).toBe("test");
			expect(args.flags.vars).toBe(true);
		});

		test("-V before command still works", () => {
			const args = parseArgs(["-V"], config);
			expect(args.global.version).toBe(true);
		});

		test("--help before command", () => {
			const args = parseArgs(["--help", "state"], config);
			expect(args.command).toBe("state");
			expect(args.global.help).toBe(true);
		});
	});

	// ── --key=value syntax ──────────────────────────────────────────
	describe("--key=value syntax", () => {
		test("value flag with equals", () => {
			const args = parseArgs(["break", "src/app.ts:42", "--condition=x > 5"], config);
			expect(args.flags.condition).toBe("x > 5");
		});

		test("global value flag with equals", () => {
			const args = parseArgs(["state", "--session=mysession"], config);
			expect(args.global.session).toBe("mysession");
		});

		test("equals with numeric value", () => {
			const args = parseArgs(["eval", "x", "--frame=0"], config);
			expect(args.flags.frame).toBe("0");
		});

		test("equals with empty value", () => {
			const args = parseArgs(["eval", "x", "--timeout="], config);
			expect(args.flags.timeout).toBe("");
		});
	});

	// ── --no-flag negation ──────────────────────────────────────────
	describe("--no-flag negation", () => {
		test("--no-json sets json to false explicitly", () => {
			const args = parseArgs(["state", "--no-json"], config);
			// Should not leave a "no-json" key in flags — should set json=false
			expect(args.flags["no-json"]).toBeUndefined();
			expect(args.global.json).toBe(false);
		});

		test("--no-brk negates boolean command flag", () => {
			const args = parseArgs(["launch", "--no-brk", "--", "node", "app.js"], config);
			expect(args.flags.brk).toBe(false);
		});

		test("--no-flag does not apply to non-boolean flags", () => {
			// --no-condition should NOT negate "condition" (it's a string flag)
			const args = parseArgs(["break", "app.ts:10", "--no-condition"], config);
			expect(args.flags["no-condition"]).toBe(true);
		});
	});

	// ── Short flags with values ─────────────────────────────────────
	describe("short flags with values", () => {
		test("unmapped short flag takes next arg as value", () => {
			// -p is not in shortMap, so it becomes a value flag consuming next arg
			const args = parseArgs(["launch", "-p", "9229", "--", "node", "app.js"], config);
			expect(args.flags.p).toBe("9229");
		});
	});

	// ── Combined short flags ────────────────────────────────────────
	describe("combined short flags", () => {
		test("-vs expands to -v -s", () => {
			const args = parseArgs(["state", "-vs"], config);
			expect(args.flags.vars).toBe(true);
			expect(args.flags.stack).toBe(true);
		});

		test("-vsbc expands to four flags", () => {
			const args = parseArgs(["state", "-vsbc"], config);
			expect(args.flags.vars).toBe(true);
			expect(args.flags.stack).toBe(true);
			expect(args.flags.breakpoints).toBe(true);
			expect(args.flags.code).toBe(true);
		});
	});

	// ── Edge cases ──────────────────────────────────────────────────
	describe("misc edge cases", () => {
		test("repeated flags — last wins", () => {
			const args = parseArgs(
				["break", "app.ts:10", "--condition", "a", "--condition", "b"],
				config,
			);
			expect(args.flags.condition).toBe("b");
		});

		test("repeatable array flags accumulate in order", () => {
			const args = parseArgs(
				[
					"launch",
					"--runtime",
					"flutter",
					"--tool-arg",
					"--app-id",
					"--tool-arg",
					"com.example.app",
					"lib/main.dart",
				],
				config,
			);
			expect(args.flags["tool-arg"]).toEqual(["--app-id", "com.example.app"]);
		});

		test("only -- with no args after", () => {
			const args = parseArgs(["launch", "--"], config);
			expect(args.command).toBe("launch");
			expect(args.positionals).toEqual([]);
		});

		test("-- before any flags", () => {
			const args = parseArgs(["launch", "--", "--brk", "node"], config);
			expect(args.flags.brk).toBeUndefined();
			// After --, "--brk" and "node" are operands: subcommand="--brk", positionals=["node"]
			expect(args.subcommand).toBe("--brk");
			expect(args.positionals).toEqual(["node"]);
		});

		test("unknown long flag is preserved in flags", () => {
			const args = parseArgs(["state", "--unknown-flag", "value"], config);
			expect(args.flags["unknown-flag"]).toBe("value");
		});
	});
});

// ── Tokenizer-specific tests ────────────────────────────────────────
describe("tokenize", () => {
	test("--key=value produces long-flag with inline value", () => {
		const tokens = tokenize(["--timeout=30"]);
		expect(tokens).toEqual([{ type: "long-flag", name: "timeout", value: "30" }]);
	});

	test("--no-flag produces negation token", () => {
		const tokens = tokenize(["--no-brk"]);
		expect(tokens).toEqual([{ type: "negation", name: "brk" }]);
	});

	test("-- produces separator and rest become operands", () => {
		const tokens = tokenize(["--", "--flag", "val"]);
		expect(tokens).toEqual([
			{ type: "separator" },
			{ type: "operand", value: "--flag" },
			{ type: "operand", value: "val" },
		]);
	});

	test("-abc produces short-group", () => {
		const tokens = tokenize(["-abc"]);
		expect(tokens).toEqual([{ type: "short-group", chars: "abc" }]);
	});

	test("bare words are operands", () => {
		const tokens = tokenize(["launch", "node", "app.js"]);
		expect(tokens).toEqual([
			{ type: "operand", value: "launch" },
			{ type: "operand", value: "node" },
			{ type: "operand", value: "app.js" },
		]);
	});
});

// ── Bug fix: value flags consume negative numbers ───────────────────
describe("parseArgs — value flag consuming dash-prefixed args (bug fix)", () => {
	test("--timeout -1 → timeout='-1' (value flag consumes negative number)", () => {
		const args = parseArgs(["launch", "--timeout", "-1", "--", "node", "app.js"], config);
		expect(args.flags.timeout).toBe("-1");
	});

	test("--condition -x → condition='-x' (value flag consumes dash-prefixed arg)", () => {
		const args = parseArgs(["break", "app.ts:10", "--condition", "-x"], config);
		expect(args.flags.condition).toBe("-x");
	});
});

// ── Bug fix: POSIX combined short flags with value remainder ────────
describe("parseArgs — POSIX short flag value remainder (bug fix)", () => {
	test("-p9229 → p='9229' (POSIX combined short with value remainder)", () => {
		// -p is not boolean, so remaining chars '9229' become the value
		const args = parseArgs(["launch", "-p9229", "--", "node", "app.js"], config);
		expect(args.flags.p).toBe("9229");
	});

	test("-vp9229 → v=true, p='9229' (boolean + value in combined group)", () => {
		const args = parseArgs(["state", "-vp9229"], config);
		expect(args.flags.vars).toBe(true);
		expect(args.flags.p).toBe("9229");
	});

	test("-vp 9229 → v=true, p='9229' (value flag as last char consumes next token)", () => {
		const args = parseArgs(["state", "-vp", "9229"], config);
		expect(args.flags.vars).toBe(true);
		expect(args.flags.p).toBe("9229");
	});
});

// ── Bug fix: suggestCommand threshold ───────────────────────────────
describe("suggestCommand threshold (bug fix)", () => {
	test("short typo should NOT suggest a command", async () => {
		// "zz" is only 2 chars — threshold should be Math.min(3, floor(2/2)+1) = 2
		// No command should be within edit distance <2 of "zz"
		// We test indirectly: run("zz") should print "Unknown command" without suggestion
		const { run } = await import("../../src/cli/parser.ts");
		const origError = console.error;
		const messages: string[] = [];
		console.error = (msg: string) => messages.push(msg);
		try {
			await run(parseArgs(["zz"], config));
		} finally {
			console.error = origError;
		}
		expect(messages[0]).toContain("Unknown command: zz");
		// Should NOT have a "Did you mean" suggestion
		const hasSuggestion = messages.some((m) => m.includes("Did you mean"));
		expect(hasSuggestion).toBe(false);
	});
});
