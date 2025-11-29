import { RHDHDeployment } from "../rhdh-deployment/index.js";
import { test as base } from "@playwright/test";
export const test = base.extend({
    rhdhDeploymentWorker: [
        async ({}, use, workerInfo) => {
            console.log(`Deploying rhdh for plugin ${workerInfo.project.name} in namespace ${workerInfo.project.name}`);
            require("dotenv").config({
                path: `workspaces/${workerInfo.project.name}/e2e/.env`,
                override: true,
            });
            const rhdhDeployment = new RHDHDeployment({
                namespace: workerInfo.project.name,
            });
            try {
                await use(rhdhDeployment);
            }
            finally {
                if (process.env.CI) {
                    console.log(`Deleting namespace ${workerInfo.project.name}`);
                    await rhdhDeployment.destroy();
                }
            }
        },
        { scope: "worker", auto: true },
    ],
    rhdh: [
        async ({ rhdhDeploymentWorker }, use) => {
            console.log("rhdh test scoped");
            await use(rhdhDeploymentWorker);
        },
        { auto: true, scope: "test" },
    ],
    baseURL: [
        async ({ rhdhDeploymentWorker }, use) => {
            await use(rhdhDeploymentWorker.RHDH_BASE_URL);
        },
        { scope: "test" },
    ],
});
export { expect } from "@playwright/test";
