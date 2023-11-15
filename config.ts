export enum MODE {
	OVERWRITE,
	UPDATE
}

export type Config = {
	owner: string;
	repo: string;
	branch: string;
	pattern: RegExp | RegExp[];
	output: string;
	mode: MODE;
};

export const config: Config = {
	owner: "ExaDev-io",
	repo: "gpt-git-knowledge",
	branch: "main",
	pattern: [
		/.*\.md$/,
		/.*\.ts$/
	],
	output: "./output/output.json",
	mode: MODE.UPDATE
};
