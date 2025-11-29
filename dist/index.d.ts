import { RHDHDeployment } from "./rhdh-deployment/index.js";
type RHDHDeploymentTestFixtures = {
    rhdh: RHDHDeployment;
};
type RHDHDeploymentWorkerFixtures = {
    rhdhDeploymentWorker: RHDHDeployment;
};
export declare const test: import("playwright/test").TestType<import("playwright/test").PlaywrightTestArgs & import("playwright/test").PlaywrightTestOptions & RHDHDeploymentTestFixtures, import("playwright/test").PlaywrightWorkerArgs & import("playwright/test").PlaywrightWorkerOptions & RHDHDeploymentWorkerFixtures>;
export { expect } from "@playwright/test";
//# sourceMappingURL=index.d.ts.map