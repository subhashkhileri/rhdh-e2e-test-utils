import { test } from "@playwright/test";
import { $ } from "zx";
$.verbose = true;
export class UIHelper {
    _page;
    constructor(_page) {
        this._page = _page;
    }
    async navigateTo(url) {
        console.log('in navigateTo');
        await $ `echo "Navigating to ${url}"`;
        await test.setTimeout(20000);
        await $ `sleep 10`;
        await this._page.goto(url);
    }
}
