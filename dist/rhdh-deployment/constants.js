import path from "path";
// Navigate from dist/rhdh-deployment/ to package root
const PACKAGE_ROOT = path.resolve(import.meta.dirname, "../..");
export const DEFAULT_CONFIG_PATHS = {
    appConfig: path.join(PACKAGE_ROOT, "src/rhdh-deployment/config/app-config-rhdh.yaml"),
    secrets: path.join(PACKAGE_ROOT, "src/rhdh-deployment/config/rhdh-secrets.yaml"),
    dynamicPlugins: path.join(PACKAGE_ROOT, "src/rhdh-deployment/config/dynamic-plugins.yaml"),
    helm: {
        valueFile: path.join(PACKAGE_ROOT, "src/rhdh-deployment/helm/value_file.yaml"),
    },
    operator: {
        subscription: path.join(PACKAGE_ROOT, "src/rhdh-deployment/operator/subscription.yaml"),
    },
};
export const CHART_URL = "oci://quay.io/rhdh/chart";
