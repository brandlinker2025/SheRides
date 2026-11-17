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

test("coral and lavender buttons use dark purple text at WCAG AA", () => {
  const css = `${readFileSync("app/globals.css", "utf8")}\n${readFileSync("components/public-app/public-app.css", "utf8")}`;
  assert.match(css, /\.btn-primary,\s*\n\.sherides-btn-primary\s*\{[^}]*background:\s*#FF6772/i);
  assert.match(css, /\.btn-primary,\s*\n\.sherides-btn-primary\s*\{[^}]*color:\s*#460377/i);
  assert.match(css, /--sr-mint-1:\s*#8af3e9/i);
  assert.match(css, /--sr-mint-2:\s*#3fd0c1/i);
  assert.match(css, /--sr-mint-text:\s*#0a3f3a/i);
  assert.ok(contrast("#0a3f3a", "#8af3e9") >= 4.5);
  assert.ok(contrast("#0a3f3a", "#3fd0c1") >= 4.5);
  // Violet buttons: white label stays readable on the darker half; links on white pass AA.
  assert.ok(contrast("#FFFFFF", "#7244f2") >= 4.5);
  assert.ok(contrast("#7044f5", "#FFFFFF") >= 4.5);
  assert.ok(contrast("#460377", "#FF6772") >= 4.5);
  assert.ok(contrast("#FFFFFF", "#FF6772") < 3);
  assert.ok(contrast("#FF6772", "#1B1324") >= 4.5);
  assert.ok(contrast("#FFB804", "#1B1324") >= 4.5);
  assert.ok(contrast("#F0EBF6", "#1B1324") >= 4.5);
  assert.ok(contrast("#460377", "#F0EBF6") >= 4.5);
  assert.ok(contrast("#7E1CA8", "#F0EBF6") >= 4.5);
  assert.ok(contrast("#05BAA4", "#1B1324") >= 4.5);
  // Dark-logo text colors: Lavender Mist wordmark and Scooter Yellow tagline on Night Ink.
  assert.ok(contrast("#F0EBF6", "#1B1324") >= 4.5);
  assert.ok(contrast("#FFB804", "#1B1324") >= 4.5);
});
