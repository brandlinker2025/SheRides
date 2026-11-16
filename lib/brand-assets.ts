/**
 * 2× PNG masters. The mark is the official curly wordmark cropped from the
 * tagline lockups (variants 4 and 5). Variant 1 (bold wordmark) is not used.
 */
export const brandAssets = {
  mark: {
    dark: { src: "/brand/mark-on-dark.png", width: 1507, height: 1685 },
    light: { src: "/brand/mark-on-light.png", width: 1743, height: 2189 },
    ratio: 1507 / 1685,
  },
  lockup: {
    dark: { src: "/brand/lockup-on-dark.png", width: 1507, height: 1780 },
    light: { src: "/brand/lockup-on-light.png", width: 1743, height: 2284 },
    /** Wider of the two lockups, so a fixed box never shifts when the theme changes. */
    ratio: 1507 / 1780,
  },
  badge: {
    dark: { src: "/brand/badge-on-dark.png", width: 2446, height: 2426 },
    light: { src: "/brand/badge-on-light.png", width: 2441, height: 2419 },
    ratio: 1,
  },
} as const;

export type LogoVariant = keyof typeof brandAssets;
