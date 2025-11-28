import { Page, test } from "@playwright/test";
import { $ } from "zx";

$.verbose = true;

export class UIHelper {
  constructor(private _page: Page) {}

  async navigateTo(url: string) {
    console.log('in navigateTo');
    await $`echo "Navigating to ${url}"`;
    await test.setTimeout(20000);
    await $`sleep 10`;
    await this._page.goto(url);
  }
}