# Installation

## Package Installation

Install via npm:

```bash
npm install rhdh-e2e-test-utils
```

Or via yarn:

```bash
yarn add rhdh-e2e-test-utils
```

Or directly from GitHub (for development versions):

```bash
npm install github:redhat-developer/rhdh-e2e-test-utils#main
```

## Peer Dependencies

The package requires `@playwright/test` as a peer dependency:

```bash
npm install @playwright/test
```

## Verifying Installation

After installation, you can verify by importing the package:

```typescript
import { test, expect } from "rhdh-e2e-test-utils/test";
import { defineConfig } from "rhdh-e2e-test-utils/playwright-config";

// If these imports work without errors, installation is successful
```

## Project Setup

For full project scaffolding (config files, folder structure, and first test), follow:

- [Quick Start](/guide/quick-start) - complete setup walkthrough
- [Your First Test](/tutorials/first-test) - step-by-step with explanations

## Next Steps

- [Requirements](/guide/requirements) - Check system and cluster requirements
- [Quick Start](/guide/quick-start) - Create your first test
