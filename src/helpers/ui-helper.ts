import { Page, test } from "@playwright/test";

export class UIHelper {
  constructor(private _page: Page) {}

  async navigateTo(url: string) {
    await test.setTimeout(10000);
    await this._page.goto(url);
  }
}