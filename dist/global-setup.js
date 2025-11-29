/**
 * Global setup for Playwright tests.
 * This file runs once before all tests.
 */
import { KubernetesClientHelper } from "./helpers/kubernetes-client.js";
async function setClusterRouterBaseEnv() {
    const k8sClient = new KubernetesClientHelper();
    process.env.K8S_CLUSTER_ROUTER_BASE =
        await k8sClient.getClusterIngressDomain();
}
export default async function globalSetup() {
    console.log("Running global setup...");
    await setClusterRouterBaseEnv();
}
