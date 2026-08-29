---
name: Female Biker Community
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#5b3f43'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#8f6f73'
  outline-variant: '#e4bdc2'
  surface-tint: '#bc004b'
  primary: '#b80049'
  on-primary: '#ffffff'
  primary-container: '#e2165f'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb2be'
  secondary: '#5d5e61'
  on-secondary: '#ffffff'
  secondary-container: '#e2e2e5'
  on-secondary-container: '#636467'
  tertiary: '#5a5c5d'
  on-tertiary: '#ffffff'
  tertiary-container: '#737576'
  on-tertiary-container: '#fcfdfe'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd9de'
  primary-fixed-dim: '#ffb2be'
  on-primary-fixed: '#400014'
  on-primary-fixed-variant: '#900038'
  secondary-fixed: '#e2e2e5'
  secondary-fixed-dim: '#c6c6c9'
  on-secondary-fixed: '#1a1c1e'
  on-secondary-fixed-variant: '#454749'
  tertiary-fixed: '#e1e3e4'
  tertiary-fixed-dim: '#c5c7c8'
  on-tertiary-fixed: '#191c1d'
  on-tertiary-fixed-variant: '#454748'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
  accent-magenta: '#E91E63'
  deep-charcoal: '#1A1C1E'
  soft-off-white: '#F8F9FA'
  surface-border: '#E9ECEF'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Montserrat
    fontSize: 34px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.01em
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-margin-desktop: 80px
  container-margin-mobile: 24px
  gutter: 24px
  section-gap: 64px
  component-gap: 16px
---

## Brand & Style

The design system is centered on a **Premium Modern** aesthetic that redefines the motorcycle community experience for women. It balances professional reliability with a high-end social networking atmosphere, moving away from rugged "biker" tropes toward a sophisticated, community-driven space.

The visual narrative is built on three pillars:
- **Empowered Elegance:** Utilizing a refined color palette and expansive white space to evoke a luxury social club feel.
- **Trustworthy Professionalism:** Using structured, information-rich layouts that convey safety and high-quality standards.
- **Social Warmth:** Soft realistic shadows and large-radius curves create a tactile, inviting environment that encourages connection.

The personality is social and sophisticated, designed to feel like a high-end editorial platform rather than a generic dashboard.

## Colors

This design system utilizes a **Premium Light** palette designed to make photography stand out while maintaining high legibility and brand distinction.

- **Primary (Magenta Accent):** `#E91E63`. An elegant, high-energy magenta used for primary actions, active states, and brand highlights. It provides a striking contrast against the neutral base.
- **Secondary (Deep Charcoal):** `#1A1C1E`. Reserved for navigation areas, footers, and high-contrast text to provide a grounded, professional anchor to the light interface.
- **Tertiary (Soft Off-White):** `#F8F9FA`. Used as a secondary background layer to differentiate content sections and card containers from the pure white base.
- **Neutral:** `#FFFFFF`. The core background color, providing maximum "breathing room" and a clean, high-end editorial feel.

## Typography

The typography strategy pairs the geometric confidence of **Montserrat** with the functional precision of **Inter**.

- **Montserrat (Headlines):** Used for all display and headline levels. It should feel bold and authoritative. In display sizes, tighter letter-spacing is required to achieve a professional, "locked-in" editorial look.
- **Inter (Body & UI):** Used for all functional text. It ensures clarity in information-dense areas like event details and community forums. 
- **Scale:** Maintain a clear vertical rhythm by using `body-lg` for primary content and `label-caps` for metadata eyebrows to create a sophisticated hierarchical structure.

## Layout & Spacing

The design system employs a **Fixed Grid** model for desktop to maintain a curated, premium feel, transitioning to a flexible fluid model on smaller screens.

- **Desktop (1440px):** 12-column grid with a 1280px max-width container. Large 80px side margins are used to emphasize the high-end, spacious nature of the community.
- **Tablet (768px - 1024px):** 8-column grid with 40px margins. Content cards should begin to stack or use horizontal carousels.
- **Mobile (Under 768px):** 4-column grid with 24px margins. Navigation elements should transition to a bottom-bar or a clean overlay menu.
- **Rhythm:** All spacing units are multiples of 8px. Large `section-gap` units are essential to prevent the "dashboard" look and maintain a social-first aesthetic.

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and **Tonal Layering**, avoiding harsh lines in favor of soft, realistic depth.

- **Surface Layers:** The base is pure White (`#FFFFFF`). Secondary containers and "behind-the-card" areas use Soft Off-White (`#F8F9FA`) to create subtle separation without adding visual weight.
- **Shadow Profile:** Use extremely soft, wide-dispersion shadows for cards: `0px 10px 30px rgba(26, 28, 30, 0.05)`. This creates a floating "premium card" effect.
- **Navigation Depth:** The Deep Charcoal navigation bar uses a subtle 10% opacity black shadow to appear physically layered above the content. 
- **Interactive States:** On hover, cards should slightly lift (increase shadow blur and offset) to provide clear tactile feedback.

## Shapes

The shape language is defined by **Rounded (Level 2)** corners, which soften the professional charcoal and magenta palette.

- **Main Containers:** Content cards, large image containers, and modals use a 1rem (16px) radius.
- **Interactive Elements:** Primary buttons and input fields use a 0.5rem (8px) radius to maintain a modern, friendly touch.
- **Profile Imagery:** Use circular clipping (pill-shaped) for member avatars to emphasize the social, human-centric nature of the brand.
- **Iconography:** Use a consistent 2px stroke weight with rounded terminals to align with the soft edges of the UI.

## Components

- **Buttons:** Primary buttons use the Magenta accent with white text. They should have a generous height (48px+) and utilize the `label-lg` type style for a bold, confident call to action.
- **Premium Cards:** Cards are the core of the layout. They feature a white background, Level 2 roundedness, and soft ambient shadows. Images within cards should use `aspect-ratio: 16/9` to showcase high-quality photography.
- **Navigation:** The top navigation uses a Deep Charcoal (`#1A1C1E`) background. Links should use Montserrat in a smaller size with high-contrast white text to feel like a high-end utility bar.
- **Input Fields:** Use the Soft Off-White (`#F8F9FA`) for the field background with a subtle 1px border. On focus, the border transitions to Magenta with a very soft outer glow.
- **Chips & Tags:** Small Magenta-tinted backgrounds (10% opacity) with Magenta text are used for category labels (e.g., "Touring", "Technical", "Meetup").
- **Lists:** Community member lists should feature large avatars and a clean horizontal layout with generous 24px padding between items to avoid visual clutter.