export interface GlobalFlags {
	session: string;
	json: boolean;
	color: boolean;
	helpAgent: boolean;
	help: boolean;
	version: boolean;
}

export type FlagValue = string | boolean | string[];

export interface ParsedArgs {
	command: string;
	subcommand: string | null;
	positionals: string[];
	flags: Record<string, FlagValue>;
	global: GlobalFlags;
}

export type CommandHandler = (args: ParsedArgs) => Promise<number>;

export interface CommandDef {
	name: string;
	description: string;
	usage: string;
	handler: CommandHandler;
}
