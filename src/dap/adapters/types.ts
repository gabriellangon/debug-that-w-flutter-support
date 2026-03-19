/** Common contract for managed DAP adapter installers. */
export interface AdapterInstaller {
	/** Human-readable name for progress messages. */
	readonly name: string;
	/** Check if the adapter is fully installed and ready to use. */
	isInstalled(): boolean;
	/** Download, extract, or compile the adapter. Throws on failure. */
	install(log: (msg: string) => void): Promise<void>;
}
