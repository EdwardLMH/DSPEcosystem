# HSBC HIVE Design Tokens — Integration Guide

**Document Version:** 1.0
**Date:** 2026-04-19
**Scope:** Token structure, platform integration, Figma workflow, component refactoring guide

> **Important:** This is an approximate HIVE-compatible token structure derived from HSBC brand
> guidelines. The canonical source of truth is the official HSBC HIVE Figma library. Validate
> all token values against the live HIVE library before production deployment.

---

## 1. What HIVE Is

HIVE is HSBC's proprietary design language and component system, maintained by the Group Design
team and surfaced through Figma. It defines:

- **Design tokens** — the atomic named values for colour, typography, spacing, border radius, shadow,
  and motion that all HSBC digital products must use
- **Components** — reusable UI building blocks (Button, Input, Card, etc.) built on top of those tokens
- **Patterns** — approved interaction patterns (form layouts, navigation, error states)

Every HSBC frontend — web, iOS, Android, WeChat Mini Program — must consume HIVE tokens rather
than hardcoding values. This ensures visual consistency, accessibility compliance, and enables
brand updates to propagate automatically across all surfaces.

---

## 2. Token File Structure

```
hive-tokens/
├── json/
│   └── hive-tokens.json          ← W3C Design Token format (source of truth)
│                                    Import into Figma via Tokens Studio plugin
│
├── css/
│   └── hive-tokens.css           ← CSS custom properties (--hive-*)
│                                    Import once at web app root
│
├── swift/
│   └── HiveTokens.swift          ← Swift enums + Color(hex:) extension
│                                    Add to iOS Swift Package / Xcode target
│
└── kotlin/
    └── HiveTokens.kt             ← Kotlin objects for Jetpack Compose
                                     Add to Android :hive-tokens module
```

---

## 3. Token Taxonomy

### 3.1 Colour

| Category | Tokens | Usage |
|----------|--------|-------|
| `brand.*` | primary, primaryDark, primaryLight, secondary, white | CTAs, interactive elements, brand surfaces |
| `semantic.*` | success, warning, error, info (+ light variants) | State colours — form validation, alerts, toasts |
| `neutral.*` | n0 → n900 (10-step greyscale) | Text, borders, backgrounds, dividers |
| `jade.*` | base, dark, light, surface | Jade premium tier — gold palette + dark surface |
| `premier.*` | base, light | Premier tier — blue palette |

### 3.2 Typography

| Token | Value | Usage |
|-------|-------|-------|
| `fontFamily.primary` | UniversNext, Arial fallback | All UI text |
| `fontFamily.mono` | Courier New | Account numbers, sort codes |
| `fontSize.xs → 5xl` | 11px → 48px | Scale from captions to display |
| `fontWeight.regular → bold` | 400 → 700 | Weight scale |

**Named text styles (use these, not raw tokens):**

| Style | Size / Weight | Usage |
|-------|--------------|-------|
| `displayLarge` | 40px / Bold | Hero headlines |
| `headingXL` | 28px / SemiBold | Page titles |
| `headingMd` | 20px / SemiBold | Section headers |
| `bodyBase` | 16px / Regular | Body copy |
| `labelBase` | 13px / SemiBold | Form labels, tags |
| `caption` | 11px / Regular | Help text, footnotes |
| `buttonLabel` | 16px / SemiBold | All button text |
| `monoBase` | 16px / Regular | Account numbers |

### 3.3 Spacing

8-point grid with named steps. Always use token values — never hardcode px.

| Token | Value | Common usage |
|-------|-------|-------------|
| `s1` | 4px | Icon gaps, tight label spacing |
| `s2` | 8px | Internal component padding |
| `s3` | 12px | Input vertical padding |
| `s4` | 16px | **Base unit** — standard page padding |
| `s6` | 24px | Card padding |
| `s8` | 32px | Section spacing |

### 3.4 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 4px | Badges, small chips |
| `base` | 6px | **Buttons, inputs** |
| `md` | 8px | **Cards, panels** |
| `lg` | 12px | Large cards, modals |
| `full` | 9999px | Progress bars, pills |

### 3.5 Component Tokens

Pre-composed tokens for common components — always prefer these over raw primitives:

```
HiveComponent.Button.height        → 48px  (WCAG 2.5.5 minimum tap target)
HiveComponent.Input.height         → 52px
HiveComponent.Input.borderColor    → neutral.300
HiveComponent.Input.borderColorFocus → brand.primary
HiveComponent.Input.borderColorError → semantic.error
HiveComponent.Card.borderRadius    → 8px
HiveComponent.ProgressBar.fillColor → brand.primary
```

---

## 4. Platform Integration

### 4.1 Web (React + TypeScript)

```tsx
// Step 1: Import CSS custom properties at app root (index.tsx or App.tsx)
import '../hive-tokens/css/hive-tokens.css';

// Step 2: Import TypeScript token constants
import { hive } from './tokens/hiveTokens';

// Step 3: Use tokens in inline styles
<button style={{
  backgroundColor: hive.color.brand.primary,     // ✅ token
  height: hive.component.button.height,           // ✅ token
  borderRadius: hive.borderRadius.base,           // ✅ token
  // backgroundColor: '#DB0011',                 // ❌ hardcoded
}} />

// Step 4: OR use CSS custom properties in CSS/styled-components
.my-button {
  background-color: var(--hive-color-brand-primary);
  height: var(--hive-btn-height);
  border-radius: var(--hive-btn-radius);
}
```

### 4.2 iOS (SwiftUI)

```swift
// Step 1: Add HiveTokens.swift to your Xcode target or Swift Package

// Step 2: Use token enums directly
Text("Apply Now")
    .font(HiveTypography.buttonLabel)                    // ✅ token
    .foregroundColor(HiveColor.brand.white)               // ✅ token

Button("Continue") { }
    .frame(height: HiveComponent.button.height)           // ✅ token
    .background(HiveColor.brand.primary)                  // ✅ token
    .cornerRadius(HiveComponent.button.borderRadius)      // ✅ token

// Step 3: Use convenience modifiers
myCard.hiveCard()                                         // applies card tokens
myButton.hivePrimaryButton()                              // applies button tokens
```

### 4.3 Android (Jetpack Compose)

```kotlin
// Step 1: Add HiveTokens.kt to your :hive-tokens module, depend on it

// Step 2: Use token objects
Text(
    text = "Apply Now",
    style = HiveTypography.buttonLabel,              // ✅ token
    color = HiveColor.Brand.White                    // ✅ token
)

Button(
    onClick = { },
    modifier = Modifier.height(HiveComponent.Button.height),  // ✅ token
    shape = RoundedCornerShape(HiveComponent.Button.borderRadius),
    colors = ButtonDefaults.buttonColors(
        containerColor = HiveComponent.Button.bgColor          // ✅ token
    )
) { ... }
```

---

## 5. Figma ↔ Code Token Workflow

```
Figma (HIVE Library — source of truth)
        │
        │  Tokens Studio plugin exports
        │  (or HSBC Design Ops team publishes)
        ▼
hive-tokens/json/hive-tokens.json     ← W3C token format
        │
        │  Style Dictionary transforms
        │  (run: npx style-dictionary build)
        ▼
┌───────────────┬──────────────────┬───────────────┐
│ hive-tokens   │ hive-tokens      │ hive-tokens   │
│ .css          │ /swift/          │ /kotlin/       │
│ (web CSS vars)│ HiveTokens.swift │ HiveTokens.kt  │
└───────────────┴──────────────────┴───────────────┘
        │                │                │
        ▼                ▼                ▼
   Web SDUI          iOS SDUI        Android SDUI
   Components        Components      Components

Update cycle:
  HIVE library updated in Figma
  → Design Ops exports new hive-tokens.json
  → Style Dictionary regenerates platform files
  → One PR to update all three codebases simultaneously
```

---

## 6. Token Naming Convention

| Prefix | Example | Meaning |
|--------|---------|---------|
| `hive-color-brand-*` | `hive-color-brand-primary` | Brand palette |
| `hive-color-semantic-*` | `hive-color-semantic-error` | State colours |
| `hive-color-neutral-*` | `hive-color-neutral-500` | Greyscale |
| `hive-color-jade-*` | `hive-color-jade-base` | Jade tier palette |
| `hive-font-size-*` | `hive-font-size-base` | Type scale |
| `hive-font-weight-*` | `hive-font-weight-semibold` | Weight scale |
| `hive-spacing-*` | `hive-spacing-4` | 8pt grid spacing |
| `hive-radius-*` | `hive-radius-base` | Border radii |
| `hive-shadow-*` | `hive-shadow-base` | Elevation shadows |
| `hive-btn-*` | `hive-btn-height` | Button component tokens |
| `hive-input-*` | `hive-input-border-focus` | Input component tokens |

---

## 7. Accessibility Requirements

All token values are chosen to meet WCAG 2.1 AA minimum:

| Requirement | Token | Ratio |
|-------------|-------|-------|
| Body text on white | `neutral.700` on `white` | 9.5:1 ✅ |
| Secondary text on white | `neutral.500` on `white` | 4.6:1 ✅ |
| Primary CTA text | `white` on `brand.primary` | 4.7:1 ✅ |
| Error text | `semantic.error` on `white` | 4.7:1 ✅ |
| Success text | `semantic.success` on `white` | 5.9:1 ✅ |
| Minimum tap target | `component.button.height: 48px` | WCAG 2.5.5 ✅ |
| Focus indicator | 2px ring in `brand.primaryLight` | WCAG 2.4.11 ✅ |

---

## 8. What NOT to Do

```
❌ Never hardcode hex values in component code:
   color: '#DB0011'               → use hive.color.brand.primary

❌ Never hardcode pixel values:
   padding: '16px'                → use hive.spacing[4]
   height: '48px'                 → use hive.component.button.height
   borderRadius: '8px'            → use hive.borderRadius.md

❌ Never use platform system colours directly:
   Color.red                      → use HiveColor.brand.primary (Swift)
   Color.Gray                     → use HiveColor.neutral.n500 (Swift)
   Color(0xFFDB0011)              → use HiveColor.Brand.Primary (Kotlin)

❌ Never use arbitrary font weights:
   fontWeight: 'bold'             → use hive.typography.fontWeight.bold
   FontWeight.Bold                → use HiveTypography.headingMd.fontWeight
```
