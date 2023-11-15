#!/usr/bin/env npx -y tsx

import { Octokit } from "@octokit/rest";
import * as fs from "fs";
import * as dotenv from "dotenv";
import * as readline from "readline";

// Load environment variables from .env file
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function promptForToken(): Promise<string> {
  return new Promise((resolve) => {
    rl.question('Please enter your GitHub token: ', (token) => {
      resolve(token);
      rl.close();
    });
  });
}

async function getFilesFromRepo({
  octokit,
  owner,
  repo,
  branch,
  pattern,
}: {
  octokit: Octokit;
  owner: string;
  repo: string;
  branch: string;
  pattern: RegExp | RegExp[];
}): Promise<{ url: string; content: string; }[]> {
  console.log(`Fetching files from ${`https://github.com/${owner}/${repo}/tree/${branch}`}...`);
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
    const filteredFiles = files.filter((file) => file.path && (Array.isArray(pattern) ? pattern.some(p => p.test(file.path!)) : pattern.test(file.path!)));
    console.log(filteredFiles.length, "files matched the pattern");

    // Fetch file contents
    let downloadedFiles = 0;
    const fileContents = await Promise.all(
      filteredFiles.map(async (file, index, array) => {
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
          return "\\u" + ("0000" + chr.charCodeAt(0).toString(16)).substring(-4);
        });


        // progress bar that rewrites itself
        downloadedFiles++;
        const width = 80;
        const percent = "#".repeat(Math.round((downloadedFiles / array.length) * width));
        const empty = ".".repeat(width - percent.length);

        process.stdout.write(
          `Parsing files: ${percent}${empty} ${downloadedFiles}/${array.length}\r`
        );


        return {
          url: file.url!,
          path: file.path!,
          content
        };
      })
    );

    return fileContents;
  } catch (error) {
    console.error("Error fetching repository data:", error);
    return [];
  }
}

async function main() {
  let githubToken = process.env.GITHUB_TOKEN;

  if (!githubToken) {
    console.log("GitHub token is not set in environment variables.");
    githubToken = await promptForToken();
  }

  if (!githubToken) {
    console.error("GitHub token is required to proceed.");
    process.exit(1);
  }

  const octokit = new Octokit({ auth: githubToken });
  const owner = 'github_owner';
  const repo = 'repo_name';
  const branch = 'branch_name';

  const pattern: RegExp[] = [
    /.*\.md$/,
  ];

  const files = await getFilesFromRepo({ octokit, owner, repo, branch, pattern });

  // Write to a JSON file
  fs.writeFileSync("output.json", JSON.stringify(files, null, 2));
  process.exit(0);
}

main();
