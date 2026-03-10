function getBinaryName(value: string): string {
	return value.split("/").pop() ?? value;
}

function isPythonBinary(value: string): boolean {
	return /^python(?:\d+(?:\.\d+)*)?$/.test(value);
}

function isDartVmServiceUrl(value: string): boolean {
	try {
		const url = new URL(value);
		if (!["http:", "https:", "ws:", "wss:"].includes(url.protocol)) {
			return false;
		}

		return url.pathname.endsWith("/ws") || /\/[^/]+=\/?$/.test(url.pathname);
	} catch {
		return false;
	}
}

export function inferLaunchRuntime(command: string[]): string | undefined {
	const binary = getBinaryName(command[0] ?? "");
	const entrypoint = command[1];

	if (!entrypoint || entrypoint.startsWith("-")) {
		return undefined;
	}

	if (isPythonBinary(binary)) {
		return "debugpy";
	}

	switch (binary) {
		case "dart":
			if (entrypoint === "run") {
				return undefined;
			}
			return "dart";
		case "flutter":
			if (entrypoint === "run") {
				return undefined;
			}
			return "flutter";
		default:
			return undefined;
	}
}

export function inferAttachRuntime(target: string): string | undefined {
	if (isDartVmServiceUrl(target)) {
		return "dart";
	}

	return undefined;
}
