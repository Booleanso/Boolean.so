import { Octokit } from '@octokit/rest';

export const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
export const GITHUB_USERNAME = process.env.GITHUB_USERNAME || '';

export const octokit = new Octokit({
  auth: GITHUB_TOKEN
});