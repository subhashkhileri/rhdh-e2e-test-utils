# Your First Test

Create your first E2E test for RHDH using `@red-hat-developer-hub/e2e-test-utils`.

::: tip Quick Start Available
For a faster setup, see the [Quick Start Guide](/guide/quick-start.md). This tutorial provides more detailed explanations for each step.
:::

## Prerequisites

- Node.js >= 22
- Yarn >= 3
- OpenShift cluster access
- `oc`, `kubectl`, `helm` installed

Before continuing, complete the project scaffolding in [Quick Start](/guide/quick-start). This tutorial focuses on *why* each step matters and how to debug effectively.

## Step 1: Write Your Test

**tests/specs/first-test.spec.ts:**
```typescript
import { test, expect } from "@red-hat-developer-hub/e2e-test-utils/test";

test.describe("My First Test Suite", () => {
  test.beforeAll(async ({ rhdh }) => {
    // Use guest auth for simplicity
    await rhdh.configure({ auth: "guest" });
    await rhdh.deploy();
  });

  test.beforeEach(async ({ page, loginHelper }) => {
    await page.goto("/");
    await loginHelper.loginAsGuest();
  });

  test("should display RHDH home page", async ({ uiHelper }) => {
    await uiHelper.verifyHeading(/Red Hat Developer Hub|RHDH/);
  });

  test("should navigate to catalog", async ({ page, uiHelper }) => {
    await uiHelper.openSidebar("Catalog");
    await expect(page).toHaveURL(/.*catalog/);
    await uiHelper.verifyHeading("Catalog");
  });
});
```

## Step 2: Login to OpenShift

```bash
oc login --server=https://api.your-cluster.com:6443 --token=your-token
```

## Step 3: Run Tests

```bash
yarn playwright test
```

## What Happens

1. **Global Setup** validates binaries and cluster
2. **beforeAll** creates namespace and deploys RHDH
3. **beforeEach** navigates and logs in
4. **Tests** run with assertions
5. **Cleanup** deletes namespace (in CI)

## Debugging

### View in Browser

```bash
yarn playwright test --headed
```

### Debug Mode

```bash
yarn playwright test --debug
```

### View Report

```bash
yarn playwright show-report
```

## Next Steps

- [Testing a Plugin](/tutorials/plugin-testing) - Complete workflow
- [Keycloak OIDC Testing](/tutorials/keycloak-oidc-testing) - Real auth
