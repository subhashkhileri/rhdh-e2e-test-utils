import { RHDHDeployment } from "../../deployment/rhdh/index.js";
import { test as base } from "@playwright/test";
import { LoginHelper, UIhelper } from "../helpers/index.js";
import fs from "fs";
import path from "path";
import os from "os";
import lockfile from "proper-lockfile";

// Each test run gets its own flag directory (ppid = Playwright runner PID)
const flagDir = path.join(os.tmpdir(), `playwright-once-${process.ppid}`);

/**
 * Executes a function only once per test run, even across multiple workers.
 * Automatically resets between test runs (each run uses a unique flag directory).
 * Safe for fullyParallel: true (uses proper-lockfile for cross-process coordination).
 *
 * @param key - Unique identifier for this setup operation
 * @param fn - Function to execute once
 * @returns true if executed, false if skipped (already ran)
 */
async function runOnce(
  key: string,
  fn: () => Promise<void> | void,
): Promise<boolean> {
  const flagFile = path.join(flagDir, `${key}.done`);
  const lockTarget = path.join(flagDir, key);

  fs.mkdirSync(flagDir, { recursive: true });

  // already executed, skip without locking
  if (fs.existsSync(flagFile)) return false;

  // Ensure lock target file exists
  fs.writeFileSync(lockTarget, "", { flag: "a" });
  const release = await lockfile.lock(lockTarget, {
    retries: { retries: 30, minTimeout: 200 },
    stale: 300_000,
  });

  try {
    // Double-check after acquiring lock
    if (fs.existsSync(flagFile)) return false;
    await fn();
    fs.writeFileSync(flagFile, "");
    return true;
  } finally {
    await release();
  }
}

type RHDHDeploymentTestFixtures = {
  rhdh: RHDHDeployment;
  uiHelper: UIhelper;
  loginHelper: LoginHelper;
};

type RHDHDeploymentWorkerFixtures = {
  rhdhDeploymentWorker: RHDHDeployment;
};

const baseTest = base.extend<
  RHDHDeploymentTestFixtures,
  RHDHDeploymentWorkerFixtures
>({
  rhdhDeploymentWorker: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use, workerInfo) => {
      console.log(
        `Deploying rhdh for plugin ${workerInfo.project.name} in namespace ${workerInfo.project.name}`,
      );

      const rhdhDeployment = new RHDHDeployment(workerInfo.project.name);

      await rhdhDeployment.configure();
      await use(rhdhDeployment);
    },
    { scope: "worker", auto: true },
  ],

  rhdh: [
    async ({ rhdhDeploymentWorker }, use) => {
      await use(rhdhDeploymentWorker);
    },
    { auto: true, scope: "test" },
  ],
  uiHelper: [
    async ({ page }, use) => {
      await use(new UIhelper(page));
    },
    { scope: "test" },
  ],
  loginHelper: [
    async ({ page }, use) => {
      await use(new LoginHelper(page));
    },
    { scope: "test" },
  ],
  baseURL: [
    async ({ rhdhDeploymentWorker }, use) => {
      await use(rhdhDeploymentWorker.rhdhUrl);
    },
    { scope: "test" },
  ] as const,
});

export const test = Object.assign(baseTest, {
  runOnce,
});

export * from "@playwright/test";
