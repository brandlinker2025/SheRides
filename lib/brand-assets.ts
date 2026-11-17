export const brandAssetPath = "/brand/violet-mint";

const mark = { src: `${brandAssetPath}/mark.webp`, width: 620, height: 685 };
const lockup = { src: `${brandAssetPath}/lockup.webp`, width: 620, height: 730 };
const badge = { src: `${brandAssetPath}/icon-192.png`, width: 192, height: 192 };

export const brandAssets = {
  mark: { dark: mark, light: mark, ratio: mark.width / mark.height },
  lockup: { dark: lockup, light: lockup, ratio: lockup.width / lockup.height },
  badge: { dark: badge, light: badge, ratio: 1 },
} as const;

export type LogoVariant = keyof typeof brandAssets;
