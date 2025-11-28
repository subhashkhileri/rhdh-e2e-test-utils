import { test } from "@playwright/test";
export class UIHelper {
    _page;
    constructor(_page) {
        this._page = _page;
    }
    async navigateTo(url) {
        await test.setTimeout(10000);
        await this._page.goto(url);
    }
}
