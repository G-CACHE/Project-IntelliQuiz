# IntelliQuiz UI Redesign Prompt Guide

Version: 2.0
Style: Clean Minimal (Quizlet-inspired)
Scope: Frontend only. Do not change backend, API, database, auth rules, or business logic.

## Objectives

- Keep interfaces clean, readable, and calm.
- Use only the approved palette: maroon, gold, black, white.
- Remove pixel-art and neo-brutalist patterns completely.
- Preserve all existing functionality and route behavior.

## Hard Constraints
- Do not edit API calls, hooks, reducers, services, or route guards.
- Do not rename data fields or component props tied to runtime logic.
- Do not import style sheets across unrelated pages to borrow visuals.
- Do not use heavy borders, offset shadows, or pixel-like hover movement.

## Visual Direction

- Reference feel: quizlet.com/latest
- Tone: clean, modern, academic, organized.
- Layout: comfortable spacing, strong content hierarchy, minimal ornament.
- Iconography: simple, consistent line icons only.

## Approved Palette

Use these values consistently:

```css
:root {
  --color-maroon: #800020;
  --color-maroon-dark: #5C0016;
  --color-gold: #C9A84C;
  --color-gold-light: #E8C97A;
  --color-black: #111111;
  --color-white: #FFFFFF;
  --color-off-white: #F9F7F4;
  --color-gray-mid: #B8B8B8;
  --color-gray-dark: #6B6B6B;
}
```

Usage rules:

- Maroon: primary actions, active states, key accents.
- Gold: highlights, chips, focus outlines, supportive accents.
- Black: primary text and icon strokes.
- White and off-white: cards and page backgrounds.

## Typography Rules

- Display and heading: clean geometric sans only.
- Body: highly readable sans at 14px to 16px base.
- Use strong hierarchy:
  - Page title: 34px to 52px
  - Section title: 20px to 28px
  - Body text: 14px to 16px
  - Metadata: 12px to 13px

## Component Guidelines

Cards:

- Border: 1px neutral border.
- Radius: 14px to 20px.
- Shadow: soft, single-direction modern shadow.
- No dashed comic borders except intentionally empty-state only.

Buttons:

- Primary: maroon background, white text.
- Secondary: white background, neutral border.
- Radius: 10px to 12px.
- No jump-on-hover transforms.

Status pills:

- Keep compact and readable.
- Use soft tinted backgrounds with dark text.
- Maintain consistent sizing and spacing.

## Interaction Rules

- Keep motion subtle and optional.
- Avoid dramatic hover animations.
- Focus visible state is required on all interactive elements.
- Prefer clarity over animation.

## What to Remove

- Pixel fonts and retro/game-console type styles.
- Thick black borders and hard offset shadows.
- Brutalist push-button interactions.
- Mixed imported dashboard styles from other modules.
- Neon multi-color gradients outside the approved palette.

## Dashboard Implementation Checklist

- Hero section with clear title, subtitle, and one primary action.
- Four compact KPI cards.
- Two-column content area:
  - Quick actions panel
  - Recent quizzes panel
- Empty state with concise copy and primary CTA.
- Mobile layout collapses to one column cleanly.

## Prompt Template (For AI UI Tasks)

Use this exact template when requesting redesign work:

```text
Redesign this page using a clean minimal Quizlet-inspired style.
Use only maroon, gold, black, and white palette tokens.
Remove all pixel-art and neo-brutalist styling patterns.
Keep all existing functionality exactly the same.
Do not modify backend logic, API hooks, or routing behavior.
Improve spacing, hierarchy, icon consistency, and readability.
Use subtle shadows, simple borders, and accessible focus-visible states.
Deliver updated component markup and CSS only.
After changes, run lint/build and report results.
```

## QA Acceptance Criteria

- Page looks clean and modern, not game-like.
- No pixel or neo-brutalist visuals remain.
- Color usage follows maroon/gold/black/white system.
- Buttons, cards, and pills are visually consistent.
- No broken routes, actions, or data rendering.
- Build passes successfully.

## Change Log

- v2.0: Replaced old pixel and neo-brutalist system with clean minimalist system and strict palette guidance.
