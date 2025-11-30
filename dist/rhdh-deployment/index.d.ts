import { KubernetesClientHelper } from "../helpers/kubernetes-client.js";
type DeploymentMethod = "helm" | "operator";
export type DeploymentOptions = {
    version?: string;
    namespace: string;
    appConfig?: string;
    secrets?: string;
    dynamicPlugins?: string;
    method?: DeploymentMethod;
    valueFile?: string;
    subscription?: string;
};
type HelmDeploymentConfig = {
    method: "helm";
    valueFile: string;
};
type OperatorDeploymentConfig = {
    method: "operator";
    subscription: string;
};
type DeploymentConfigBase = {
    version: string;
    namespace: string;
    appConfig: string;
    secrets: string;
    dynamicPlugins: string;
};
type DeploymentConfig = DeploymentConfigBase & (HelmDeploymentConfig | OperatorDeploymentConfig);
export declare class RHDHDeployment {
    k8sClient: KubernetesClientHelper;
    rhdhUrl: string;
    deploymentConfig: DeploymentConfig;
    constructor(deploymentOptions: DeploymentOptions);
    deploy(): Promise<void>;
    private _applyAppConfig;
    private _applySecrets;
    private _applyDynamicPlugins;
    private _deployWithHelm;
    private _deployWithOperator;
    rolloutRestart(): Promise<void>;
    waitUntilReady(timeout?: number): Promise<void>;
    teardown(): Promise<void>;
    private _resolveChartVersion;
    private _buildDeploymentConfig;
    configure(deploymentOptions?: DeploymentOptions): Promise<void>;
    private _buildBaseUrl;
    private _log;
}
export {};
//# sourceMappingURL=index.d.ts.map