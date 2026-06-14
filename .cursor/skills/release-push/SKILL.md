---
name: release-push
description: Bump the project version, validate changes, commit, and push to remote. Use when the user says "ship this", "release patch", "bump version commit push", "commit and push", or asks to bump the project version before pushing.
disable-model-invocation: true
---

# Release Push

Use this skill when the user wants the current repository changes versioned, committed, and pushed.

## Important

- A skill cannot choose or force the Cursor model. If the user wants Auto, they must select Auto in Cursor before invoking this skill.
- Only commit and push when the user explicitly asks for it.
- Do not include ignored build output, local databases, env files, credentials, or unrelated untracked files.
- Do not amend commits unless the user explicitly asks and the normal git safety rules allow it.

## Workflow

1. Inspect the repository state:
   - Run `git status --short`.
   - Run `git diff --stat` and review the relevant diff.
   - Run `git log -5 --oneline` to match the local commit style.

2. Bump the project version:
   - Read `package.json`.
   - For small follow-up fixes, bump the patch version.
   - For larger feature releases, bump the minor version.
   - Do not bump the major version unless the user explicitly asks.

3. Validate:
   - For narrow UI/component changes, run focused lint where practical, for example `pnpm exec eslint path/to/file.tsx`.
   - For broader application changes, run `pnpm test`.
   - If validation cannot run or fails for reasons outside the change, report that before committing.

4. Commit:
   - Stage only relevant files.
   - Use a concise message in this repo style, for example:
     - `Fix planner section backgrounds (v0.10.1)`
     - `Improve registration and add workout export (v0.10.0)`
   - Include the version in the commit subject when the version bump is part of the commit.

5. Push:
   - Push the current branch to its remote, usually `git push origin main`.
   - Run `git status --short` after pushing to confirm the working tree is clean.

6. Final response:
   - Report the new version.
   - Report the commit hash and subject.
   - Report that the push completed.
   - Mention validation that passed.
