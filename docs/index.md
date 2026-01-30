---
layout: home

hero:
  name: "RHDH E2E Test Utils"
  text: "End-to-End Testing Framework"
  tagline: Deploy, test, and validate Red Hat Developer Hub plugins with Playwright
  actions:
    - theme: brand
      text: Get Started
      link: /guide/
    - theme: alt
      text: API Reference
      link: /api/
    - theme: alt
      text: Overlay Testing
      link: /overlay/

features:
  - icon: 🚀
    title: Deploy RHDH in Tests
    details: Deploy via Helm or Operator with automatic namespace management and cleanup.
  - icon: 🧪
    title: Playwright Fixtures & Config
    details: Fixtures manage deployment lifecycle with rhdh, uiHelper, loginHelper, and baseURL.
  - icon: 🔑
    title: Keycloak OIDC Testing
    details: Deploy and configure Keycloak for auth testing with pre-configured realms, clients, and users.
  - icon: ⚙️
    title: Metadata Auto‑Config
    details: Generate dynamic plugin configuration from metadata with sensible defaults.
  - icon: 📦
    title: Helpers & Page Objects
    details: UIhelper, LoginHelper, APIHelper, and page objects for common RHDH workflows.
  - icon: 🧩
    title: Utilities & Tooling
    details: Kubernetes helpers, YAML merging, env substitution, ESLint, and TS config.
---

## Quick Example

```typescript
// playwright.config.ts
import { defineConfig } from "rhdh-e2e-test-utils/playwright-config";

export default defineConfig({
  projects: [{ name: "my-plugin" }],
});
```

```typescript
// tests/my-plugin.spec.ts
import { test, expect } from "rhdh-e2e-test-utils/test";

test.beforeAll(async ({ rhdh }) => {
  await rhdh.configure({ auth: "keycloak" });
  await rhdh.deploy();
});

test.beforeEach(async ({ loginHelper }) => {
  await loginHelper.loginAsKeycloakUser();
});

test("verify catalog", async ({ uiHelper }) => {
  await uiHelper.openSidebar("Catalog");
  await uiHelper.verifyHeading("My Catalog");
});
```

## Choose Your Path

::: tip Overlay or Package?
If you're working in `rhdh-plugin-export-overlays`, start with [Overlay Testing](/overlay/).
Otherwise, start with the [Guide](/guide/).
:::

## What is rhdh-e2e-test-utils?

`rhdh-e2e-test-utils` is a comprehensive test utility package for Red Hat Developer Hub (RHDH) end-to-end testing. It provides a unified framework for:

- **Deploying RHDH instances** to OpenShift clusters via Helm or the RHDH Operator
- **Managing Keycloak** for OIDC authentication testing
- **Running Playwright tests** with custom fixtures optimized for RHDH
- **Interacting with RHDH UI** through helper classes and page objects
- **Managing Kubernetes resources** through a simplified client API

## Next Steps

- [Installation](/guide/installation) - Install the package
- [Quick Start](/guide/quick-start) - Create your first test
- [API Reference](/api/) - Explore the full API
- [Overlay Testing](/overlay/) - For tests in rhdh-plugin-export-overlays
