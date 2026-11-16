import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const n = hex.replace("#", "");
    const ch = [0, 2, 4].map((i) => {
      const c = parseInt(n.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test("coral buttons use deep purple text at WCAG AA", () => {
  const css = `${readFileSync("app/globals.css", "utf8")}\n${readFileSync("app/partner/partner.css", "utf8")}`;
  assert.match(css, /\.btn-primary,\s*\n\.sherides-btn-primary\s*\{[^}]*background:\s*#FF6772/i);
  assert.match(css, /\.btn-primary,\s*\n\.sherides-btn-primary\s*\{[^}]*color:\s*#460377/i);
  assert.match(css, /\.partner-cta\s*\{[^}]*background:\s*#FF6772/i);
  assert.match(css, /\.partner-cta\s*\{[^}]*color:\s*#460377/i);
  assert.ok(contrast("#460377", "#FF6772") >= 4.5);
  assert.ok(contrast("#FFFFFF", "#FF6772") < 3);
  assert.ok(contrast("#FF6772", "#1B1324") >= 4.5);
  assert.ok(contrast("#FFB804", "#1B1324") >= 4.5);
  assert.ok(contrast("#F0EBF6", "#1B1324") >= 4.5);
  assert.ok(contrast("#460377", "#F0EBF6") >= 4.5);
  assert.ok(contrast("#7E1CA8", "#F0EBF6") >= 4.5);
  assert.ok(contrast("#05BAA4", "#1B1324") >= 4.5);
  assert.ok(contrast("#1B1324", "#E8F6FF") >= 4.5);
  assert.ok(contrast("#1B1324", "#EAF7FF") >= 4.5);
  assert.ok(contrast("#1B1324", "#D9FBFF") >= 4.5);
  assert.ok(contrast("#1B1324", "#FFFFFF") >= 4.5);
  assert.ok(contrast("#460377", "#E8F6FF") >= 4.5);
  assert.ok(contrast("#460377", "#FFFFFF") >= 4.5);
  assert.ok(contrast("#7E1CA8", "#E8F6FF") >= 4.5);
  assert.ok(contrast("#7A4E00", "#E8F6FF") >= 4.5);
  assert.ok(contrast("#9B2340", "#FFFFFF") >= 4.5);
  assert.ok(contrast("#FFFFFF", "#460377") >= 4.5);
});

test("light sky is the default and the official logo is not recolored", () => {
  const css = readFileSync("app/globals.css", "utf8");
  const theme = readFileSync("lib/theme-context.tsx", "utf8");
  const layout = readFileSync("app/layout.tsx", "utf8");
  const logo = readFileSync("components/ui/Logo.tsx", "utf8");
  const assets = readFileSync("lib/brand-assets.ts", "utf8");
  const root = css.split("html[data-theme=\"dark\"] {")[0];
  assert.match(root, /color-scheme:\s*light/);
  assert.match(root, /#E8F6FF/);
  assert.match(root, /#D9FBFF/);
  assert.match(root, /rgba\(79,\s*216,\s*255/);
  assert.match(root, /rgba\(92,\s*255,\s*216/);
  assert.doesNotMatch(root, /color-scheme:\s*dark/);
  assert.match(theme, /useState<Theme>\("light"\)/);
  assert.match(layout, /data-theme="light"/);
  assert.match(layout, /t==='dark'\?'dark':'light'/);
  assert.match(assets, /sherides-official\.png/);
  assert.doesNotMatch(assets, /on-dark|on-light/);
  assert.match(logo, /sherides-official|officialLogo/);
  assert.doesNotMatch(logo, /on-dark|on-light|brand-logo-dark/);
});
