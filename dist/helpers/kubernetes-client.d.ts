import * as k8s from "@kubernetes/client-node";
/**
 * Kubernetes client wrapper with proper abstraction
 */
declare class KubernetesClient {
    private kc;
    private k8sApi;
    constructor();
    /**
     * Create or update a ConfigMap from a file
     */
    createOrUpdateConfigMap(name: string, namespace: string, configFilePath: string, dataKey?: string): Promise<k8s.V1ConfigMap>;
    /**
     * Create a namespace if it doesn't exist
     */
    createNamespaceIfNotExists(namespace: string): Promise<k8s.V1Namespace>;
    /**
     * Apply a Kubernetes manifest from a YAML file
    //  */
    /**
     * Apply a Kubernetes resource dynamically
     */
    /**
     * Create or update a Secret
     */
    private applySecret;
    /**
     * Create or update a ConfigMap from a plain object
     */
    applyConfigMapFromObject(name: string, data: Record<string, any>, namespace: string): Promise<void>;
    /**
     * Create or update a Secret from a plain object
     */
    applySecretFromObject(name: string, data: Record<string, any>, namespace: string): Promise<void>;
    /**
     * Delete a namespace
     */
    deleteNamespace(namespace: string): Promise<void>;
}
export { KubernetesClient };
//# sourceMappingURL=kubernetes-client.d.ts.map