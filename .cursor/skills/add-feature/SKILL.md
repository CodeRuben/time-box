---
name: add-feature
description: Add a new feature to the codebase following project conventions. Ensures code quality, updates tests, and verifies all tests pass. Use when implementing new functionality or adding features.
---

# Add Feature Workflow

## Before Starting

1. Read the project coding conventions at `.cursor/rules/coding-conventions.mdc`
2. Understand the feature requirements from the user

## Implementation Steps

### 1. Plan the Feature

- Identify which files need to be created or modified
- Determine if new custom hooks are needed to encapsulate logic
- Check if existing shadcn/ui components can be used or extended

### 2. Implement Following Conventions

Apply these principles from the coding conventions:

- **Single responsibility**: Each function should do one thing
- **Custom hooks**: Extract reusable logic from components
- **shadcn/ui**: Use as the base component library
- **Clean comments**: Only explain WHY, not WHAT
- **Clean imports**: Remove any unused imports after changes

### 3. Update Tests

Check if the feature requires test updates:

```bash
# Location: lib/__tests__/ or relevant folder's __tests__/
```

For testable logic (pure functions, utilities, migrations):
- Add test cases for new functionality
- Update existing tests if behavior changed

Skip tests for:
- Simple UI components with no complex logic
- Direct wrappers around external libraries

### 4. Verify Tests Pass

Run the test suite to confirm everything works:

```bash
pnpm test
```

If tests fail:
1. Review the failure output
2. Fix the issue in the implementation or test
3. Re-run until all tests pass

### 5. Version Update

Check if the version should be bumped for this feature:

1. First, check for uncommitted version changes:
   ```bash
   git diff package.json | grep '"version"'
   ```

2. **If there's already an uncommitted version change**: Skip this step (version already updated)

3. **If no uncommitted version change**: Ask the user:
   > "Would you like to update the project version for this feature?"
   > - **patch** (x.x.X): Bug fixes, small changes
   > - **minor** (x.X.0): New features, backwards compatible
   > - **major** (X.0.0): Breaking changes
   > - **skip**: Don't update version

4. If the user chooses to update, bump the version in `package.json`

### 6. Final Checklist

- [ ] Code follows single-responsibility principle
- [ ] Logic extracted to custom hooks where appropriate
- [ ] Uses shadcn/ui components where applicable
- [ ] No redundant comments
- [ ] No unused imports
- [ ] Tests updated (if needed)
- [ ] All tests pass
- [ ] Version updated (if applicable)

## Reporting

After completion, summarize:
- What was added/changed
- Any new files created
- Test status (passed/updated)
