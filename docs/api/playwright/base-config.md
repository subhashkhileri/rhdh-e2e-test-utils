# Base Config

Playwright configuration utilities for RHDH testing.

## Import

```typescript
import { defineConfig, baseConfig } from "@red-hat-developer-hub/e2e-test-utils/playwright-config";
```

## `defineConfig()`

```typescript
function defineConfig(config: PlaywrightTestConfig): PlaywrightTestConfig
```

Creates a Playwright configuration with RHDH defaults.

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `config` | `PlaywrightTestConfig` | Playwright configuration options |

### Returns

`PlaywrightTestConfig` - Merged configuration with defaults.

### Example

```typescript
import { defineConfig } from "@red-hat-developer-hub/e2e-test-utils/playwright-config";

export default defineConfig({
  projects: [
    { name: "my-plugin" },
  ],
});
```

## `baseConfig`

```typescript
const baseConfig: PlaywrightTestConfig
```

Raw base configuration object. Use for advanced customization.

### Defaults

```typescript
{
  testDir: "./tests",
  timeout: 90000,
  expect: {
    timeout: 10000,
  },
  forbidOnly: !!process.env.CI,
  retries: Number(process.env.PLAYWRIGHT_RETRIES ?? 0),
  workers: process.env.PLAYWRIGHT_WORKERS || "50%",
  outputDir: "node_modules/.cache/e2e-test-results",
  reporter: [["list"], ["html"], ["json"]],
  use: {
    viewport: { width: 1920, height: 1080 },
    video: { mode: "retain-on-failure", size: { width: 1280, height: 720 } },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 10000,
    navigationTimeout: 50000,
  },
  globalSetup: resolve(import.meta.dirname, "../playwright/global-setup.js"),
}
```

### Example

```typescript
import { baseConfig } from "@red-hat-developer-hub/e2e-test-utils/playwright-config";
import { defineConfig as playwrightDefineConfig } from "@playwright/test";

export default playwrightDefineConfig({
  ...baseConfig,
  timeout: 120000,
  projects: [{ name: "custom" }],
});
```

## Default Values

| Setting | Value |
|---------|-------|
| `testDir` | `"./tests"` |
| `timeout` | `90000` |
| `expect.timeout` | `10000` |
| `retries` | `0` (configurable via `PLAYWRIGHT_RETRIES`) |
| `workers` | `"50%"` (configurable via `PLAYWRIGHT_WORKERS`) |
| `outputDir` | `"node_modules/.cache/e2e-test-results"` |
| `viewport` | `1920x1080` |
| `video` | `"retain-on-failure"` at `1280x720` |
| `trace` | `"retain-on-failure"` |
| `screenshot` | `"only-on-failure"` |
| `actionTimeout` | `10000` |
| `navigationTimeout` | `50000` |

## Customization Examples

### Override Timeout

```typescript
export default defineConfig({
  timeout: 120000,
  projects: [{ name: "my-plugin" }],
});
```

### Custom Reporters

```typescript
export default defineConfig({
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["junit", { outputFile: "results.xml" }],
  ],
  projects: [{ name: "my-plugin" }],
});
```

### Multiple Projects

```typescript
export default defineConfig({
  projects: [
    { name: "tech-radar", testDir: "./tests/tech-radar" },
    { name: "catalog", testDir: "./tests/catalog" },
  ],
});
```
