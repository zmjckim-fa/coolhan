# Design Parameterization System

## Overview

Diversifying only the database and API is not enough. **CSS, colors, layout, and typography must also be applied differently per project.**

This system:
1. Systematizes the colors and design philosophies used online
2. Modularizes the UI so that swapping the CSS set alone changes the entire UI, even after development is complete
3. Automatically determines concrete colors/typography/layout when the developer selects abstract concepts like "modern," "cool," or "vibrant"

---

## 1. Design Characteristic Classification

### 1.1 Design Style Dimensions

Defines the key characteristics of online design as a multidimensional space:

```
┌─────────────────────────────────────────────────────────────┐
│ Dimension 1: Warmth                                          │
│  ├─ Cool ←───────────────┼───────────→ Warm
│  └─ Traits: blue/purple ←──────────────┼───────────→ orange/red
│                                                              │
│ Dimension 2: Energy Level                                   │
│  ├─ Calm ←───────────────┼───────────→ Vibrant
│  └─ Traits: gray tones ←──────────────────┼───────────→ saturated colors
│                                                              │
│ Dimension 3: Modernity                                      │
│  ├─ Classic ←───────────────┼───────────→ Modern
│  └─ Traits: dependent ←──────────────────┼───────────→ minimal/geometric
│                                                              │
│ Dimension 4: Formality                                      │
│  ├─ Casual ←───────────────┼───────────→ Formal
│  └─ Traits: rounded corners ←──────────────┼───────────→ sharp corners
│                                                              │
│ Dimension 5: Complexity                                     │
│  ├─ Minimal ←───────────────┼───────────→ Rich
│  └─ Traits: minimal elements ←───────────┼───────────→ many visual elements
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Design Profile Definitions

Each profile is defined by its position across the 5 dimensions:

```
Profile name: "Elegant"
  Warmth: 80 (warm)
  Energy: 30 (calm)
  Modernity: 70 (modern)
  Formality: 80 (formal)
  Complexity: 40 (toward minimal)
  
Traits: Refined, high-end atmosphere; suited to finance/healthcare

Profile name: "Fresh"
  Warmth: 50 (neutral)
  Energy: 75 (vibrant)
  Modernity: 85 (latest modern)
  Formality: 40 (casual)
  Complexity: 60 (average)
  
Traits: Young and lively atmosphere; suited to social media/startups

Profile name: "Trustworthy"
  Warmth: 40 (cool)
  Energy: 40 (calm)
  Modernity: 60 (modern)
  Formality: 70 (formal)
  Complexity: 30 (minimal)
  
Traits: Stable and reliable atmosphere; suited to finance/enterprise
```

---

## 2. Color Definition System

### 2.1 Base Color Palette Library

#### A. Primary Color Groups

```yaml
color_group_1: "Blue Family"
  traits: trust, stability, professionalism
  online_use: corporate sites, finance, healthcare
  palette:
    - "Sky Blue": "#87CEEB"
    - "Deep Blue": "#1E3A8A"
    - "Navy": "#0F172A"
    - "Light Blue": "#E0F2FE"
    - "Indigo": "#4F46E5"

color_group_2: "Green Family"
  traits: growth, nature, freshness
  online_use: ecology, health, startups
  palette:
    - "Lime Green": "#32CD32"
    - "Forest Green": "#228B22"
    - "Sage Green": "#9DC183"
    - "Mint Green": "#98FF98"
    - "Emerald": "#50C878"

color_group_3: "Orange Family"
  traits: warmth, energy, activity
  online_use: food, entertainment, events
  palette:
    - "Bright Orange": "#FF9500"
    - "Deep Orange": "#FF6B35"
    - "Peach": "#FFBC94"
    - "Amber": "#FF8C00"
    - "Apricot": "#FBCF8E"

color_group_4: "Purple Family"
  traits: creativity, luxury, mystery
  online_use: creative, fashion, technology
  palette:
    - "Lavender": "#E6D7F0"
    - "Amethyst": "#9966CC"
    - "Deep Purple": "#663399"
    - "Violet": "#EE82EE"
    - "Indigo": "#4B0082"

color_group_5: "Red Family"
  traits: urgency, passion, caution
  online_use: error states, discounts, warnings
  palette:
    - "Bright Red": "#FF4444"
    - "Deep Red": "#8B0000"
    - "Pink": "#FF69B4"
    - "Rose": "#FF007F"
    - "Coral": "#FF7F50"

color_group_6: "Gray Family"
  traits: neutral, background, de-emphasis
  online_use: backgrounds, text, secondary colors
  palette:
    - "Light Gray": "#F3F4F6"
    - "Medium Gray": "#9CA3AF"
    - "Dark Gray": "#374151"
    - "Charcoal": "#1F2937"
    - "Near Black": "#111827"
```

#### B. Psychology-Based Color Combinations

```
Combination 1: "Trust + Activity"
  Primary: Deep Blue (#1E3A8A)
  Secondary: Orange (#FF9500)
  Accent: White (#FFFFFF)
  Use: finance apps, e-commerce
  Psychological effect: safe yet active

Combination 2: "Nature + Modernity"
  Primary: Sage Green (#9DC183)
  Secondary: Deep Charcoal (#1F2937)
  Accent: Bright Orange (#FF9500)
  Use: eco/lifestyle
  Psychological effect: eco-friendly yet trendy

Combination 3: "Luxury + Sophistication"
  Primary: Deep Purple (#663399)
  Secondary: Gold (#FFD700)
  Accent: Off-White (#F5F5F0)
  Use: fashion, beauty, premium services
  Psychological effect: luxurious and exclusive
```

### 2.2 Color Parity - Accessibility

```
Every color combination must satisfy:
✓ WCAG AA standard: contrast ratio ≥ 4.5:1 (text)
✓ WCAG AAA standard: contrast ratio ≥ 7:1 (important text)
✓ Color-blind friendly: do not convey information by color alone

Example:
  - Error indicator: red (color) + "✕" symbol (shape)
  - Success indicator: green (color) + "✓" symbol (shape)
```

---

## 3. Typography System

### 3.1 Font Selection Parameters

```yaml
font_selection:
  
  # Body font selection
  body_font:
    - "Serif (traditional)": "'Georgia', serif"
    - "Sans-Serif (modern)": "'Segoe UI', sans-serif"
    - "Monospace (technical)": "'Courier New', monospace"
  
  # Heading font selection
  heading_font:
    - "Bold Sans": "'Montserrat', sans-serif"
    - "Light Modern": "'Poppins', sans-serif"
    - "Display": "'Playfair Display', serif"
  
  # Font size scale
  font_scale:
    - "aggressive": "1.618 (golden ratio)"
    - "moderate": "1.5 (perfect fourth)"
    - "conservative": "1.25 (major third)"
    
  # Letter Spacing
  letter_spacing:
    - "tight": "-0.5px"
    - "normal": "0px"
    - "loose": "1px"
    
  # Line Height
  line_height:
    - "compact": "1.3"
    - "normal": "1.6"
    - "spacious": "1.9"

example_combination_1:
  design_profile: "Elegant"
  body_font: "'Georgia', serif"
  heading_font: "'Playfair Display', serif"
  font_scale: 1.618
  letter_spacing: "1px"
  line_height: 1.6
  result: refined, high-end typography

example_combination_2:
  design_profile: "Fresh"
  body_font: "'Segoe UI', sans-serif"
  heading_font: "'Poppins', sans-serif"
  font_scale: 1.5
  letter_spacing: "0px"
  line_height: 1.6
  result: modern, lively typography
```

---

## 4. Layout & Spacing System

### 4.1 Grid & Spacing Parameters

```yaml
spacing_system:
  
  # Base Spacing Unit
  base_unit:
    - "4px": "fine adjustment"
    - "8px": "standard"
    - "16px": "generous"
  
  # Container max width
  container_width:
    - "960px": "classic"
    - "1200px": "modern standard"
    - "1440px": "wide"
  
  # Border Radius
  border_radius:
    - "0px": "sharp (formal)"
    - "4px": "slightly rounded"
    - "8px": "moderately rounded"
    - "16px": "very rounded (casual)"
  
  # Shadow
  shadow_style:
    - "flat": "no shadow (flat design)"
    - "subtle": "soft shadow (modern)"
    - "prominent": "strong shadow (depth)"

example_combination_1:
  design_profile: "Modern Minimal"
  base_unit: "8px"
  container_width: "1200px"
  border_radius: "0px"
  shadow_style: "flat"
  result: clean, minimal layout

example_combination_2:
  design_profile: "Warm Casual"
  base_unit: "16px"
  container_width: "960px"
  border_radius: "16px"
  shadow_style: "subtle"
  result: spacious, friendly layout
```

### 4.2 Responsive Design Parameters

```yaml
responsive_definition:
  
  breakpoints:
    - "mobile": "< 640px (base)"
    - "tablet": "640px ~ 1024px"
    - "desktop": "≥ 1024px"
  
  # Mobile-first or desktop-first
  design_approach:
    - "mobile_first": "start from small screens"
    - "desktop_first": "start from large screens"
  
  # Layout changes
  layout_changes:
    - "dramatic": "completely different layout on large screens"
    - "gradual": "ratio adjustments only"
```

---

## 5. Modularized CSS Structure

### 5.1 A structure where the entire UI can be swapped via CSS sets

```
/css/
  ├─ config/
  │  ├─ colors.css          # color definitions (variables only)
  │  ├─ typography.css      # fonts, sizes, letter spacing
  │  ├─ spacing.css         # spacing, grid
  │  └─ effects.css         # shadows, animations
  │
  ├─ components/
  │  ├─ button.css          # button (references color variables)
  │  ├─ card.css            # card (references spacing variables)
  │  ├─ form.css            # form elements
  │  ├─ nav.css             # navigation
  │  └─ modal.css           # modal
  │
  ├─ layouts/
  │  ├─ grid.css            # grid system
  │  ├─ flexbox.css         # flexbox layout
  │  └─ responsive.css      # responsive definitions
  │
  ├─ profiles/
  │  ├─ elegant.css         # Elegant profile
  │  ├─ fresh.css           # Fresh profile
  │  ├─ trustworthy.css     # Trustworthy profile
  │  └─ vibrant.css         # Vibrant profile
  │
  └─ main.css               # integration
```

### 5.2 CSS Variables Implementation

```css
/* /css/config/colors.css - Trustworthy profile */

:root {
  /* Profile: Trustworthy */
  --primary-color: #1E3A8A;      /* deep blue */
  --secondary-color: #9CA3AF;    /* gray */
  --accent-color: #FF9500;       /* orange */
  
  --success-color: #22C55E;
  --warning-color: #EAB308;
  --error-color: #EF4444;
  
  --bg-light: #F3F4F6;
  --bg-main: #FFFFFF;
  --text-primary: #1F2937;
  --text-secondary: #6B7280;
  
  /* Contrast verification: 
     text vs background = 1F2937 vs F3F4F6
     contrast ratio: 12:1 ✓ (meets WCAG AAA)
  */
}

/* /css/config/typography.css - Elegant typography */

:root {
  --font-body: 'Georgia', serif;
  --font-heading: 'Playfair Display', serif;
  
  --font-scale: 1.618;
  --font-base: 16px;
  
  --font-h1: calc(var(--font-base) * var(--font-scale) * var(--font-scale) * var(--font-scale));
  --font-h2: calc(var(--font-base) * var(--font-scale) * var(--font-scale));
  --font-h3: calc(var(--font-base) * var(--font-scale));
  
  --line-height: 1.6;
  --letter-spacing: 1px;
}

/* /css/config/spacing.css */

:root {
  --base-unit: 8px;
  --space-xs: calc(var(--base-unit) * 1);   /* 8px */
  --space-sm: calc(var(--base-unit) * 2);   /* 16px */
  --space-md: calc(var(--base-unit) * 4);   /* 32px */
  --space-lg: calc(var(--base-unit) * 8);   /* 64px */
  
  --border-radius: 4px;
  --shadow: 0 1px 3px rgba(0,0,0,0.1);
}

/* /css/components/button.css */

.btn {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--border-radius);
  font-family: var(--font-body);
  font-size: 16px;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
  border: none;
}

.btn-primary:hover {
  background-color: #163066;  /* darker blue */
}
```

### 5.3 Profile Switching

```html
<!-- When the user selects a profile, the CSS set is swapped -->

<!-- Default: Trustworthy profile -->
<link rel="stylesheet" href="/css/main.css">

<!-- Dynamic swap via JavaScript -->
<script>
function switchDesignProfile(profileName) {
  // Load /css/profiles/[profileName].css
  // Replace all :root variables
  // Instantly update the entire UI
}
</script>
```

---

## 6. Design Parameter Selection Process

### 6.1 User Selection Flow

```
Step 1: Select solution type
  └─ e.g., "E-Commerce Mall"

Step 2: Select base design profile (options provided)
  ├─ "Trustworthy" ← recommended for finance, enterprise
  ├─ "Elegant" ← recommended for luxury, premium
  ├─ "Fresh" ← recommended for startups, social
  └─ "Vibrant" ← recommended for food, entertainment

Step 3: Customize profile (optional)
  ├─ Change primary color: blue → green
  ├─ Adjust warmth: cool → warm
  ├─ Font selection: Georgia → Poppins
  └─ Adjust spacing: 8px → 16px

Step 4: Validate color palette
  ├─ Automatic contrast check (WCAG)
  ├─ Color-blind friendliness check
  └─ Cross-device consistency check

Step 5: Generate CSS
  └─ /css/profiles/[projectName].css generated automatically
```

### 6.2 Profile Recommendations by Industry

```yaml
retail_shopping:
  recommended_profile: "Fresh"
  reason: "needs a modern, energetic atmosphere"
  colors: green/orange combination
  typography: Sans-serif, Poppins

financial_services:
  recommended_profile: "Trustworthy"
  reason: "emphasizes stability and professionalism"
  colors: blue/gray combination
  typography: Serif + sans-serif combination

beauty_fashion:
  recommended_profile: "Elegant"
  reason: "luxurious, refined atmosphere"
  colors: purple/gold combination
  typography: Serif, Playfair Display

food_entertainment:
  recommended_profile: "Vibrant"
  reason: "fun, active feel"
  colors: orange/pink combination
  typography: Sans-serif, Poppins
```

---

## 7. Design System Documentation

### 7.1 Auto-Generated Design Guide

```
/docs/DESIGN_GUIDE.md auto-generated content:

# Design System Guide - [Project Name]

## Selected Profile
- Name: "Trustworthy"
- Warmth: 40 (cool)
- Energy: 40 (calm)
- Modernity: 60 (modern)
- Formality: 70 (formal)
- Complexity: 30 (minimal)

## Color Palette
- Primary: #1E3A8A (deep blue)
- Secondary: #9CA3AF (gray)
- Accent: #FF9500 (orange)
- Success: #22C55E
- Error: #EF4444

## Contrast Verification ✓
- text vs background: 12:1 (WCAG AAA)
- color-blind friendly: ✓

## Typography
- Body: Georgia, serif
- Heading: Playfair Display, serif
- Font size scale: 1.618
- Line height: 1.6

## Spacing System
- Base unit: 8px
- xs: 8px, sm: 16px, md: 32px, lg: 64px

## Border Radius
- Button: 4px
- Card: 4px
- Modal: 8px

## CSS File Location
- /css/profiles/[projectName].css
```

---

## 8. Adding New Profiles

### 8.1 New Profile Template

```yaml
add_new_profile:
  
  name: "[new profile name]"
  description: "[which industry/use is it suited for]"
  
  dimensions:
    warmth: [0-100, 50=neutral]
    energy: [0-100, 50=neutral]
    modernity: [0-100, 50=classic-modern balance]
    formality: [0-100, 50=casual-formal balance]
    complexity: [0-100, 50=minimal-rich balance]
  
  color_palette:
    primary: "[color name] (#RRGGBB)"
    secondary: "[color name] (#RRGGBB)"
    accent: "[color name] (#RRGGBB)"
  
  typography:
    body_font: "[font name], [serif|sans-serif|monospace]"
    heading_font: "[font name], [serif|sans-serif]"
    font_scale: [1.25|1.5|1.618]
    line_height: "[1.3|1.6|1.9]"
  
  layout:
    base_unit: "[4px|8px|16px]"
    border_radius: "[0px|4px|8px|16px]"
    shadow_style: "[flat|subtle|prominent]"
  
  industry_recommendations:
    - "[industry 1]"
    - "[industry 2]"
```

---

## 9. Benefits of Modularized CSS

```
Benefit 1: Fast theme changes
  After development, swapping the CSS file alone changes the entire UI
  
Benefit 2: A/B testing
  Test different profiles in parallel to measure user response
  
Benefit 3: Consistency
  All components use the same variables, maintaining consistent design
  
Benefit 4: Maintenance
  Changing a color = editing 1 file (not dozens of files)
  
Benefit 5: Extensibility
  When adding new components, you only need to reference existing variables
  
Benefit 6: Accessibility
  Verify color contrast in one place, applied automatically to all combinations
```

---

## Conclusion

This system:
1. **Lets the developer choose colors, fonts, and spacing** (security + personalization)
2. **Modularizes CSS** so the **entire theme can be swapped even after development is complete**
3. Converts **abstract concepts** (Elegant, Fresh) into **concrete variables**
4. Ensures all color combinations comply with WCAG through **automatic accessibility checks**
5. Simplifies the initial choice with **industry-specific recommendations**

---

**Version**: 1.0
**Date**: 2026-05-27
**Status**: Draft - awaiting team feedback
