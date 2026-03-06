# Playwright Fixtures

The package extends Playwright's test framework with custom fixtures designed for RHDH testing.

## Importing Fixtures

```typescript
import { test, expect } from "@red-hat-developer-hub/e2e-test-utils/test";
```

This import replaces the standard Playwright import and provides additional fixtures.

## Available Fixtures

| Fixture | Scope | Type | Description |
|---------|-------|------|-------------|
| `rhdh` | worker | `RHDHDeployment` | Shared RHDH deployment across all tests in a worker |
| `uiHelper` | test | `UIhelper` | UI interaction helper for Material-UI components |
| `loginHelper` | test | `LoginHelper` | Authentication helper for various providers |
| `baseURL` | test | `string` | Automatically set to the RHDH instance URL |

## Fixture Scopes

### Worker-Scoped Fixtures

The `rhdh` fixture is worker-scoped, meaning:

- One deployment object is shared across all tests in a worker
- You control *when* deployment happens (usually in `test.beforeAll`)
- All tests in the same worker can share the same RHDH instance

```typescript
test.beforeAll(async ({ rhdh }) => {
  // This runs once per worker
  await rhdh.configure({ auth: "keycloak" });
  await rhdh.deploy();
});
```

### Test-Scoped Fixtures

The `uiHelper`, `loginHelper`, and `baseURL` fixtures are test-scoped:

- Created fresh for each test
- Tied to the test's page instance

```typescript
test("example", async ({ uiHelper, loginHelper }) => {
  // Fresh instances for this test
  await loginHelper.loginAsKeycloakUser();
  await uiHelper.verifyHeading("Welcome");
});
```

## Fixture Details

### `rhdh` Fixture

The `rhdh` fixture provides access to the `RHDHDeployment` instance:

```typescript
test.beforeAll(async ({ rhdh }) => {
  // Configure deployment options
  await rhdh.configure({
    auth: "keycloak",
    appConfig: "tests/config/app-config.yaml",
  });

  // Deploy RHDH
  await rhdh.deploy();
});

test("access deployment info", async ({ rhdh }) => {
  console.log(`URL: ${rhdh.rhdhUrl}`);
  console.log(`Namespace: ${rhdh.deploymentConfig.namespace}`);

  // Access Kubernetes client
  const route = await rhdh.k8sClient.getRouteLocation(
    rhdh.deploymentConfig.namespace,
    "my-route"
  );
});
```

### `uiHelper` Fixture

The `uiHelper` fixture provides UI interaction methods:

```typescript
test("UI interactions", async ({ uiHelper }) => {
  // Wait for page to load
  await uiHelper.waitForLoad();

  // Verify content
  await uiHelper.verifyHeading("Welcome");
  await uiHelper.verifyText("Some content");

  // Navigate
  await uiHelper.openSidebar("Catalog");
  await uiHelper.clickTab("Overview");

  // Interact with forms
  await uiHelper.fillTextInputByLabel("Name", "my-component");
  await uiHelper.clickButton("Submit");
});
```

### `loginHelper` Fixture

The `loginHelper` fixture handles authentication:

```typescript
test.beforeEach(async ({ loginHelper }) => {
  // Guest authentication
  await loginHelper.loginAsGuest();

  // Or Keycloak authentication
  await loginHelper.loginAsKeycloakUser();

  // Or with specific credentials
  await loginHelper.loginAsKeycloakUser("test1", "test1@123");
});

test.afterEach(async ({ loginHelper }) => {
  await loginHelper.signOut();
});
```

### `baseURL` Fixture

The `baseURL` fixture is automatically set to the RHDH URL:

```typescript
test("using baseURL", async ({ page, baseURL }) => {
  // page.goto("/") automatically uses baseURL
  await page.goto("/");

  // Equivalent to:
  await page.goto(baseURL);
});
```

## Namespace Derivation

The namespace for each worker is derived from the Playwright project name:

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    { name: "tech-radar" },  // Namespace: tech-radar
    { name: "catalog" },     // Namespace: catalog
  ],
});
```

## `test.runOnce` — Execute a Function Once Per Test Run

Playwright's `beforeAll` runs once **per worker**, not once per test run. When a test fails, Playwright kills the worker and creates a new one for remaining tests — causing `beforeAll` to run again. For operations that are expensive or produce persistent side effects, this leads to unnecessary re-execution.

`test.runOnce` ensures a function executes **exactly once per test run**, even across worker restarts:

```typescript
test.beforeAll(async ({ rhdh }) => {
  await test.runOnce("my-plugin-deploy", async () => {
    await rhdh.configure({ auth: "keycloak" });
    await rhdh.deploy();
  });
});
```

### How It Works

- Uses file-based flags scoped to the Playwright runner process
- When a worker restarts after a test failure, `runOnce` detects the flag and skips
- Any state created by the function (deployments, databases, services) stays alive
- Flags reset automatically between test runs

### When to Use

Use `test.runOnce` when your `beforeAll` performs an operation that:
- Is **expensive** (deployments, database seeding, service provisioning)
- Creates **persistent state** that survives beyond the worker process (Kubernetes resources, external services, test data)
- Should **not repeat** once successfully completed

Common examples:
- RHDH deployment (`rhdh.deploy()`)
- External service deployment (customization providers, mock APIs)
- Database seeding or migration
- Any setup script that takes significant time

### Key: Unique Identifier

The `key` parameter must be unique across all `runOnce` calls in your test run. Use a descriptive name:

```typescript
// Deploy RHDH
await test.runOnce("tech-radar-deploy", async () => {
  await rhdh.deploy();
});

// Deploy an external service
await test.runOnce("tech-radar-data-provider", async () => {
  await $`bash ${setupScript} ${namespace}`;
});

// Seed test data
await test.runOnce("catalog-seed-data", async () => {
  await apiHelper.importEntity("https://example.com/catalog-info.yaml");
});
```

## Namespace Cleanup (Teardown)

In CI environments (`CI` environment variable is set), namespaces are automatically deleted after all tests complete. This is handled by a built-in **teardown reporter** that:

1. Runs in the main Playwright process (survives worker restarts)
2. Waits for **all tests** in a project to finish
3. Deletes the namespace matching the project name

### Default Behavior

No configuration needed. The namespace is derived from your project name:

```typescript
// playwright.config.ts
projects: [
  { name: "tech-radar" },   // Namespace "tech-radar" deleted after all tests
  { name: "catalog" },      // Namespace "catalog" deleted after all tests
]
```

### Custom Namespaces

If you deploy to a namespace that differs from the project name, register it for cleanup:

```typescript
import { registerTeardownNamespace } from "@red-hat-developer-hub/e2e-test-utils/teardown";

test.beforeAll(async ({ rhdh }) => {
  await test.runOnce("custom-deploy", async () => {
    await rhdh.configure({ namespace: "my-custom-ns", auth: "keycloak" });
    await rhdh.deploy();
    registerTeardownNamespace("my-project", "my-custom-ns");
  });
});
```

Multiple namespaces per project are supported — all registered namespaces are deleted after that project's tests complete.

### Local Development

Namespaces are **not** deleted locally (only in CI). This preserves deployments for debugging.

## Best Practices for Projects and Spec Files

Each Playwright project name creates a **separate namespace**. The fixture creates one `RHDHDeployment` per worker, and you typically call `rhdh.deploy()` once in `beforeAll`.

**Recommended for overlay workspaces:**

- Use **one Playwright project** named after the workspace.
- Keep **one spec file** per workspace unless you have a strong reason to split.

This keeps deployment cost low and avoids multiple namespaces unless required.

## When You Need Multiple Projects or Spec Files

If requirements differ (different auth, configs, or namespaces), you can:

1. **Use multiple projects** with different names and config overrides.
2. **Manually manage deployments** using `RHDHDeployment` for advanced flows.

Example using multiple projects:

```typescript
export default defineConfig({
  projects: [
    { name: "workspace-default" },
    { name: "workspace-guest" },
  ],
});
```

Example with manual deployment:

```typescript
import { RHDHDeployment } from "@red-hat-developer-hub/e2e-test-utils/rhdh";

test.beforeAll(async () => {
  const rhdh = new RHDHDeployment("custom-namespace");
  await rhdh.configure({ auth: "guest" });
  await rhdh.deploy();
});
```

## Example: Complete Test Setup

```typescript
import { test, expect } from "@red-hat-developer-hub/e2e-test-utils/test";

test.describe("My Plugin Tests", () => {
  test.beforeAll(async ({ rhdh }) => {
    await test.runOnce("my-plugin-deploy", async () => {
      await rhdh.configure({
        auth: "keycloak",
        appConfig: "tests/config/app-config.yaml",
        dynamicPlugins: "tests/config/plugins.yaml",
      });
      await rhdh.deploy();
    });
  });

  test.beforeEach(async ({ page, loginHelper }) => {
    await page.goto("/");
    await loginHelper.loginAsKeycloakUser();
  });

  test("should display heading", async ({ uiHelper }) => {
    await uiHelper.openSidebar("My Plugin");
    await uiHelper.verifyHeading("My Plugin");
  });

  test("should show data", async ({ uiHelper }) => {
    await uiHelper.openSidebar("My Plugin");
    await uiHelper.verifyRowsInTable(["Item 1", "Item 2"]);
  });
});
```
