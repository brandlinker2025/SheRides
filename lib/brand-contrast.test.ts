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
  assert.match(css, /\.public-mint\s*\{[^}]*background:\s*linear-gradient\(#a7f6df, #50d4bd\)/i);
  assert.match(css, /\.public-mint\s*\{[^}]*color:\s*#103c35/i);
  assert.ok(contrast("#103c35", "#a7f6df") >= 4.5);
  assert.ok(contrast("#103c35", "#50d4bd") >= 4.5);
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
