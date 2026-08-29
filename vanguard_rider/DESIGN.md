---
name: Vanguard Rider
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1c1c'
  surface-container: '#1f2020'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e4e2e1'
  on-surface-variant: '#e7bdb8'
  inverse-surface: '#e4e2e1'
  inverse-on-surface: '#303030'
  outline: '#ae8883'
  outline-variant: '#5d3f3c'
  surface-tint: '#ffb4ab'
  primary: '#ffb4ab'
  on-primary: '#690006'
  primary-container: '#e31e24'
  on-primary-container: '#fffafa'
  inverse-primary: '#c00014'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#4a4949'
  on-secondary-container: '#bab8b7'
  tertiary: '#c5c7c8'
  on-tertiary: '#2e3132'
  tertiary-container: '#727475'
  on-tertiary-container: '#fafbfc'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb4ab'
  on-primary-fixed: '#410002'
  on-primary-fixed-variant: '#93000d'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474646'
  tertiary-fixed: '#e1e3e4'
  tertiary-fixed-dim: '#c5c7c8'
  on-tertiary-fixed: '#191c1d'
  on-tertiary-fixed-variant: '#454748'
  background: '#131313'
  on-background: '#e4e2e1'
  surface-variant: '#353535'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
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
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base-unit: 8px
  container-padding-mobile: 20px
  container-padding-desktop: 80px
  gutter: 24px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style

The design system is engineered to evoke a sense of **premium confidence, empowerment, and safety**. It moves away from traditional "feminine" tropes, instead embracing a **Modern-Professional** aesthetic that balances toughness with elegance. 

The visual language is characterized by:
- **Confidence:** Bold typography and high-contrast color pairings.
- **Safety & Precision:** Technical, clean layouts with generous breathing room.
- **Toughness:** Deep charcoal surfaces that suggest asphalt and leather, accented by a high-octane red.
- **Modernity:** Large-radius curves and subtle glassmorphism to create a high-end digital experience.

The target audience consists of urban women riders who value reliability, community, and style. The UI must feel as sturdy and well-engineered as the motorcycles they ride.

## Colors

This design system utilizes a high-contrast dark-mode first palette to reflect the "on the road" lifestyle.

- **Primary (Vanguard Red):** `#E31E24`. Used for critical calls to action, safety indicators, and branding accents.
- **Secondary (Obsidian):** `#121212`. The primary background color. It provides a deep, premium canvas that makes imagery and text pop.
- **Tertiary (Cloud White):** `#F8F9FA`. Used for primary typography and surfaces in light-mode variations.
- **Neutral (Asphalt):** `#2A2A2A`. Used for container backgrounds, input fields, and borders to create depth against the Obsidian base.
- **Gradients:** Subtle warm overlays (e.g., `linear-gradient(135deg, #E31E24 0%, #A31216 100%)`) are used sparingly on buttons and active states to add dimension.

## Typography

The typography strategy prioritizes readability and impact across English and Bengali scripts.

- **Headlines (Montserrat):** Chosen for its geometric strength and confident width. Large display sizes should use tighter letter-spacing to appear more "locked-in" and professional.
- **Body & UI (Inter):** A systematic sans-serif that ensures maximum legibility for safety information, technical specs, and community forum posts.
- **Bengali Support:** Ensure the rendering engine defaults to a clean Unicode font (like Hind Siliguri or Noto Sans Bengali) that matches the x-height of Inter for a seamless bilingual experience.
- **Hierarchy:** Use `label-caps` for eyebrows and small metadata to maintain a clean, organized structure.

## Layout & Spacing

The layout follows a **fluid-to-fixed hybrid model** to ensure a premium feel on all devices.

- **Mobile (390px):** Single column with 20px side margins. Elements are stacked vertically with generous `stack-md` spacing to prevent a cluttered "budget" look.
- **Tablet (768px):** 8-column grid. Side margins increase to 40px. Cards begin to transition into 2-column horizontal layouts.
- **Desktop (1366px+):** 12-column grid with a maximum content width of 1440px. Side margins are expansive (80px+) to emphasize the premium nature of the brand.
- **Rhythm:** All spacing is derived from an 8px base unit. Use `stack-lg` to separate distinct sections (e.g., Hero from Community Feed) to maintain high-end breathing room.

## Elevation & Depth

This design system uses **Tonal Layering** combined with **Ambient Shadows** to create a sophisticated sense of hierarchy.

- **Surface Tiers:** 
  - Level 0: Obsidian (`#121212`) - The main background.
  - Level 1: Asphalt (`#2A2A2A`) - Cards, navigation bars, and modals.
  - Level 2: Dark Grey (`#3D3D3D`) - Hover states and elevated UI elements.
- **Shadows:** Avoid harsh black shadows. Instead, use soft, diffused shadows with a slight primary tint for elevated elements: `0px 12px 32px rgba(0, 0, 0, 0.5)`.
- **Glassmorphism:** For top navigation bars and mobile overlays, use a backdrop-blur (12px) with a 60% opacity Asphalt fill to maintain context of the underlying content.

## Shapes

The shape language is defined by **expansive, friendly, yet controlled curves**. 

- **Primary Corners:** All main UI components (cards, main buttons, image containers) utilize a **16px (1rem)** radius. This softens the "tough" charcoal/red palette, making it approachable.
- **Secondary Corners:** Smaller elements like tags, chips, and input fields use an **8px (0.5rem)** radius.
- **Iconography:** Use thick-stroke (2px) icons with rounded caps to match the typography's weight and the component's roundedness.

## Components

- **Buttons:** Primary buttons feature a subtle gradient from Vanguard Red to a deeper crimson. They are high-height (56px for mobile) to be "thumb-friendly" for riders on the go.
- **Cards:** Use Level 1 Asphalt background. Images within cards should have a subtle dark overlay at the bottom to ensure white typography remains legible.
- **Inputs:** Dark-themed fields with a 1px border in `#3D3D3D`. On focus, the border transitions to Vanguard Red with a subtle outer glow.
- **Safety Chips:** Specific status indicators (e.g., "Certified Trainer", "Verified Route") should use a ghost-button style with thin red outlines and high-contrast white text.
- **Lists:** Community and event lists should feature high-quality photography thumbnails with 12px rounded corners and chevron indicators for clear affordance.
- **Imagery:** All photos should have a consistent "cinematic" grade—slightly desaturated with high contrast, emphasizing the textures of the road and the bikes.