import type {
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";
import { KubernetesClientHelper } from "../utils/kubernetes-client.js";
import { getTeardownNamespaces } from "./teardown-namespaces.js";

/**
 * Playwright reporter that deletes namespaces per-project as soon as all tests
 * in that project finish. This frees cluster resources early instead of waiting
 * for the entire suite to complete.
 *
 * Handles retries: a test is only counted as done when it passes/is skipped,
 * or exhausts all retry attempts.
 *
 * Falls back in onEnd() to clean up any projects that didn't complete naturally
 * (e.g., interrupted runs, maxFailures).
 *
 * Only active when process.env.CI === "true".
 *
 * By default, deletes the namespace matching the project name.
 * For custom namespaces, consumers can register them via registerTeardownNamespace().
 */
export default class TeardownReporter implements Reporter {
  private _projectTestCounts = new Map<string, number>();
  private _projectCompleted = new Map<string, number>();
  private _pendingDeletions = new Map<string, Promise<void>>();

  onBegin(_config: unknown, suite: Suite): void {
    for (const test of suite.allTests()) {
      const name = test.parent.project()?.name;
      if (name) {
        this._projectTestCounts.set(
          name,
          (this._projectTestCounts.get(name) ?? 0) + 1,
        );
        this._projectCompleted.set(name, 0);
      }
    }
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    if (process.env.CI !== "true") return;

    const project = test.parent.project();
    if (!project) return;

    const isDone =
      result.status === "passed" ||
      result.status === "skipped" ||
      result.retry >= project.retries;

    if (!isDone) return;

    const name = project.name;
    const completed = (this._projectCompleted.get(name) ?? 0) + 1;
    this._projectCompleted.set(name, completed);

    // Start deletion immediately (fire-and-forget here, awaited in onEnd)
    if (
      completed === this._projectTestCounts.get(name) &&
      !this._pendingDeletions.has(name)
    ) {
      this._pendingDeletions.set(name, this._deleteProjectNamespaces(name));
    }
  }

  async onEnd(): Promise<void> {
    if (process.env.CI !== "true") return;

    // Await all in-flight deletions started from onTestEnd
    await Promise.all(this._pendingDeletions.values());

    // Fallback: clean up projects that didn't complete naturally
    // (e.g., interrupted run, maxFailures hit)
    for (const [project] of this._projectTestCounts) {
      if (!this._pendingDeletions.has(project)) {
        await this._deleteProjectNamespaces(project);
      }
    }
  }

  private async _deleteProjectNamespaces(projectName: string): Promise<void> {
    let k8sClient: KubernetesClientHelper;
    try {
      k8sClient = new KubernetesClientHelper();
    } catch (error) {
      console.error(
        `[TeardownReporter] Cannot connect to cluster, skipping teardown:`,
        error,
      );
      return;
    }

    const customNamespaces = getTeardownNamespaces(projectName);
    const namespaces =
      customNamespaces.length > 0 ? customNamespaces : [projectName];

    for (const ns of namespaces) {
      console.log(
        `[TeardownReporter] Deleting namespace "${ns}" (project: ${projectName})`,
      );
      await k8sClient.deleteNamespace(ns);
    }
  }
}
