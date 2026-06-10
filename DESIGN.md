---
name: RiceCare
colors:
  surface: '#f5fbf5'
  surface-dim: '#d5dcd6'
  surface-bright: '#f5fbf5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff5ef'
  surface-container: '#e9efe9'
  surface-container-high: '#e4eae4'
  surface-container-highest: '#dee4de'
  on-surface: '#171d19'
  on-surface-variant: '#3d4a42'
  inverse-surface: '#2c322e'
  inverse-on-surface: '#ecf2ec'
  outline: '#6d7a72'
  outline-variant: '#bccac0'
  surface-tint: '#006c4a'
  primary: '#006948'
  on-primary: '#ffffff'
  primary-container: '#00855d'
  on-primary-container: '#f5fff7'
  inverse-primary: '#68dba9'
  secondary: '#5e5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2e2e2'
  on-secondary-container: '#646464'
  tertiary: '#9b3e3b'
  on-tertiary: '#ffffff'
  tertiary-container: '#ba5551'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#85f8c4'
  primary-fixed-dim: '#68dba9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#005137'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c6'
  on-secondary-fixed: '#1b1b1b'
  on-secondary-fixed-variant: '#474747'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ae'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#7f2928'
  background: '#f5fbf5'
  on-background: '#171d19'
  surface-variant: '#dee4de'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '700'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.5'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-xl:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.2'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
  button-text:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '700'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  touch-target-min: 48px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
  stack-xl: 32px
  inset-container: 20px
  gutter: 16px
---

## Brand & Style
The design system is engineered for **RiceCare**, a high-utility mobile PWA designed for agricultural field use. The brand personality is professional, authoritative, and dependable, bridging the gap between traditional farming and modern technology.

The design style follows a **High-Contrast / Modern** aesthetic. It prioritizes extreme legibility and physical accessibility to account for outdoor environments where glare, movement, and varying lighting conditions are common. The interface is characterized by clean lines, a restricted but powerful color palette, and "chunky" interactive elements that facilitate easy use by users with varying levels of digital literacy or physical dexterity.

## Colors
The palette is rooted in high-visibility contrasts to ensure functional clarity in the field.

- **Primary Emerald (#059669):** Used for primary actions, brand presence, and active states. It represents growth and health.
- **High-Contrast Neutrals:** Pure White (#FFFFFF) is the primary surface color to maximize backlight efficiency, while Slate-900 (#0F172A) and Black (#000000) are reserved for text and viewfinder overlays to ensure a minimum contrast ratio of 7:1.
- **Semantic Logic:** Success (Green) and Warning (Amber) colors are saturated to remain distinct from the primary emerald.
- **Viewfinder Mode:** When using the camera for diagnosis, the UI shifts to a dark-mode overlay (Slate-900) to allow the natural greens of the rice crops to stand out against the interface.

## Typography
This design system utilizes **Inter** for all roles due to its exceptional tall x-height and legibility on mobile screens. 

- **Weight Strategy:** Headlines use Extra-Bold (800) and Bold (700) weights to create a clear visual hierarchy that can be scanned at a glance.
- **Readability:** Body text is set at a minimum of 16px (body-md) to ensure it remains readable under direct sunlight. 
- **Instructional Labels:** Large labels (label-xl) are used for data points like weather, crop age, or diagnostic results, often paired with high-contrast icons.

## Layout & Spacing
The layout follows a **Fluid Grid** model optimized for mobile-first PWA delivery.

- **Thumb-Friendly Zones:** Primary actions are anchored to the bottom third of the screen.
- **The 48px Rule:** Every interactive element (buttons, checkboxes, navigation items) must have a minimum hit area of 48x48px to accommodate field use.
- **Generous Padding:** This design system uses an 8px base grid, but defaults to 24px (stack-lg) for vertical separation between distinct content blocks to prevent accidental taps.
- **Safe Areas:** Horizontal margins are set to 20px (inset-container) to ensure content does not hit the edge of the device bezel.

## Elevation & Depth
In alignment with the professional and high-contrast aesthetic, this design system uses **Bold Borders** and **Tonal Layers** rather than soft shadows.

- **Surface Levels:** The primary background is White. Secondary containers (like cards or inputs) use a very light grey (Slate-50) with a 1px solid border in Slate-200 to define their boundaries.
- **Interactive Depth:** Elements do not "float." Instead, they use "pressed" states (shifting background color slightly darker) to provide tactile feedback.
- **Viewfinder Elevation:** Modal sheets that slide over the camera viewfinder use a semi-opaque Slate-900 surface to maintain the dark-mode context of the camera tool.

## Shapes
The shape language is **Rounded**, strike a balance between friendly approachability and professional utility.

- **Standard Radius:** 0.5rem (8px) for buttons and input fields, providing a modern look that feels substantial.
- **Large Radius:** 1.5rem (24px) for bottom sheets and container cards, creating a clear distinction between the screen background and the active content module.
- **Pill Shapes:** Used exclusively for status tags (e.g., "Healthy", "Warning") to differentiate them from functional buttons.

## Components
- **Chunky Buttons:** Primary buttons are 56px tall with centered 18px Bold text. They use the Emerald-600 background with white text for maximum "clickability."
- **Data Cards:** Content is grouped in cards with a 1px border. Data points (like "Rice Variety") are displayed with a label-md above a headline-lg value.
- **Checkboxes & Radios:** Scaled to 24x24px with high-contrast Emerald fills when active to ensure visibility.
- **Status Banners:** Full-width alerts that sit at the top of the content area, using the semantic Green/Amber/Red background with black text for warning/error and white text for success.
- **Input Fields:** Large, 56px tall fields with a Slate-200 border. Labels remain visible above the field at all times (never placeholder-only) to maintain context during data entry.
- **The "Care-Action" Bar:** A fixed bottom navigation or action bar that houses the primary camera trigger, distinguished by a larger, circular icon that breaks the top edge of the bar.