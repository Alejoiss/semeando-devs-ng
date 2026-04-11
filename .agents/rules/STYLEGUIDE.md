---
trigger: always_on
---



# Design System Documentation: The Luminescent Blueprint



## 1. Overview & Creative North Star

This design system is built to transform the learning experience for developers from a chore into a high-octane, immersive journey. We are moving away from the static, "white-label" feel of traditional LMS platforms to embrace a **Creative North Star: The Neon Terminal.**



The aesthetic is a fusion of a high-end IDE and a vibrant, editorial game interface. We break the "template" look by utilizing intentional asymmetry, overlapping containers, and a dramatic typography scale. The goal is to make the interface feel like a living, breathing ecosystem where "growing" as a developer is visually represented through light, depth, and color.



---



### 2. Colors & Surface Philosophy

The palette is a high-contrast selection of vibrant "neon" accents against a deep, sophisticated midnight base.



* **Primary (`#3fc2fb`):** Used for core actions and progress.

* **Secondary (`#fe69ac`):** Reserved for "Aha!" moments, rewards, and achievements.

* **Tertiary (`#e8ffc0`):** Used for technical success states and growth-related metaphors.



#### The "No-Line" Rule

To achieve a premium, custom feel, **1px solid borders are prohibited** for sectioning. Boundaries must be defined solely through background color shifts. For example, a card using `surface_container_low` should sit directly on a `surface` background. The change in tonal depth is enough to signify a new container without creating the "boxed-in" feeling of a standard template.



#### Surface Hierarchy & Nesting

Treat the UI as a series of physical layers. Use the `surface_container` tiers to create "nested" depth:

* **Base Layer:** `surface` (#060e20).

* **Section Layer:** `surface_container_low` (#091328).

* **Feature Layer (Cards):** `surface_container` (#0f1930) or `surface_container_high` (#141f38).



#### The "Glass & Gradient" Rule

Floating elements (modals, dropdowns, hovered cards) should utilize **Glassmorphism**. Use `surface_bright` with an opacity of 60-80% and a `backdrop-blur` of 12px to 20px.

* **Signature Textures:** For main Call-to-Actions (CTAs), use a subtle linear gradient transitioning from `primary` (#3fc2fb) to `primary_container` (#27b4ed). This adds a "visual soul" that flat colors lack.



---



### 3. Typography: The Editorial Tech-Stack

We use a high-contrast typographic pairing to balance technical precision with approachable modernism.



* **Display & Headlines (Plus Jakarta Sans):** Used for large headers and level titles. The geometric, open nature of Plus Jakarta Sans feels friendly yet engineered.

* **Titles & Body (Inter):** The workhorse of the system. Inter provides maximum legibility for complex technical explanations.

* **Labels (Space Grotesk):** Used for micro-copy, XP counters, and metadata. Its monospace-adjacent personality reinforces the "Dev" identity of the platform.



**Editorial Tip:** Don't be afraid of the scale. Use `display-lg` (3.5rem) for milestone screens and `label-sm` (0.68rem) for technical tags to create a dynamic, magazine-like hierarchy.



---



### 4. Elevation & Depth

In this system, elevation is conveyed through **Tonal Layering** and **Luminescence** rather than traditional shadows.



* **The Layering Principle:** Stack `surface-container` tiers to create natural lift. Place a `surface_container_highest` element over a `surface_container_low` background to signify peak importance.

* **Ambient Shadows:** For floating UI (like level badges or tooltips), use extra-diffused shadows.

* *Shadow Color:* Use a tinted version of `on_surface` (approx. 6% opacity).

* *Blur:* Minimum 24px to ensure the light feels ambient and soft.

* **The "Ghost Border" Fallback:** If a layout requires a boundary for accessibility, use the `outline_variant` token at **15% opacity**. This creates a "hairline" guide that defines space without cluttering the visual field.



---



### 5. Components



#### Buttons

* **Primary:** Gradient of `primary` to `primary_dim`. Include a subtle glow (`box-shadow`) using the `primary` color at 20% opacity.

* **Secondary:** Ghost style with a `secondary` text and a `secondary` ghost border (20% opacity).

* **Corner Radius:** Always use `DEFAULT` (1rem) or `md` (1.5rem) to keep the "playful/approachable" vibe.



#### Learning Track Cards

* **Style:** No borders. Use `surface_container` backgrounds.

* **Layout:** Use `spacing-12` (3rem) for vertical padding between content blocks.

* **Interactive State:** On hover, shift the background to `surface_bright` and increase the corner radius slightly via a transition.



#### Gamified Elements

* **XP Bars:** Use a `surface_container_highest` track with a `primary` to `tertiary` gradient fill. The fill should have a `primary` glow at the leading edge to look like a "charging" laser.

* **Level Badges:** Circular (`rounded-full`) with a glassmorphic background and a `secondary` (#fe69ac) accent glow.



#### Inputs & Code Snippets

* **Inputs:** Use `surface_container_lowest` for the field background to create an "inset" feel.

* **Code Snippets:** Use a dark, slightly desaturated background (`surface_container_low`) with Inter for commentary and a high-quality monospace font for syntax.


#### URL's Standards

* **URLs routes:** ALWAYS must be in 'pt-br' and using a friendly path.
    Ex.: { path: 'registro', component: Register },
* **URLs titles:** Every routes must be accompanied by a title property according to the path and using the 'Semeando Devs' suffix.
    Ex.: { path: 'registro', component: Register, title: 'Registro - Semeando Devs' },


---



### 6. Do's and Don'ts



#### Do

* **Do** use asymmetrical layouts. A card that is slightly offset from the header above it creates a custom, non-grid-locked feel.

* **Do** use the Spacing Scale strictly. Gaps of `spacing-8` or `spacing-10` between sections provide the "breathing room" required for a premium experience.

* **Do** lean into color. Use `tertiary` (#e8ffc0) for success and `error` (#ff716c) for incorrect code, but keep them as accents, not background fills.



#### Don't

* **Don't** use 100% white text. Use `on_surface` (#dee5ff) to reduce eye strain in the dark mode environment.

* **Don't** use sharp 0px corners. This platform is "approachable and fun"; sharp corners feel too much like a legacy banking app.

* **Don't** use divider lines. If content needs separating, use a background color shift or a `spacing-12` gap. Lines are "visual noise" that we eliminate in this system.
