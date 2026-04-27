import type {
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";
import path from "path";
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
 * Diagnostic log collection runs always (CI and local).
 * Namespace deletion only runs when process.env.CI === "true".
 *
 * By default, deletes the namespace matching the project name.
 * For custom namespaces, consumers can register them via registerTeardownNamespace().
 */
export default class TeardownReporter implements Reporter {
  private _projectTestCounts = new Map<string, number>();
  private _projectCompleted = new Map<string, number>();
  private _projectsWithFailures = new Set<string>();
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
    const project = test.parent.project();
    if (!project) return;

    const isDone =
      result.status === "passed" ||
      result.status === "skipped" ||
      result.retry >= project.retries;

    if (!isDone) return;

    const name = project.name;

    if (result.status !== "passed" && result.status !== "skipped") {
      this._projectsWithFailures.add(name);
    }

    const completed = (this._projectCompleted.get(name) ?? 0) + 1;
    this._projectCompleted.set(name, completed);

    // Start cleanup immediately (fire-and-forget here, awaited in onEnd)
    if (
      completed === this._projectTestCounts.get(name) &&
      !this._pendingDeletions.has(name)
    ) {
      this._pendingDeletions.set(name, this._deleteProjectNamespaces(name));
    }
  }

  async onEnd(): Promise<void> {
    // Await all in-flight cleanups started from onTestEnd
    await Promise.all(this._pendingDeletions.values());

    // Fallback: clean up projects that didn't complete naturally
    // (e.g., interrupted run, maxFailures hit) — always collect diagnostics
    for (const [project] of this._projectTestCounts) {
      if (!this._pendingDeletions.has(project)) {
        this._projectsWithFailures.add(project);
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
        `[TeardownReporter] Cannot connect to cluster, skipping cleanup:`,
        error,
      );
      return;
    }

    const customNamespaces = getTeardownNamespaces(projectName);
    const namespaces =
      customNamespaces.length > 0 ? customNamespaces : [projectName];

    // Collect diagnostic logs on failure (always, regardless of CI)
    if (this._projectsWithFailures.has(projectName)) {
      for (const ns of namespaces) {
        const outputDir = path.join(
          "node_modules",
          ".cache",
          "e2e-test-results",
          "logs",
          projectName,
        );
        await k8sClient.collectDiagnosticLogs(ns, outputDir);
      }
    }

    // Delete namespaces only in CI
    if (process.env.CI === "true") {
      for (const ns of namespaces) {
        console.log(
          `[TeardownReporter] Deleting namespace "${ns}" (project: ${projectName})`,
        );
        await k8sClient.deleteNamespace(ns);
      }
    }
  }
}
