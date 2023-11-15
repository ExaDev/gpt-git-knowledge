# GitHub Repository Crawler

This utility, inspired by GPT-Crawler, is designed primarily for training custom OpenAI GPTs. It automates the process of fetching relevant files from specified GitHub repositories. These files can then be used as a dataset for training custom GPT models, allowing for more focused and domain-specific language understanding.

- https://www.builder.io/blog/custom-gpt
- https://github.com/builderio/gpt-crawler

## Features

- Fetches files from a GitHub repository based on user-defined patterns.
- Supports regular expressions for precise file matching.
- Retrieves files from specific branches.
- Saves the content in a local JSON file for easy access and training usage.

## Prerequisites

- Node.js and npm installed.
- A GitHub personal access token.

## Installation

Clone this repository or download the script. Then, run the following command to install dependencies:

```bash
npm install
```

## Configuration

The script uses environment variables for configuration. Create a `.env` file in the root directory with the following content:

```env
GITHUB_TOKEN=your_github_token
```

Replace `your_github_token` with your personal GitHub token.

## Usage

Running the script:

- with `npx`
  ```bash
  npx -y tsx
  ```
- with `package.json`
  ```bash
  npm run start
  ```

When prompted, enter the repository details (owner, repo, branch) and the pattern for the files you wish to fetch.

Alternatively, you can set these details in the `.env` and `config.json` files.

## Output

The script will output a JSON file (`output.json`) containing the URL and content of each fetched file. This file can then be used as input for training custom GPT models.
