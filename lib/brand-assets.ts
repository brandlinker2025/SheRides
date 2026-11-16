/**
 * One official SheRides lockup.
 * Source: the fixed reference (illustration, deep-purple curly wordmark,
 * deep-purple "RIDE • CONNECT • EMPOWER" tagline). The black field was
 * removed; pixel colours were not recolored, tinted, or redrawn.
 * The light-text / dark-background variant is not used.
 */
export const officialLogo = {
  src: "/brand/sherides-official.png",
  width: 3100,
  height: 3648,
} as const;

/** Every previous mark / lockup / badge slot renders this same artwork. */
export const brandAssets = {
  mark: officialLogo,
  lockup: officialLogo,
  badge: officialLogo,
} as const;

export type LogoVariant = keyof typeof brandAssets;
