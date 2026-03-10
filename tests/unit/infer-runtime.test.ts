import { describe, expect, test } from "bun:test";
import { inferAttachRuntime, inferLaunchRuntime } from "../../src/cli/infer-runtime.ts";

describe("inferLaunchRuntime", () => {
	test("detects dart from command", () => {
		expect(inferLaunchRuntime(["dart", "bin/main.dart"])).toBe("dart");
	});

	test("detects flutter from command", () => {
		expect(inferLaunchRuntime(["flutter", "lib/main.dart"])).toBe("flutter");
	});

	test("detects debugpy from python command", () => {
		expect(inferLaunchRuntime(["python3", "app.py"])).toBe("debugpy");
	});

	test("detects debugpy from versioned python binary path", () => {
		expect(inferLaunchRuntime(["/usr/bin/python3.11", "app.py"])).toBe("debugpy");
	});

	test("does not infer debugpy for python module launches", () => {
		expect(inferLaunchRuntime(["python3", "-m", "http.server"])).toBeUndefined();
	});

	test("does not infer dart for dart run", () => {
		expect(inferLaunchRuntime(["dart", "run", "bin/main.dart"])).toBeUndefined();
	});

	test("does not infer flutter for flutter run", () => {
		expect(inferLaunchRuntime(["flutter", "run", "lib/main.dart"])).toBeUndefined();
	});

	test("returns undefined for node launch", () => {
		expect(inferLaunchRuntime(["node", "app.js"])).toBeUndefined();
	});
});

describe("inferAttachRuntime", () => {
	test("detects dart runtime from VM service ws URL", () => {
		expect(inferAttachRuntime("ws://127.0.0.1:12345/abc=/ws")).toBe("dart");
	});

	test("detects dart runtime from VM service http URL", () => {
		expect(inferAttachRuntime("http://127.0.0.1:12345/abc=/")).toBe("dart");
	});

	test("does not confuse node inspector URL with dart VM service", () => {
		expect(inferAttachRuntime("ws://127.0.0.1:9229/uuid")).toBeUndefined();
	});
});
