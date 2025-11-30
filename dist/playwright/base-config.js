import { resolve } from "path";
/**
 * Base Playwright configuration that can be extended by workspace-specific configs.
 * Provides sensible defaults for RHDH plugin e2e testing.
 */
export const baseConfig = {
    testDir: "./tests",
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: "50%",
    outputDir: "test-results",
    timeout: 90_000,
    reporter: [
        ["list"],
        ["html", { outputFolder: "test-results", open: "never" }],
        ["json", { outputFile: "test-results/results.json" }],
    ],
    use: {
        ignoreHTTPSErrors: true,
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
        viewport: { width: 1920, height: 1080 },
        video: {
            mode: "on",
            size: { width: 1920, height: 1080 },
        },
        actionTimeout: 10_000,
        navigationTimeout: 50_000,
    },
    expect: {
        timeout: 10_000,
    },
    globalSetup: resolve(import.meta.dirname, "./global-setup.ts"),
};
/**
 * Creates a workspace-specific config by merging with base config.
 * Only allows overriding the projects configuration.
 * @param overrides - Object containing projects to override
 * @returns Merged Playwright configuration
 */
export function createPlaywrightConfig(overrides = {}) {
    return {
        ...baseConfig,
        projects: overrides.projects,
    };
}
