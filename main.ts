#!/usr/bin/env npx -y tsx

import { Octokit } from "@octokit/rest";
import * as dotenv from "dotenv";
import * as fs from "fs";
import path from "path";
import * as readline from "readline";
import { Config, config, MODE } from "./config";

// Load environment variables from .env file
dotenv.config();

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

async function promptForInput(promptText: string): Promise<string> {
	return new Promise((resolve) => {
		rl.question(promptText, (input) => {
			resolve(input);
		});
	});
}

async function getFilesFromRepo({
	octokit,
	owner,
	repo,
	branch,
	pattern,
}: { octokit: Octokit; } & Config): Promise<Files> {
	console.log(
		`Fetching files from https://github.com/${owner}/${repo}/tree/${branch}...`
	);

	console.log(`Matching pattern: ${pattern}`);
	try {
		// Fetch the repository tree
		const response = await octokit.git.getTree({
			owner,
			repo,
			tree_sha: branch,
			recursive: "true",
		});

		// const files = response.data.tree.filter((item) => item.type === "blob");
		const files = response.data.tree.filter((item) => item.type === "blob");
		console.log(files.length, "files found");

		// Filter files using the pattern
		// const filteredFiles = files.filter((file) => file.path && pattern.test(file.path));
		const filteredFiles = files.filter(
			(file) =>
				file.path &&
				(Array.isArray(pattern)
					? pattern.some((p) => {
						return p.test(file.path!);
					})
					: pattern.test(file.path!))
		);
		console.log(filteredFiles.length, "files matched the pattern");

		let downloadedFiles = 0;

		const fileContents: Files = {};
		for (const file of filteredFiles) {
			const contentResponse = await octokit.git.getBlob({
				owner,
				repo,
				file_sha: file.sha!,
			});

			const content = Buffer.from(
				contentResponse.data.content,
				"base64"
			).toString();

			// make content safe for writing to json
			const safeContent = content.replace(/[\u007F-\uFFFF]/g, (chr) => {
				return (
					"\\u" + ("0000" + chr.charCodeAt(0).toString(16)).substring(-4)
				);
			});

			// progress bar that rewrites itself
			downloadedFiles++;
			const width = 80;
			const percent = "#".repeat(
				Math.round((downloadedFiles / filteredFiles.length) * width)
			);
			const empty = ".".repeat(width - percent.length);

			process.stdout.write(
				`Parsing files: ${percent}${empty} ${downloadedFiles}/${filteredFiles.length}\r`
			);
			// https://github.com/google/labs-prototypes/blob/main/seeds/breadboard-web/src/boards/list-files.ts
			const realUrl = `https://github.com/${owner}/${repo}/blob/${branch}/${file.path}`;

			fileContents[realUrl] = {
				url: file.url!,
				path: file.path!,
				content: safeContent,
				branch,
				repository: repo,
				namespace: owner,
			};
		}


		return fileContents;
	} catch (error) {
		console.error("Error fetching repository data:", error);
		return {};
	}
}

type FileData = {
	branch: string;
	content: string;
	namespace: string;
	path: string;
	repository: string;
	url: string;
};

type Files = {
	[key: string]: FileData;
};

async function main() {
	const githubToken =
		process.env.GITHUB_TOKEN || (await promptForInput("GitHub token: "));

	if (!githubToken) {
		console.error("GitHub token is required to proceed.");
		fs.writeFileSync(".env", `GITHUB_TOKEN=`);
		process.exit(1);
	}

	const octokit = new Octokit({ auth: githubToken });

	let files: Files = {};

	if (config.mode == MODE.UPDATE && fs.existsSync(config.output)) {
		files = JSON.parse(fs.readFileSync(config.output, "utf-8"));
	}

	files = { ...files, ...(await getFilesFromRepo({ octokit, ...config })) };

	fs.mkdirSync(path.dirname(config.output), { recursive: true });
	fs.writeFileSync(config.output, JSON.stringify(files, null, "\t"));

	rl.close();
	process.exit(0);
}

main().then(r => r).catch(e => e);
