import type { CdpClient } from "./client.ts";
import type { JSC } from "./jsc-protocol.js";

type JscCommand = keyof JSC.RequestMap & keyof JSC.ResponseMap;
type JscEvent = keyof JSC.EventMap;

/**
 * Typed wrapper around CdpClient for WebKit Inspector Protocol (JSC) commands.
 * Exposes `.cdp` for shared CDP commands (Debugger.resume, Runtime.evaluate, etc.).
 */
export class JscClient {
	constructor(readonly cdp: CdpClient) {}

	async send<T extends JscCommand>(
		method: T,
		...args: Record<string, never> extends JSC.RequestMap[T]
			? [JSC.RequestMap[T]?]
			: [JSC.RequestMap[T]]
	): Promise<JSC.ResponseMap[T]> {
		const params = args[0] as Record<string, unknown> | undefined;
		return this.cdp.sendRaw(method, params) as Promise<JSC.ResponseMap[T]>;
	}

	on<T extends JscEvent>(event: T, handler: (params: JSC.EventMap[T]) => void): void;
	on(event: string, handler: (params: unknown) => void): void;
	on(event: string, handler: (params: unknown) => void): void {
		this.cdp.on(event, handler);
	}

	off<T extends JscEvent>(event: T, handler: (params: JSC.EventMap[T]) => void): void;
	off(event: string, handler: (params: unknown) => void): void;
	off(event: string, handler: (params: unknown) => void): void {
		this.cdp.off(event, handler);
	}

	waitFor<T extends JscEvent>(
		event: T,
		opts?: { timeoutMs?: number; filter?: (params: JSC.EventMap[T]) => boolean },
	): Promise<JSC.EventMap[T]>;
	waitFor(
		event: string,
		opts?: { timeoutMs?: number; filter?: (params: unknown) => boolean },
	): Promise<unknown>;
	waitFor(
		event: string,
		opts?: { timeoutMs?: number; filter?: (params: unknown) => boolean },
	): Promise<unknown> {
		return this.cdp.waitFor(event, opts);
	}

	disconnect(): void {
		this.cdp.disconnect();
	}

	get connected(): boolean {
		return this.cdp.connected;
	}
}
