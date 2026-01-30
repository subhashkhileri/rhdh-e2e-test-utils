# Local OCI Testing

This page explains how to run overlay tests locally using OCI images built from a PR.

## When to Use This

Use local OCI testing when you want your local tests to use the **same OCI images** that CI uses for a PR build.

## Requirements

- You have a PR number with OCI images already built via `/publish`
- You have access to the workspace root files:
  - `source.json`
  - `plugins-list.yaml`

## Steps

1. Go to the workspace root (not the `e2e-tests` directory).
2. Ensure `source.json` and `plugins-list.yaml` exist.
3. Set `GIT_PR_NUMBER` and run tests.

```bash
export GIT_PR_NUMBER=1845
yarn test
```

## What Happens

When `GIT_PR_NUMBER` is set, the framework:

- Reads `source.json` and `plugins-list.yaml`
- Fetches plugin versions from the source repository
- Replaces local plugin paths with OCI references for that PR

## Troubleshooting

- Missing `source.json` or `plugins-list.yaml` will fail the deployment.
- If OCI URLs cannot be generated, check the PR build logs and ensure `/publish` completed successfully.

## Related Pages

- [Configuration Files](../test-structure/configuration-files)
- [CI Pipeline](../tutorials/ci-pipeline)
