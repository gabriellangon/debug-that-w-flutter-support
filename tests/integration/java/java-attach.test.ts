import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { DapSession } from "../../../src/dap/session.ts";
import { HAS_JAVA, waitForPort } from "./helpers.ts";

const FIXTURES_DIR = resolve("tests/fixtures/java");
const HELLO_JAVA = resolve(FIXTURES_DIR, "Hello.java");

describe.skipIf(!HAS_JAVA)("Java debugging (attach)", () => {
	test("attach to JVM via JDWP port connects", async () => {
		if (!existsSync(resolve(FIXTURES_DIR, "Hello.class"))) {
			Bun.spawnSync(["javac", "-g", HELLO_JAVA], { cwd: FIXTURES_DIR });
		}

		const port = 15005 + Math.floor(Math.random() * 1000);
		const jvmProcess = Bun.spawn(
			["java", `-agentlib:jdwp=transport=dt_socket,server=y,suspend=y,address=${port}`, "Hello"],
			{ cwd: FIXTURES_DIR, stdout: "pipe", stderr: "pipe" },
		);

		try {
			const ready = await waitForPort(port);
			expect(ready).toBe(true);

			const session = new DapSession("java-attach-test", "java");
			try {
				const result = await session.attach(`localhost:${port}`);
				expect(result.wsUrl).toContain("java");
			} finally {
				await session.stop();
			}
		} finally {
			jvmProcess.kill();
		}
	});

	test("disconnect after attach exits cleanly without error", async () => {
		if (!existsSync(resolve(FIXTURES_DIR, "Hello.class"))) {
			Bun.spawnSync(["javac", "-g", HELLO_JAVA], { cwd: FIXTURES_DIR });
		}

		const port = 16005 + Math.floor(Math.random() * 1000);
		const jvmProcess = Bun.spawn(
			["java", `-agentlib:jdwp=transport=dt_socket,server=y,suspend=y,address=${port}`, "Hello"],
			{ cwd: FIXTURES_DIR, stdout: "pipe", stderr: "pipe" },
		);

		try {
			const ready = await waitForPort(port);
			expect(ready).toBe(true);

			const session = new DapSession("java-attach-disconnect", "java");
			await session.attach(`localhost:${port}`);
			await session.stop();
			expect(session.getStatus().state).toBe("idle");
		} finally {
			jvmProcess.kill();
		}
	});
});
