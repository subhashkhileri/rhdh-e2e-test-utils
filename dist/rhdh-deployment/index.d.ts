import { KubernetesClientHelper } from "../helpers/kubernetes-client.js";
type DeploymentMethod = "helm" | "operator";
type InstallationInput = {
  version?: string;
  namespace: string;
  appConfig?: string;
  secrets?: string;
  dynamicPlugins?: string;
  method?: DeploymentMethod;
  valueFile?: string;
  subscription?: string;
};
type HelmInstallation = {
  method: "helm";
  valueFile: string;
};
type OperatorInstallation = {
  method: "operator";
  subscription: string;
};
type InstallationBase = {
  version: string;
  namespace: string;
  appConfig: string;
  secrets: string;
  dynamicPlugins: string;
};
type Installation = InstallationBase &
  (HelmInstallation | OperatorInstallation);
export declare class RHDHDeployment {
  k8sClient: KubernetesClientHelper;
  RHDH_BASE_URL: string;
  installation: Installation;
  constructor(input: InstallationInput);
  deploy(): Promise<void>;
  private applyAppConfig;
  private applySecrets;
  private applyDynamicPlugins;
  private deployWithHelm;
  private deployWithOperator;
  restartRollout(): Promise<void>;
  waitUntilReady(timeout?: number): Promise<void>;
  destroy(): Promise<void>;
  private resolveChartVersion;
  private normalizeInstallation;
  overrideInstallation(input: InstallationInput): Promise<void>;
  private buildBaseUrl;
  private log;
  saveLogs(): Promise<void>;
}
export {};
//# sourceMappingURL=index.d.ts.map
