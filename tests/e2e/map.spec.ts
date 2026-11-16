import fs from "node:fs";
import { expect, test } from "@playwright/test";

test("ride map renders a Dhaka route", async ({ page }) => {
  test.setTimeout(90_000);
  fs.mkdirSync("/opt/cursor/artifacts", { recursive: true });
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const tiles = page.waitForResponse(
    (response) => response.url().includes("tiles.openfreemap.org") && response.ok(),
    { timeout: 45_000 },
  );
  const vectorTile = page.waitForResponse(
    (response) => response.url().includes(".pbf") && response.ok(),
    { timeout: 45_000 },
  );
  await page.goto("/ride-map", { waitUntil: "domcontentloaded" });
  const map = page.getByTestId("ride-map");
  await expect(map).toBeVisible();
  await tiles;
  await expect(map).toHaveAttribute("data-map-state", "ready", { timeout: 45_000 });
  const canvas = map.locator("canvas.maplibregl-canvas");
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThan(200);
  expect(box?.height ?? 0).toBeGreaterThan(280);
  await expect(page.getByTestId("route-summary")).toContainText(/km/);
  await expect(page.getByRole("link", { name: "OpenStreetMap" })).toBeVisible();
  await expect(page.getByText("৳").first()).toBeVisible();
  await expect(page.locator("body")).not.toContainText("waiting for a route");
  await expect(page.locator("body")).not.toContainText("LIVE MAP");
  expect(pageErrors, pageErrors.join("\n")).toEqual([]);
  await vectorTile;
  await page.waitForTimeout(1000);

  await page.screenshot({ path: "/opt/cursor/artifacts/ride-map-desktop.png", fullPage: false });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(800);
  await expect(map.locator("canvas.maplibregl-canvas")).toBeVisible();
  await page.screenshot({ path: "/opt/cursor/artifacts/ride-map-mobile.png", fullPage: false });
});
