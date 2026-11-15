import fs from "node:fs";
import { expect, test, type Page } from "@playwright/test";

type Row = {
  page: string;
  control: string;
  kind: "link" | "button" | "route";
  result: "pass" | "fail";
  detail: string;
};

const PUBLIC = ["/", "/login", "/signup", "/partner", "/download", "/admin-login"];
const GUARDED = [
  "/go",
  "/go?tab=rides",
  "/go?tab=rider",
  "/places",
  "/profile",
  "/notifications",
  "/go/apply",
  "/admin",
  "/admin/go",
  "/admin/verifications",
  "/admin/users",
  "/admin/user-details",
  "/pending-approval",
];
const RETIRED = ["/safety", "/rider-benefits", "/admin/emergency-alerts"];

const rows: Row[] = [];

function record(row: Row) {
  rows.push(row);
}

async function isNotFound(page: Page) {
  const title = await page.title();
  const body = await page.locator("body").innerText();
  return /404|page could not be found|this page could not be found/i.test(`${title}\n${body}`);
}

test("public pages, buttons, and retired SOS routes", async ({ page }) => {
  test.setTimeout(180_000);
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  for (const path of PUBLIC) {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status() ?? 0, path).toBeLessThan(400);
    expect(await isNotFound(page), path).toBe(false);
    record({ page: path, control: "(page load)", kind: "route", result: "pass", detail: page.url() });

    if (["/", "/login", "/partner", "/signup", "/download"].includes(path)) {
      const name = path === "/" ? "home" : path.slice(1);
      await page.screenshot({ path: `/opt/cursor/artifacts/sherides-${name}.png`, fullPage: true });
    }
    if (path === "/partner") {
      const body = await page.locator("body").innerText();
      expect(body, "car options stay hidden").not.toMatch(/কার ড্রাইভার|car driver|নিজের গাড়ি|own car/i);
      expect(body).toMatch(/বাইক|স্কুটার/);
    }

    const links = page.locator("a[href]:visible");
    const linkCount = await links.count();
    const seen = new Set<string>();
    for (let i = 0; i < linkCount; i += 1) {
      const link = links.nth(i);
      const href = await link.getAttribute("href");
      const text = ((await link.innerText()) || (await link.getAttribute("aria-label")) || "link").replace(/\s+/g, " ").trim().slice(0, 80);
      if (!href || seen.has(href)) continue;
      seen.add(href);
      if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#")) {
        record({ page: path, control: text, kind: "link", result: "pass", detail: href });
        continue;
      }
      const target = new URL(href, page.url());
      if (target.origin !== new URL(page.url()).origin) {
        record({ page: path, control: text, kind: "link", result: "pass", detail: `external ${target.href}` });
        continue;
      }
      const opened = await page.request.get(target.pathname + target.search);
      const ok = opened.status() < 400;
      record({
        page: path,
        control: text,
        kind: "link",
        result: ok ? "pass" : "fail",
        detail: `${target.pathname}${target.search} → ${opened.status()}`,
      });
      expect(ok, `${path} link ${text}`).toBe(true);
    }

    const buttons = page.locator("button:visible");
    const buttonCount = await buttons.count();
    for (let i = 0; i < buttonCount; i += 1) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      const button = page.locator("button:visible").nth(i);
      const text = ((await button.innerText().catch(() => "")) || (await button.getAttribute("aria-label")) || "button")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80);
      const before = pageErrors.length;
      await button.click({ timeout: 4000 }).catch(async () => {
        await button.click({ timeout: 4000, force: true });
      });
      await page.waitForTimeout(200);
      const crashed = pageErrors.length > before;
      const missing = await isNotFound(page);
      const ok = !crashed && !missing;
      record({
        page: path,
        control: text || "button",
        kind: "button",
        result: ok ? "pass" : "fail",
        detail: crashed ? pageErrors[pageErrors.length - 1] : missing ? "404 after click" : page.url(),
      });
      expect(ok, `${path} button ${text}`).toBe(true);
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/", "/login", "/partner", "/download"]) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const name = path === "/" ? "home" : path.slice(1);
    await page.screenshot({ path: `/opt/cursor/artifacts/sherides-${name}-mobile.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1280, height: 720 });

  for (const path of GUARDED) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const landed = new URL(page.url()).pathname;
    const ok = landed === "/login" || landed === "/admin-login";
    record({
      page: path,
      control: "(signed-out guard)",
      kind: "route",
      result: ok ? "pass" : "fail",
      detail: `lands on ${landed}`,
    });
    expect(ok, path).toBe(true);
    expect(await isNotFound(page), path).toBe(false);
  }

  for (const path of RETIRED) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const landed = new URL(page.url()).pathname;
    const ok = landed === "/go" || landed === "/login" || landed === "/admin-login" || landed === "/admin/go";
    record({
      page: path,
      control: "(retired SOS route)",
      kind: "route",
      result: ok ? "pass" : "fail",
      detail: `lands on ${landed}`,
    });
    expect(ok, path).toBe(true);
    expect(await isNotFound(page), path).toBe(false);
  }

  fs.mkdirSync("/opt/cursor/artifacts", { recursive: true });
  fs.writeFileSync("/opt/cursor/artifacts/button-audit.json", JSON.stringify(rows, null, 2));
});
