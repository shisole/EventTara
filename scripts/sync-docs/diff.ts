import { execSync } from 'child_process';

export function getGitDiff(): string {
  try {
    // Get the diff of the last merge commit vs its first parent
    const diff = execSync('git diff HEAD~1 HEAD', { encoding: 'utf-8', timeout: 10000 });
    return diff;
  } catch {
    return 'Could not retrieve git diff.';
  }
}

export function getCommitMessages(): string {
  try {
    const log = execSync('git log HEAD~1..HEAD --pretty=format:"%s"', { encoding: 'utf-8', timeout: 10000 });
    return log;
  } catch {
    return 'Could not retrieve commit messages.';
  }
}
