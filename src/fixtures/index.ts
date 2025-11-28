/**
 * Fixtures for RHDH plugin e2e tests.
 * Provides fixtures for interacting with pages and elements.
 */

import { test as base } from "@playwright/test";

export const test = base.extend({
  page: async ({ page }, use) => {
    await use(page);
  },
});