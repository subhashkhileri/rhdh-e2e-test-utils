# Test Fixtures

Custom Playwright fixtures for RHDH testing.

## Import

```typescript
import { test, expect } from "@red-hat-developer-hub/e2e-test-utils/test";
```

## Fixtures

### `rhdh`

**Scope:** Worker

**Type:** `RHDHDeployment`

Shared RHDH deployment across all tests in a worker. Wrap expensive setup in `test.runOnce` to avoid re-deploying when workers restart after test failures.

```typescript
test.beforeAll(async ({ rhdh }) => {
  await test.runOnce("my-plugin-deploy", async () => {
    await rhdh.configure({ auth: "keycloak" });
    await rhdh.deploy();
  });
});

test("access rhdh", async ({ rhdh }) => {
  console.log(rhdh.rhdhUrl);
  console.log(rhdh.deploymentConfig.namespace);
});
```

### `uiHelper`

**Scope:** Test

**Type:** `UIhelper`

UI interaction helper for Material-UI components.

```typescript
test("ui interactions", async ({ uiHelper }) => {
  await uiHelper.verifyHeading("Welcome");
  await uiHelper.clickButton("Submit");
  await uiHelper.openSidebar("Catalog");
});
```

### `loginHelper`

**Scope:** Test

**Type:** `LoginHelper`

Authentication helper for various providers.

```typescript
test.beforeEach(async ({ loginHelper }) => {
  await loginHelper.loginAsKeycloakUser();
});

test.afterEach(async ({ loginHelper }) => {
  await loginHelper.signOut();
});
```

### `baseURL`

**Scope:** Test

**Type:** `string`

Automatically set to the RHDH instance URL.

```typescript
test("using baseURL", async ({ page, baseURL }) => {
  console.log(`Base URL: ${baseURL}`);
  // page.goto("/") uses this automatically
  await page.goto("/");
});
```

## `test.runOnce`

```typescript
test.runOnce(key: string, fn: () => Promise<void> | void): Promise<boolean>
```

Executes `fn` exactly once per test run, even across worker restarts. Returns `true` if executed, `false` if skipped. Useful for expensive or persistent operations (deployments, database seeding, service provisioning) that should not repeat after a worker restart.

| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | `string` | Unique identifier for this operation |
| `fn` | `() => Promise<void> \| void` | Function to execute once |

```typescript
test.beforeAll(async ({ rhdh }) => {
  await test.runOnce("my-deploy", async () => {
    await rhdh.configure({ auth: "keycloak" });
    await rhdh.deploy();
  });
});
```

See [Playwright Fixtures — `test.runOnce`](/guide/core-concepts/playwright-fixtures#test-runonce-—-execute-a-function-once-per-test-run) for detailed usage and examples.

## Exported Types

```typescript
import type { Page, BrowserContext, Locator } from "@red-hat-developer-hub/e2e-test-utils/test";
```

Re-exports all Playwright types for convenience.

## Complete Example

```typescript
import { test, expect } from "@red-hat-developer-hub/e2e-test-utils/test";

test.describe("My Tests", () => {
  test.beforeAll(async ({ rhdh }) => {
    await test.runOnce("my-plugin-deploy", async () => {
      await rhdh.configure({ auth: "keycloak" });
      await rhdh.deploy();
    });
  });

  test.beforeEach(async ({ page, loginHelper }) => {
    await page.goto("/");
    await loginHelper.loginAsKeycloakUser();
  });

  test("verify heading", async ({ uiHelper }) => {
    await uiHelper.verifyHeading("Red Hat Developer Hub");
  });

  test("navigate to catalog", async ({ page, uiHelper }) => {
    await uiHelper.openSidebar("Catalog");
    await expect(page).toHaveURL(/.*catalog/);
  });
});
```
