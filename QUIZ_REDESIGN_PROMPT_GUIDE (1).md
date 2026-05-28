# QUIZ SYSTEM — UI REDESIGN PROMPT GUIDE

> **Version:** 2.0 | **Style:** Refined Minimal × Academic Prestige
> **Purpose:** Step-by-step UI redesign prompts for AI or human UI developers.
> **Scope:** Frontend only — zero changes to backend, API, database, or business logic.

---

## HOW TO USE THIS GUIDE

Follow each **Phase** in order. Do not skip phases.

Each phase contains a **prompt block** you paste directly to your UI developer or AI tool. Every phase targets one isolated UI section to avoid breaking other parts. After each phase, test all existing functionality before moving to the next.

This guide only modifies: CSS, fonts, colors, layout, component visuals, animations, and icon choices.

This guide never modifies: API calls, data bindings, route logic, state management, backend endpoints.

---

## DESIGN SYSTEM FOUNDATION

> Read this section fully before starting Phase 0. All phases reference these tokens.

### Style Identity

**Name:** `Aurum` — Refined Minimal with Academic Prestige energy
**Vibe:** Professional, clean, prestigious. Think Quizlet meets a top-tier academic institution.
Confident but not loud. Elegant but not cold. Interactive but not chaotic.

**Design Philosophy:**
- Whitespace is a design element, not empty space
- Every color carries intent: Maroon = authority, Gold = achievement, Black = precision, White = clarity
- Interactions feel satisfying and polished, not flashy
- Components breathe — generous padding, clean edges, clear hierarchy

---

### Typography System

**Font Stack:**

```
DISPLAY FONT:  "DM Serif Display" (Google Fonts) → hero headings, result screens, big score numbers
HEADING FONT:  "Outfit" (Google Fonts) → question text, section titles, nav links, card headings
BODY FONT:     "DM Sans" (Google Fonts) → answer options, descriptions, instructions, labels
MONO FONT:     "JetBrains Mono" (Google Fonts) → timer digits, score counters, room codes
```

**Google Fonts import (add to global CSS or `<head>`):**

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Outfit:wght@400;500;600;700&family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
```

**Font Usage Rules:**

- `DM Serif Display` — Use at 48px+ only. Never use for body, labels, or interactive elements.
- `Outfit` — Primary heading font. 32px section titles, 22px card titles, 18px nav and buttons. Weight 600–700.
- `DM Sans` — Body copy and answer text. 16px default, 14px captions. Weight 400 regular, 500 medium, 700 bold.
- `JetBrains Mono` — Always for numeric displays: timers, scores, room codes. Use letter-spacing: 0.05em.

---

### Color Palette

```css
:root {
  /* === PRIMARY PALETTE === */
  --color-maroon:        #800020;   /* Deep Maroon — primary brand, headers, key accents */
  --color-maroon-dark:   #5C0016;   /* Darker Maroon — hover states, pressed states */
  --color-maroon-light:  #A8002A;   /* Lighter Maroon — secondary maroon use */
  --color-gold:          #C9A84C;   /* Antique Gold — achievement, highlights, badges */
  --color-gold-light:    #E8C97A;   /* Light Gold — hover on gold elements, backgrounds */
  --color-gold-subtle:   #F5EDD6;   /* Very light gold tint — subtle card backgrounds */

  /* === NEUTRALS === */
  --color-black:         #111111;   /* Near-black — text, borders */
  --color-charcoal:      #2C2C2C;   /* Charcoal — secondary text, icons */
  --color-gray-dark:     #6B6B6B;   /* Dark gray — muted text, disabled labels */
  --color-gray-mid:      #B8B8B8;   /* Mid gray — borders, dividers */
  --color-gray-light:    #E8E8E8;   /* Light gray — subtle borders, hover backgrounds */
  --color-off-white:     #F9F7F4;   /* Warm off-white — page backgrounds */
  --color-white:         #FFFFFF;   /* Pure white — card surfaces */

  /* === SEMANTIC / GAME STATE === */
  --color-correct:       #1A7A4A;   /* Deep green — correct answers */
  --color-correct-bg:    #EBF7F1;   /* Correct answer background */
  --color-wrong:         #C0392B;   /* Deep red — wrong answers */
  --color-wrong-bg:      #FDECEA;   /* Wrong answer background */
  --color-pending:       #C9A84C;   /* Gold — unanswered / in-progress */

  /* === LEADERBOARD RANKS === */
  --color-rank-1:        #C9A84C;   /* Gold — 1st place */
  --color-rank-2:        #9E9E9E;   /* Silver — 2nd place */
  --color-rank-3:        #A0522D;   /* Bronze — 3rd place */

  /* === TIMER STATES === */
  --color-timer-ok:      #1A7A4A;   /* Plenty of time */
  --color-timer-warn:    #D97706;   /* Running low */
  --color-timer-danger:  #C0392B;   /* Critical */

  /* === SHADOWS === */
  --shadow-sm:    0 1px 3px rgba(17, 17, 17, 0.08), 0 1px 2px rgba(17, 17, 17, 0.04);
  --shadow-md:    0 4px 12px rgba(17, 17, 17, 0.10), 0 2px 4px rgba(17, 17, 17, 0.06);
  --shadow-lg:    0 8px 24px rgba(17, 17, 17, 0.12), 0 4px 8px rgba(17, 17, 17, 0.06);
  --shadow-gold:  0 4px 16px rgba(201, 168, 76, 0.20);
  --shadow-maroon:0 4px 16px rgba(128, 0, 32, 0.20);

  /* === BORDERS === */
  --border-light:        1px solid var(--color-gray-light);
  --border-mid:          1px solid var(--color-gray-mid);
  --border-gold:         1px solid var(--color-gold);
  --border-maroon:       1px solid var(--color-maroon);

  /* === BORDER RADIUS === */
  --radius-sm:    6px;
  --radius-md:    10px;
  --radius-lg:    16px;
  --radius-xl:    24px;
  --radius-full:  9999px;

  /* === SPACING SCALE === */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  24px;
  --space-6:  32px;
  --space-7:  48px;
  --space-8:  64px;

  /* === TRANSITIONS === */
  --transition-fast:   all 0.15s ease;
  --transition-base:   all 0.25s ease;
  --transition-slow:   all 0.4s ease;
}
```

---

### Core Component Rules (apply to ALL phases)

```
1. SURFACES:       Cards use --color-white background. Page uses --color-off-white.
2. BORDERS:        Use --border-light for structural separation. --border-gold for featured/active.
3. SHADOWS:        --shadow-md for cards, --shadow-lg for modals, --shadow-sm for small elements.
4. BUTTONS:        Filled primary = maroon background + white text.
                   Outlined secondary = transparent + maroon border + maroon text.
                   Ghost = transparent + no border, shows on hover only.
5. INTERACTIVE:    All interactive elements get a subtle lift on hover (transform: translateY(-1px) + shadow increase).
6. RADIUS:         Consistent rounded corners. Use --radius-md for most components.
7. ICONS:          Use shadcn/ui icon components (lucide-react). Prefer: Trophy, Star, Clock, CheckCircle,
                   XCircle, Users, Crown, Zap, BookOpen, ChevronRight, Medal.
                   Always pair icons with text labels. Never use icons alone without accessible labels.
8. ANIMATIONS:     Subtle, purposeful. 150–400ms durations. Ease curves only.
                   Entrance: fade-in + slight translateY(8px → 0). No bouncing or pixel-jumping.
9. TYPOGRAPHY:     Left-align body text. Center only for hero headings and result screens.
10. SPACING:       Generous padding inside cards. Consistent gap between elements.
    NO tight, cramped layouts anywhere in the app.
```

---

### Shadcn/UI Icon Reference

These are the recommended icons from `lucide-react`. Use these consistently throughout the app.

```
Navigation & Actions:
  BookOpen      → Quiz / study sessions
  Play          → Start quiz / begin
  ChevronRight  → Next, proceed
  Home          → Return to home
  Settings      → Configuration
  LogOut        → Exit / leave session

Game & Scoring:
  Trophy        → Leaderboard, rankings
  Crown         → First place / winner
  Medal         → Achievement / rank badges
  Star          → Rating, favorites
  Zap           → Streak, speed bonus
  Target        → Score, accuracy

Players & Social:
  Users         → Player count, lobby
  User          → Individual player
  UserCheck     → Player joined confirmation

Feedback:
  CheckCircle   → Correct answer
  XCircle       → Wrong answer
  AlertCircle   → Warning / time low
  Info          → Hint, tooltip

Timer & Time:
  Clock         → Timer display
  Timer         → Countdown

Host Controls:
  SkipForward   → Next question
  Pause         → Pause game
  Eye           → Reveal answer
  Ban           → Kick player
```

Import example:
```jsx
import { Trophy, CheckCircle, Clock } from "lucide-react"

// Usage
<Trophy className="icon-gold" size={20} />
```

---

## PHASES OVERVIEW

| Phase | Section | Est. Effort |
|-------|---------|-------------|
| Phase 0 | Global CSS Variables & Fonts | 1–2 hrs |
| Phase 1 | Navigation / Header Bar | 1 hr |
| Phase 2 | Home / Landing Screen | 2–3 hrs |
| Phase 3 | Quiz Lobby / Room Screen | 1–2 hrs |
| Phase 4 | Question Card Component | 2 hrs |
| Phase 5 | Answer Option Buttons | 1–2 hrs |
| Phase 6 | Timer Component | 1 hr |
| Phase 7 | Score / Points Display | 1 hr |
| Phase 8 | Correct / Wrong Feedback States | 1–2 hrs |
| Phase 9 | Leaderboard Screen | 2 hrs |
| Phase 10 | Results / End Screen | 2 hrs |
| Phase 11 | Host Controls Panel | 2 hrs |
| Phase 12 | Micro-interactions & Final Polish | 2–3 hrs |

---

---

# PHASE 0 — Global CSS Variables & Font Setup

## Goal
Inject the new design tokens system-wide without touching any component logic.
This is the foundation all other phases build upon.

## Safety Rules
- Only edit: `global.css` / `index.css` / `app.css` (whichever is your global stylesheet)
- Do NOT edit any component files yet
- Do NOT rename or remove any class names referenced in JS/JSX/TS files
- Add variables inside `:root {}` only — do not remove existing variables yet

## Prompt

```
You are setting up the global CSS design system for a quiz app redesign.
Do NOT touch any component files, JS, TS, or backend files.
Only modify the global stylesheet.

STEP 1 — Add this Google Fonts import at the very top of the global stylesheet:

@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Outfit:wght@400;500;600;700&family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;600&display=swap&display=swap');

STEP 2 — Add these CSS custom properties inside :root {}:

  /* Fonts */
  --font-display: 'DM Serif Display', Georgia, serif;
  --font-heading: 'Outfit', sans-serif;
  --font-body: 'DM Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Color Palette */
  --color-maroon:         #800020;
  --color-maroon-dark:    #5C0016;
  --color-maroon-light:   #A8002A;
  --color-gold:           #C9A84C;
  --color-gold-light:     #E8C97A;
  --color-gold-subtle:    #F5EDD6;
  --color-black:          #111111;
  --color-charcoal:       #2C2C2C;
  --color-gray-dark:      #6B6B6B;
  --color-gray-mid:       #B8B8B8;
  --color-gray-light:     #E8E8E8;
  --color-off-white:      #F9F7F4;
  --color-white:          #FFFFFF;

  /* Game States */
  --color-correct:        #1A7A4A;
  --color-correct-bg:     #EBF7F1;
  --color-wrong:          #C0392B;
  --color-wrong-bg:       #FDECEA;
  --color-pending:        #C9A84C;

  /* Leaderboard */
  --color-rank-1:         #C9A84C;
  --color-rank-2:         #9E9E9E;
  --color-rank-3:         #A0522D;

  /* Timer States */
  --color-timer-ok:       #1A7A4A;
  --color-timer-warn:     #D97706;
  --color-timer-danger:   #C0392B;

  /* Shadows */
  --shadow-sm:     0 1px 3px rgba(17,17,17,0.08), 0 1px 2px rgba(17,17,17,0.04);
  --shadow-md:     0 4px 12px rgba(17,17,17,0.10), 0 2px 4px rgba(17,17,17,0.06);
  --shadow-lg:     0 8px 24px rgba(17,17,17,0.12), 0 4px 8px rgba(17,17,17,0.06);
  --shadow-gold:   0 4px 16px rgba(201,168,76,0.20);
  --shadow-maroon: 0 4px 16px rgba(128,0,32,0.20);

  /* Borders */
  --border-light:   1px solid #E8E8E8;
  --border-mid:     1px solid #B8B8B8;
  --border-gold:    1px solid #C9A84C;
  --border-maroon:  1px solid #800020;

  /* Border Radius */
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   16px;
  --radius-xl:   24px;
  --radius-full: 9999px;

  /* Spacing */
  --space-1: 4px;   --space-2: 8px;   --space-3: 12px;  --space-4: 16px;
  --space-5: 24px;  --space-6: 32px;  --space-7: 48px;  --space-8: 64px;

  /* Transitions */
  --transition-fast: all 0.15s ease;
  --transition-base: all 0.25s ease;
  --transition-slow: all 0.40s ease;

STEP 3 — Set global base styles (add after :root):

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--font-body);
  background-color: var(--color-off-white);
  color: var(--color-black);
  line-height: 1.6;
}

STEP 4 — Add these global keyframe animations:

@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}

@keyframes slide-in-right {
  from { opacity: 0; transform: translateX(16px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(201,168,76,0.3); }
  50%       { box-shadow: 0 0 0 8px rgba(201,168,76,0); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-6px); }
  40%       { transform: translateX(6px); }
  60%       { transform: translateX(-4px); }
  80%       { transform: translateX(4px); }
}

@keyframes pop {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.06); }
  100% { transform: scale(1); }
}

@keyframes flash-border {
  0%, 100% { border-color: var(--color-gold); }
  50%       { border-color: transparent; }
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

STEP 5 — Add utility classes:

.text-maroon    { color: var(--color-maroon); }
.text-gold      { color: var(--color-gold); }
.text-muted     { color: var(--color-gray-dark); }
.bg-maroon      { background-color: var(--color-maroon); }
.bg-gold-subtle { background-color: var(--color-gold-subtle); }
.icon-gold      { color: var(--color-gold); }
.icon-maroon    { color: var(--color-maroon); }

After making changes, verify the page still loads and all existing functionality works.
```

---

---

# PHASE 1 — Navigation / Header Bar

## Goal
Restyle the top navigation bar to match the Aurum design system. Clean, professional, with clear brand identity.

## Safety Rules
- Only change CSS/styles of the nav component
- Do NOT change navigation links, route paths, or onClick handlers
- Do NOT remove or rename any existing CSS class names used in JS
- Prefix any new class names with `au-` to avoid conflicts

## Prompt

```
You are restyling ONLY the navigation/header bar of a quiz app.
Do NOT change any routing logic, links, or JavaScript.
Do NOT remove existing class names — only add new styling on top.
Reference style: Quizlet.com nav — clean white bar, clear hierarchy, minimal.

TARGET LOOK:

NAV CONTAINER:
- background: var(--color-white)
- border-bottom: 1px solid var(--color-gray-light)
- box-shadow: var(--shadow-sm)
- height: 64px
- padding: 0 var(--space-6)
- display: flex, align-items: center, justify-content: space-between
- position: sticky, top: 0, z-index: 100

LOGO / BRAND:
- Text or image logo sits on the left
- Logo text: font-family var(--font-display), font-size 22px, color var(--color-maroon), letter-spacing -0.01em
- Add a small Trophy or BookOpen icon (lucide-react) before the logo text, color var(--color-gold), size 20px
- Do not change any routing logic attached to the logo

NAV LINKS (middle):
- font-family: var(--font-heading), font-size: 15px, font-weight: 500
- color: var(--color-charcoal)
- padding: 6px 14px
- border-radius: var(--radius-md)
- text-decoration: none
- transition: var(--transition-fast)
- hover: background var(--color-gold-subtle), color var(--color-maroon)
- Active state: background var(--color-gold-subtle), color var(--color-maroon), font-weight 600

CTA BUTTON (e.g., "Host Quiz", "Join"):
- Primary button: background var(--color-maroon), color var(--color-white)
- font-family: var(--font-heading), font-size: 14px, font-weight: 600
- padding: 8px 20px
- border-radius: var(--radius-full)
- border: none
- box-shadow: var(--shadow-maroon)
- transition: var(--transition-fast)
- hover: background var(--color-maroon-dark), transform translateY(-1px), box-shadow: 0 6px 20px rgba(128,0,32,0.25)
- active: transform translateY(0), box-shadow: var(--shadow-sm)

USER AVATAR / PROFILE PILL (if present):
- width: 36px, height: 36px, border-radius: var(--radius-full)
- border: 2px solid var(--color-gold)
- box-shadow: var(--shadow-gold)
- cursor: pointer

MOBILE (below 768px):
- Hamburger icon: color var(--color-maroon), size 24px, use Menu icon from lucide-react
- Mobile drawer background: var(--color-white), padding var(--space-5)
- Mobile nav links: full width, padding var(--space-3) var(--space-4), border-bottom var(--border-light)

Do not change any routing logic, href values, or JavaScript handlers.
```

---

---

# PHASE 2 — Home / Landing Screen

## Goal
Redesign the main landing/home page. Clean, professional, confidence-inspiring.

## Safety Rules
- Only restyle the home page component's CSS
- Do NOT change any data fetching, routing links, or state logic
- Preserve all existing button onClick handlers — only restyle the buttons

## Prompt

```
You are restyling ONLY the home/landing page of a quiz app.
No logic changes. Visual redesign only.
Reference: Quizlet.com home — clean whitespace, confident typography, clear CTAs.

PAGE BACKGROUND:
- background: var(--color-off-white)
- Add a very subtle dot-grid pattern using CSS:
  background-image: radial-gradient(circle, rgba(128,0,32,0.06) 1px, transparent 1px);
  background-size: 28px 28px;

HERO SECTION:
- max-width: 1200px, margin: 0 auto, padding: var(--space-8) var(--space-6)
- Layout: centered, text-align center on desktop
- Hero eyebrow label (e.g., "The smarter way to quiz"):
  font-family: var(--font-heading), font-size: 13px, font-weight: 600
  color: var(--color-maroon), text-transform: uppercase, letter-spacing: 0.12em
  background: var(--color-gold-subtle), padding: 4px 16px, border-radius: var(--radius-full)
  border: var(--border-gold), display: inline-block, margin-bottom: var(--space-4)

- Main heading:
  font-family: var(--font-display)
  font-size: clamp(36px, 6vw, 72px)
  color: var(--color-black)
  line-height: 1.1
  letter-spacing: -0.02em
  margin-bottom: var(--space-4)
  Add a color highlight on a key word using: color var(--color-maroon)

- Sub-heading:
  font-family: var(--font-body), font-size: clamp(16px, 2vw, 20px), font-weight: 400
  color: var(--color-gray-dark), max-width: 600px, margin: 0 auto var(--space-6)

PRIMARY CTA BUTTON ("Create Quiz", "Start"):
- background: var(--color-maroon)
- color: var(--color-white)
- font-family: var(--font-heading), font-size: 16px, font-weight: 600
- padding: 14px 36px
- border-radius: var(--radius-full)
- border: none
- box-shadow: var(--shadow-maroon)
- display: inline-flex, align-items: center, gap: var(--space-2)
- Include Play icon (lucide-react) before button text, size 18px
- transition: var(--transition-fast)
- hover: background var(--color-maroon-dark), transform translateY(-2px), box-shadow: 0 8px 24px rgba(128,0,32,0.30)
- active: transform translateY(0)

SECONDARY CTA BUTTON ("Join Game", "Browse"):
- background: var(--color-white)
- color: var(--color-maroon)
- border: var(--border-maroon)
- Same sizing and radius as primary
- hover: background var(--color-gold-subtle)

FEATURE / BENEFIT CARDS (if present on home):
- Layout: 3-column grid on desktop, 1-column on mobile, gap: var(--space-5)
- Each card:
  background: var(--color-white)
  border: var(--border-light)
  border-radius: var(--radius-lg)
  padding: var(--space-6)
  box-shadow: var(--shadow-sm)
  animation: fade-in-up 0.4s ease both
  animation-delay: calc(var(--card-index) * 0.1s)
  transition: var(--transition-base)
  hover: box-shadow var(--shadow-md), transform translateY(-2px)

- Card icon container:
  width: 44px, height: 44px, border-radius: var(--radius-md)
  background: var(--color-gold-subtle), border: var(--border-gold)
  display: flex, align-items: center, justify-content: center
  margin-bottom: var(--space-4)
  Icon: lucide-react icon, color var(--color-maroon), size 20px

- Card title: font-family var(--font-heading), font-size: 18px, font-weight: 600, color var(--color-black), margin-bottom var(--space-2)
- Card description: font-family var(--font-body), font-size: 15px, color var(--color-gray-dark), line-height 1.6

Do not change any onClick, routing, or API calls.
```

---

---

# PHASE 3 — Quiz Lobby / Room Screen

## Goal
Restyle the waiting room where players gather before a quiz starts. Clear, welcoming, with live energy.

## Safety Rules
- Only restyle visuals
- Preserve: room code display logic, player join list data binding, countdown timer logic, host start button handler

## Prompt

```
You are restyling ONLY the quiz lobby/waiting room screen.
No logic, state, or data changes. Visual redesign only.
Vibe: Premium waiting room — calm but with anticipation. Clear hierarchy.

PAGE BACKGROUND:
- background: var(--color-off-white) with the same dot-grid as the home page

ROOM CODE DISPLAY:
- Centered card container:
  background: var(--color-white)
  border: var(--border-gold)
  border-radius: var(--radius-xl)
  box-shadow: var(--shadow-gold)
  padding: var(--space-6) var(--space-7)
  max-width: 480px, margin: 0 auto

- Label above code ("Room Code" / "Game PIN"):
  font-family: var(--font-heading), font-size: 11px, font-weight: 600
  color: var(--color-gray-dark), text-transform: uppercase, letter-spacing: 0.15em
  margin-bottom: var(--space-2)

- Room code text:
  font-family: var(--font-mono), font-size: clamp(32px, 6vw, 56px), font-weight: 600
  color: var(--color-maroon), letter-spacing: 0.08em, text-align: center

- Copy button (if present): small ghost button with Copy icon (lucide-react), color var(--color-gold)

PLAYER COUNT BADGE:
- display: inline-flex, align-items: center, gap: var(--space-2)
- background: var(--color-gold-subtle), border: var(--border-gold), border-radius: var(--radius-full)
- padding: 6px 16px
- Users icon (lucide-react), size 16px, color var(--color-maroon)
- Count text: font-family var(--font-heading), font-size: 15px, font-weight: 600, color var(--color-maroon)

PLAYER AVATAR GRID:
- display: grid, grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)), gap: var(--space-3)
- max-width: 900px, margin: 0 auto

- Each player tile:
  background: var(--color-white)
  border: var(--border-light)
  border-radius: var(--radius-md)
  padding: var(--space-3) var(--space-4)
  display: flex, align-items: center, gap: var(--space-3)
  box-shadow: var(--shadow-sm)
  animation: scale-in 0.3s ease both

- Player avatar circle:
  width: 36px, height: 36px, border-radius: var(--radius-full)
  background: var(--color-gold-subtle), border: var(--border-gold)
  display: flex, align-items: center, justify-content: center
  font-family: var(--font-heading), font-size: 14px, font-weight: 700, color: var(--color-maroon)

- Player name: font-family var(--font-body), font-size: 14px, font-weight: 500, color var(--color-black)

WAITING STATUS TEXT:
- font-family: var(--font-body), font-size: 14px, color: var(--color-gray-dark)
- Include a subtle animated pulse dot before the text: width 8px, height 8px, border-radius 50%,
  background var(--color-correct), animation: pulse-glow 1.5s infinite

HOST START BUTTON:
- background: var(--color-maroon)
- color: var(--color-white)
- font-family: var(--font-heading), font-size: 16px, font-weight: 600
- padding: 14px 40px, border-radius: var(--radius-full)
- border: none, box-shadow: var(--shadow-maroon)
- Include Play icon (lucide-react) before text, size 18px
- hover: background var(--color-maroon-dark), transform translateY(-2px), box-shadow: 0 8px 24px rgba(128,0,32,0.30)

Do not change any WebSocket connections, room join logic, player state, or host controls logic.
```

---

---

# PHASE 4 — Question Card Component

## Goal
Restyle the main question display card shown during an active quiz. Clear, readable, focused.

## Safety Rules
- Only restyle the question card component CSS
- Preserve: question text data binding, question number logic, image display, media handling
- Do NOT change timer logic — only restyle the timer visuals (Phase 6 handles that)

## Prompt

```
You are restyling ONLY the question card component in a quiz app.
No data or logic changes.
Target: Clean, focused reading experience. The question should be the hero of the screen.

QUESTION CARD CONTAINER:
- background: var(--color-white)
- border: var(--border-light)
- border-radius: var(--radius-xl)
- box-shadow: var(--shadow-md)
- padding: var(--space-7) var(--space-6)
- max-width: 860px, margin: 0 auto
- position: relative
- animation: fade-in-up 0.3s ease

QUESTION NUMBER BADGE (e.g., "Question 3 of 10"):
- position: absolute, top: -1px, left: var(--space-6)
- background: var(--color-maroon), color: var(--color-white)
- font-family: var(--font-heading), font-size: 11px, font-weight: 600
- padding: 4px 14px
- border-radius: 0 0 var(--radius-md) var(--radius-md)
- text-transform: uppercase, letter-spacing: 0.1em

QUESTION TEXT:
- font-family: var(--font-heading)
- font-size: clamp(18px, 2.5vw, 28px)
- font-weight: 600
- color: var(--color-black)
- line-height: 1.4
- text-align: center
- margin-top: var(--space-3)
- max-width: 720px, margin-left: auto, margin-right: auto

CATEGORY / TAG BADGE (if present):
- position: absolute, top: var(--space-4), right: var(--space-4)
- background: var(--color-gold-subtle)
- color: var(--color-maroon)
- font-family: var(--font-body), font-size: 11px, font-weight: 600
- padding: 3px 12px
- border-radius: var(--radius-full)
- border: var(--border-gold)

QUESTION IMAGE (if exists):
- border-radius: var(--radius-md)
- border: var(--border-light)
- box-shadow: var(--shadow-sm)
- max-height: 280px, object-fit: cover
- margin: var(--space-4) auto
- display: block

PAGE BACKGROUND DURING QUIZ:
- background: var(--color-off-white) with dot-grid overlay

TOP BAR (question number + timer row):
- display: flex, justify-content: space-between, align-items: center
- max-width: 860px, margin: 0 auto var(--space-4), padding: 0 var(--space-1)

Do not change any question data fetching, state, or timer logic.
```

---

---

# PHASE 5 — Answer Option Buttons

## Goal
Restyle the answer option buttons. Clear, accessible, interactive. Four distinct options that are easy to scan.

## Safety Rules
- Only restyle the answer buttons CSS
- Preserve ALL onClick handlers, submission logic, disabled states, and JS class toggling
- If JS adds classes like `.correct`, `.wrong`, `.selected` — keep those class names exactly as-is

## Prompt

```
You are restyling ONLY the answer option buttons in a quiz app.
These are the 4 clickable answer choices shown during a question.
Do NOT change onClick handlers, state, submission logic, or disabled states.
Preserve class names: "correct", "wrong", "selected", "disabled" — add styles for them, don't rename.

ANSWER GRID LAYOUT:
- Display as 2x2 grid on desktop: grid-template-columns: 1fr 1fr, gap: var(--space-3)
- On mobile (below 640px): single column
- max-width: 860px, margin: var(--space-5) auto 0

ANSWER BUTTON BASE STYLE:
- display: flex, align-items: center, gap: var(--space-3)
- width: 100%
- padding: var(--space-4) var(--space-5)
- font-family: var(--font-body), font-size: 16px, font-weight: 500
- background: var(--color-white)
- color: var(--color-black)
- border: var(--border-mid)
- border-radius: var(--radius-md)
- box-shadow: var(--shadow-sm)
- cursor: pointer
- text-align: left
- transition: var(--transition-fast)
- min-height: 60px

HOVER STATE (before answering):
- border-color: var(--color-maroon)
- box-shadow: var(--shadow-md)
- transform: translateY(-1px)
- background: var(--color-off-white)

ACTIVE/CLICK STATE:
- transform: translateY(0)
- box-shadow: var(--shadow-sm)

ANSWER LETTER BADGE (A, B, C, D — left side):
- width: 32px, height: 32px, flex-shrink: 0
- background: var(--color-off-white)
- border: 1px solid var(--color-gray-light)
- border-radius: var(--radius-sm)
- font-family: var(--font-heading), font-size: 13px, font-weight: 700
- color: var(--color-charcoal)
- display: flex, align-items: center, justify-content: center

SELECTED STATE (.selected):
- border-color: var(--color-maroon)
- border-width: 2px
- background: rgba(128, 0, 32, 0.04)
- Letter badge: background var(--color-maroon), color white, border-color var(--color-maroon)

CORRECT STATE (.correct — added by existing JS):
- background: var(--color-correct-bg)
- border-color: var(--color-correct)
- border-width: 2px
- color: var(--color-correct)
- animation: pop 0.3s ease
- Letter badge: background var(--color-correct), color white
- Add CheckCircle icon (lucide-react) on the right: position absolute, right var(--space-4), size 20px, color var(--color-correct)

WRONG STATE (.wrong — added by existing JS):
- background: var(--color-wrong-bg)
- border-color: var(--color-wrong)
- border-width: 2px
- color: var(--color-wrong)
- animation: shake 0.4s ease
- Letter badge: background var(--color-wrong), color white
- Add XCircle icon (lucide-react) on the right: position absolute, right var(--space-4), size 20px, color var(--color-wrong)

DISABLED STATE (.disabled):
- opacity: 0.5
- cursor: not-allowed
- pointer-events: none
- box-shadow: none

Do not change any JS logic, event handlers, or state management.
```

---

---

# PHASE 6 — Timer Component

## Goal
Restyle the countdown timer. Minimal, readable, and clearly communicates urgency through color alone.

## Safety Rules
- Only restyle CSS
- Preserve all timer logic, countdown state, and any JS that changes timer classes or values
- If JS changes classes on the timer based on time remaining, preserve those class names

## Prompt

```
You are restyling ONLY the timer/countdown component in a quiz app.
Do NOT change any timer logic, countdown calculations, or class-toggling JavaScript.

TIMER CONTAINER (circular):
- width: 64px, height: 64px
- border-radius: var(--radius-full)
- border: 3px solid var(--color-timer-ok)
- background: var(--color-white)
- display: flex, align-items: center, justify-content: center
- box-shadow: var(--shadow-sm)
- transition: border-color 0.3s ease, background 0.3s ease

TIMER NUMBER:
- font-family: var(--font-mono), font-size: 20px, font-weight: 600
- color: var(--color-timer-ok)
- line-height: 1
- transition: color 0.3s ease

WARNING STATE (keep existing class names your JS uses):
- border-color: var(--color-timer-warn)
- Timer number color: var(--color-timer-warn)
- No animation yet — just color change

DANGER STATE (critical — keep existing class names):
- border-color: var(--color-timer-danger)
- background: rgba(192, 57, 43, 0.06)
- Timer number color: var(--color-timer-danger)
- animation: flash-border 0.6s infinite

PROGRESS BAR TIMER VERSION (if a bar-style timer is used):
- height: 6px
- background: var(--color-gray-light)
- border-radius: var(--radius-full)
- overflow: hidden
- Fill element inside:
  height: 100%
  background: var(--color-timer-ok)
  border-radius: var(--radius-full)
  transition: width 1s linear, background 0.3s ease
  Warning state fill: background var(--color-timer-warn)
  Danger state fill: background var(--color-timer-danger)

TIMER LABEL ("Time Left"):
- font-family: var(--font-body), font-size: 11px, font-weight: 500
- color: var(--color-gray-dark), text-transform: uppercase, letter-spacing: 0.1em
- display: block, text-align: center, margin-top: var(--space-1)
- Add Clock icon (lucide-react) inline, size 11px, before the label text

Do not change any timer countdown logic.
```

---

---

# PHASE 7 — Score / Points Display

## Goal
Restyle the score counter displayed during the quiz. Prominent but not distracting.

## Safety Rules
- Only restyle. Do NOT change score calculation logic or state management.

## Prompt

```
You are restyling ONLY the score/points display component.
No logic changes. Preserve all data bindings and state.

SCORE DISPLAY CONTAINER:
- background: var(--color-white)
- border: var(--border-gold)
- border-radius: var(--radius-md)
- box-shadow: var(--shadow-gold)
- padding: var(--space-2) var(--space-4)
- display: inline-flex, align-items: center, gap: var(--space-3)

SCORE ICON:
- Trophy icon (lucide-react), size 18px, color var(--color-gold)

SCORE LABEL ("Score", "Points", "PTS"):
- font-family: var(--font-body), font-size: 11px, font-weight: 500
- color: var(--color-gray-dark), text-transform: uppercase, letter-spacing: 0.1em

SCORE VALUE:
- font-family: var(--font-mono), font-size: 20px, font-weight: 600
- color: var(--color-maroon)
- transition: color 0.2s ease

SCORE INCREASE ANIMATION (when points are added — trigger by JS adding a class):
- .score-pop: animation: pop 0.35s ease

STREAK BADGE (if streak counter exists):
- display: inline-flex, align-items: center, gap: var(--space-1)
- background: var(--color-gold-subtle)
- border: var(--border-gold)
- border-radius: var(--radius-full)
- padding: 2px 10px
- Zap icon (lucide-react), size 12px, color var(--color-gold)
- Streak count: font-family var(--font-heading), font-size: 13px, font-weight: 700, color var(--color-maroon)

BONUS POINTS POPUP (floating "+200" text):
- position: absolute
- font-family: var(--font-mono), font-size: 14px, font-weight: 600
- color: var(--color-correct)
- animation: fade-in-up 1s ease forwards
- pointer-events: none
- opacity fades out after 1s via animation

Do not change score calculation, bonus logic, or state management.
```

---

---

# PHASE 8 — Correct / Wrong Answer Feedback States

## Goal
Restyle the brief feedback overlay shown after a player answers. Clear, confident, not overwhelming.

## Safety Rules
- Only restyle the feedback overlay/screen CSS
- Preserve: timing logic, transition to next question, score update calls

## Prompt

```
You are restyling ONLY the answer feedback overlay/screen in a quiz app.
This appears briefly after a player answers (correct or wrong).
Do NOT change timing, transitions to next question, or score update logic.

CORRECT ANSWER STATE:
- Background overlay or full-screen: background var(--color-correct-bg)
- Border (if card/modal): border 2px solid var(--color-correct), border-radius var(--radius-xl)
- box-shadow: 0 8px 32px rgba(26, 122, 74, 0.15)
- animation: scale-in 0.25s ease

- Correct icon:
  CheckCircle icon (lucide-react), size 56px, color var(--color-correct)
  animation: pop 0.35s ease 0.1s both

- "Correct!" heading:
  font-family: var(--font-heading), font-size: clamp(24px, 4vw, 40px), font-weight: 700
  color: var(--color-correct)
  margin-top: var(--space-3)

- Points earned:
  font-family: var(--font-mono), font-size: 18px, font-weight: 600
  color: var(--color-black)
  background: var(--color-white), padding: var(--space-2) var(--space-4)
  border-radius: var(--radius-full), border: var(--border-light)
  display: inline-block, margin-top: var(--space-2)
  Include Star icon (lucide-react), size 14px, color var(--color-gold), inline

WRONG ANSWER STATE:
- Background: background var(--color-wrong-bg)
- Border: 2px solid var(--color-wrong)
- animation: shake 0.4s ease

- Wrong icon:
  XCircle icon (lucide-react), size 56px, color var(--color-wrong)

- "Incorrect" heading:
  font-family: var(--font-heading), font-size: clamp(24px, 4vw, 40px), font-weight: 700
  color: var(--color-wrong)

- Correct answer revealed below:
  font-family: var(--font-body), font-size: 16px, color: var(--color-charcoal)
  background: var(--color-white), padding: var(--space-3) var(--space-4)
  border-radius: var(--radius-md), border: var(--border-light)
  margin-top: var(--space-3)
  Label "The correct answer was:" in font-size 12px, color var(--color-gray-dark), display block above

SPEED BONUS DISPLAY (if applicable):
- font-family: var(--font-mono), font-size: 13px, font-weight: 600
- color: var(--color-gold), margin-top: var(--space-2)
- Include Zap icon (lucide-react), size 13px, inline

Do not change any timing, auto-advance logic, or score update calls.
```

---

---

# PHASE 9 — Leaderboard Screen

## Goal
Restyle the mid-game or post-game leaderboard. Prestigious, clear rankings, celebratory for top players.

## Safety Rules
- Only restyle. Preserve player data binding, rank sorting logic, and any animations triggered by JS rank changes.

## Prompt

```
You are restyling ONLY the leaderboard screen in a quiz app.
No logic changes. Preserve all data bindings and sorting logic.

PAGE BACKGROUND:
- background: var(--color-off-white) with dot-grid overlay
- max-width: 720px, margin: 0 auto, padding: var(--space-6)

LEADERBOARD HEADER:
- Text ("Leaderboard" / "Rankings"):
  font-family: var(--font-display), font-size: clamp(28px, 4vw, 44px)
  color: var(--color-black), text-align: center, margin-bottom: var(--space-5)
- Trophy icon (lucide-react) centered above heading, size 40px, color var(--color-gold)

TOP 3 PODIUM SECTION (if applicable):
- Arrange as 2nd | 1st | 3rd (1st is tallest, center)
- Each podium block:
  background: var(--color-white), border: var(--border-light)
  border-radius: var(--radius-lg) var(--radius-lg) 0 0
  padding: var(--space-4), text-align: center
- 1st: border-color var(--color-gold), box-shadow: var(--shadow-gold)
  Crown icon (lucide-react) above avatar, size 24px, color var(--color-gold)

LEADERBOARD ROW (each player entry after top 3):
- background: var(--color-white)
- border: var(--border-light)
- border-radius: var(--radius-md)
- padding: var(--space-3) var(--space-4)
- display: flex, align-items: center, gap: var(--space-4)
- margin-bottom: var(--space-2)
- box-shadow: var(--shadow-sm)
- animation: slide-in-right 0.3s ease both
- animation-delay: calc(var(--row-index) * 0.06s)
- transition: var(--transition-fast)

RANK NUMBER:
- width: 32px, text-align: center, flex-shrink: 0
- font-family: var(--font-heading), font-size: 14px, font-weight: 700
- #1: color var(--color-rank-1)
- #2: color var(--color-rank-2)
- #3: color var(--color-rank-3)
- #4+: color var(--color-gray-dark)

PLAYER AVATAR CIRCLE:
- width: 40px, height: 40px, border-radius: var(--radius-full)
- background: var(--color-gold-subtle), border: var(--border-gold)
- display: flex, align-items: center, justify-content: center
- font-family: var(--font-heading), font-size: 15px, font-weight: 700, color var(--color-maroon)

PLAYER NAME:
- font-family: var(--font-body), font-size: 15px, font-weight: 500
- color: var(--color-black), flex: 1

PLAYER SCORE:
- font-family: var(--font-mono), font-size: 16px, font-weight: 600
- color: var(--color-maroon), text-align: right

TOP ROW (#1) SPECIAL:
- border-color: var(--color-gold), border-width: 2px
- box-shadow: var(--shadow-gold)
- background: var(--color-gold-subtle)

Do not change player data fetching, rank sorting, or any real-time update logic.
```

---

---

# PHASE 10 — Results / End Screen

## Goal
Restyle the final results screen. Celebratory, reflective, with clear next steps.

## Safety Rules
- Only restyle. Preserve final score data, retry/replay logic, and share functionality.

## Prompt

```
You are restyling ONLY the end/results screen of a quiz app.
No logic changes. Preserve all final score data, share buttons, and replay logic.
Vibe: Achievement unlocked — premium certificate energy.

PAGE BACKGROUND:
- background: var(--color-off-white) with dot-grid overlay

MAIN RESULT CARD:
- background: var(--color-white)
- border: var(--border-light)
- border-radius: var(--radius-xl)
- box-shadow: var(--shadow-lg)
- padding: var(--space-7) var(--space-6)
- max-width: 600px, margin: var(--space-7) auto
- text-align: center
- animation: scale-in 0.4s ease

TOP ICON / BADGE:
- Trophy icon (lucide-react), size 64px, color var(--color-gold)
- animation: pop 0.5s ease 0.2s both

RESULT HEADING ("Quiz Complete!" / "Well Done!"):
- font-family: var(--font-display)
- font-size: clamp(28px, 5vw, 52px)
- color: var(--color-black), margin-top: var(--space-4)

FINAL SCORE DISPLAY:
- Centered block, margin: var(--space-5) 0
- "Your Score" label: font-family var(--font-body), font-size 12px, color var(--color-gray-dark),
  text-transform uppercase, letter-spacing 0.12em, display block, margin-bottom var(--space-2)
- Score number: font-family var(--font-mono), font-size: clamp(48px, 8vw, 80px), font-weight: 600
  color: var(--color-maroon)
- Thin gold divider line: height 2px, background var(--color-gold), width 80px, margin: var(--space-4) auto

STATS ROW (accuracy, correct count, time):
- display: grid, grid-template-columns: repeat(3, 1fr), gap: var(--space-4), margin: var(--space-5) 0
- Each stat cell:
  background: var(--color-off-white), border: var(--border-light)
  border-radius: var(--radius-md), padding: var(--space-4), text-align: center
- Stat icon: lucide-react icon, size 18px, color var(--color-gold), margin-bottom var(--space-2)
  (Use Target for accuracy, CheckCircle for correct, Clock for time)
- Stat number: font-family var(--font-mono), font-size: 22px, font-weight: 600, color var(--color-maroon)
- Stat label: font-family var(--font-body), font-size: 12px, color var(--color-gray-dark), text-transform uppercase, letter-spacing 0.1em

PLAY AGAIN BUTTON:
- background: var(--color-maroon), color: var(--color-white)
- font-family: var(--font-heading), font-size: 15px, font-weight: 600
- padding: 13px 36px, border-radius: var(--radius-full), border: none
- box-shadow: var(--shadow-maroon)
- Include RotateCcw icon (lucide-react) before text, size 16px
- hover: background var(--color-maroon-dark), transform translateY(-1px)

SHARE BUTTON (secondary):
- background: var(--color-white), color: var(--color-maroon)
- border: var(--border-maroon), border-radius: var(--radius-full)
- Same padding as Play Again
- Include Share2 icon (lucide-react), size 16px
- hover: background var(--color-gold-subtle)

HOME BUTTON:
- Ghost style: background transparent, border: none
- color: var(--color-gray-dark), font-family var(--font-body), font-size 14px
- Include Home icon (lucide-react), size 14px, inline
- hover: color var(--color-maroon)

Do not change any score calculation, share API, or routing logic.
```

---

---

# PHASE 11 — Host Controls Panel

## Goal
Restyle the host dashboard. Clean, authoritative, with clear action hierarchy so the host always knows what to do next.

## Safety Rules
- Only restyle. Preserve all host control logic: next question, pause, kick player, end quiz, show answers.
- Do NOT rename button IDs or classes used in event listeners.

## Prompt

```
You are restyling ONLY the host controls panel/dashboard of a quiz app.
No logic changes. Preserve all control button handlers, player management logic, and real-time state.

HOST PANEL LAYOUT:
- Sidebar or top panel: background var(--color-white), border-right var(--border-light) (if sidebar)
- box-shadow: var(--shadow-md)
- padding: var(--space-5)
- Section label headers: font-family var(--font-body), font-size 11px, font-weight 600,
  color var(--color-gray-dark), text-transform uppercase, letter-spacing 0.12em, margin-bottom var(--space-3)

NEXT QUESTION BUTTON (primary host action):
- background: var(--color-maroon), color: var(--color-white)
- font-family: var(--font-heading), font-size: 15px, font-weight: 600
- padding: 12px 28px, border-radius: var(--radius-md), border: none
- box-shadow: var(--shadow-maroon)
- display: flex, align-items: center, gap: var(--space-2), width: 100%
- SkipForward icon (lucide-react), size 16px
- hover: background var(--color-maroon-dark), transform translateY(-1px)

REVEAL ANSWER BUTTON:
- background: var(--color-gold-subtle), color: var(--color-maroon)
- border: var(--border-gold), border-radius: var(--radius-md)
- Same padding/sizing as Next Question
- Eye icon (lucide-react), size 16px

PAUSE BUTTON:
- background: var(--color-off-white), color: var(--color-charcoal)
- border: var(--border-mid), border-radius: var(--radius-md)
- Pause icon (lucide-react), size 16px
- hover: border-color var(--color-maroon), color var(--color-maroon)

END QUIZ BUTTON:
- background: transparent, color: var(--color-wrong)
- border: 1px solid var(--color-wrong), border-radius: var(--radius-md)
- font-size: 14px, padding: 10px 20px
- hover: background var(--color-wrong-bg)
- Requires confirm dialog before firing — do NOT remove the confirmation logic

CONNECTED PLAYERS COUNT:
- display: flex, align-items: center, gap: var(--space-2)
- Users icon (lucide-react), size 16px, color var(--color-gold)
- Count: font-family var(--font-mono), font-size: 18px, font-weight: 600, color var(--color-maroon)
- Label: font-family var(--font-body), font-size: 12px, color var(--color-gray-dark)

PLAYER LIST IN HOST VIEW:
- Each row: padding var(--space-2) var(--space-3), border-bottom var(--border-light)
- display: flex, align-items: center, justify-content: space-between
- Player name: font-family var(--font-body), font-size: 14px, color var(--color-black)
- Player score: font-family var(--font-mono), font-size: 14px, color var(--color-maroon), font-weight: 600
- Kick button: font-size 12px, color var(--color-gray-dark), background transparent, border none
  Ban icon (lucide-react), size 14px
  hover: color var(--color-wrong)

Do not touch any WebSocket, player kick logic, or game state management.
```

---

---

# PHASE 12 — Micro-interactions & Final Polish

## Goal
Final layer of polish: focus states, loading states, empty states, scrollbars, consistency audit, and mobile check.

## Safety Rules
- CSS only additions. No logic changes.
- Test on mobile, tablet, and desktop before finalizing.

## Prompt

```
You are doing FINAL POLISH on the quiz app UI after all components have been restyled.
This phase is CSS-only micro-interactions and consistency fixes.
No logic changes whatsoever.

1. BUTTON CONSISTENCY AUDIT:
   Every button must have:
   - font-family: var(--font-heading) or var(--font-body)
   - Proper hover state: transform translateY(-1px) + shadow increase
   - Active state: transform translateY(0) + shadow decrease
   - transition: var(--transition-fast)
   - cursor: pointer
   - Minimum height: 40px

2. LOADING STATES:
   - Skeleton loaders:
     background: linear-gradient(90deg, var(--color-gray-light) 25%, var(--color-off-white) 50%, var(--color-gray-light) 75%)
     background-size: 200% 100%
     animation: shimmer 1.5s infinite
     border-radius: var(--radius-sm)
   - Loading spinner (if used): border 3px solid var(--color-gray-light),
     border-top-color var(--color-maroon), border-radius 50%, animation: spin 0.8s linear infinite
   @keyframes spin { to { transform: rotate(360deg); } }

3. EMPTY STATES:
   - Container: text-align center, padding var(--space-8) var(--space-6)
   - Icon: appropriate lucide-react icon, size 48px, color var(--color-gray-mid), margin-bottom var(--space-4)
   - Message: font-family var(--font-heading), font-size 18px, color var(--color-gray-dark)
   - Subtext: font-family var(--font-body), font-size 14px, color var(--color-gray-mid)

4. SCROLLBAR STYLING (webkit):
   ::-webkit-scrollbar { width: 6px; }
   ::-webkit-scrollbar-track { background: transparent; }
   ::-webkit-scrollbar-thumb { background: var(--color-gray-mid); border-radius: var(--radius-full); }
   ::-webkit-scrollbar-thumb:hover { background: var(--color-maroon-light); }

5. FOCUS STATES (accessibility — never remove):
   *:focus-visible {
     outline: 2px solid var(--color-gold);
     outline-offset: 3px;
     border-radius: var(--radius-sm);
   }

6. INPUT / FORM ELEMENTS (find and fix any unstyled inputs):
   input, textarea, select {
     font-family: var(--font-body);
     font-size: 15px;
     border: var(--border-mid);
     border-radius: var(--radius-md);
     padding: var(--space-3) var(--space-4);
     background: var(--color-white);
     color: var(--color-black);
     transition: var(--transition-fast);
   }
   input:focus, textarea:focus, select:focus {
     border-color: var(--color-maroon);
     box-shadow: 0 0 0 3px rgba(128,0,32,0.08);
     outline: none;
   }

7. MODAL / DIALOG (find and fix any unstyled dialogs):
   background: var(--color-white)
   border: var(--border-light)
   border-radius: var(--radius-xl)
   box-shadow: var(--shadow-lg)
   padding: var(--space-6)
   max-width: 480px

8. TOOLTIP (if used):
   background: var(--color-black), color: var(--color-white)
   font-family: var(--font-body), font-size: 12px
   padding: var(--space-2) var(--space-3)
   border-radius: var(--radius-sm)
   box-shadow: var(--shadow-md)

9. MOBILE RESPONSIVE FINAL CHECK:
   - All grid layouts: 1 column on screens below 640px
   - Font sizes: use clamp() for all display/heading sizes
   - Touch targets: minimum 44px height for all interactive elements
   - Padding: reduce var(--space-7) to var(--space-5) on mobile
   - Test that no content overflows horizontally

10. PAGE TRANSITION:
    On route change, the entering page gets:
    animation: fade-in 0.2s ease
    This applies to the top-level page wrapper only.

Do not change any functionality.
```

---

---

## POST-REDESIGN CHECKLIST

Run through this checklist after all phases are complete.

```
VISUAL
[ ] Color palette is consistent: Maroon / Gold / Off-white / White / Black only
[ ] DM Serif Display used only for hero headings and result screens
[ ] Outfit used for headings, card titles, buttons, nav links
[ ] DM Sans used for body text, answer options, labels, descriptions
[ ] JetBrains Mono used for all timers, scores, codes, numeric data
[ ] No default browser styles leaking (no blue link outlines, no default selects)
[ ] Dot-grid background texture consistent across all pages
[ ] All cards have consistent border-radius and shadow
[ ] Gold is used for achievements, highlights, accents — not structural elements
[ ] Maroon is used for primary actions, CTAs, active states
[ ] Icons from lucide-react used consistently throughout
[ ] Every icon is paired with a text label (accessible)
[ ] Shadows feel subtle and real — not decorative

FUNCTIONALITY
[ ] Quiz can be created and started ✓
[ ] Players can join via room code ✓
[ ] Questions display correctly with data ✓
[ ] Answering works and submits to backend ✓
[ ] Score updates correctly ✓
[ ] Leaderboard updates in real-time ✓
[ ] Host controls all work ✓
[ ] End screen shows correct final data ✓
[ ] All API calls work (check Network tab — no 4xx/5xx errors) ✓
[ ] No console errors ✓

RESPONSIVE
[ ] Mobile (375px): all screens usable, no horizontal scroll ✓
[ ] Tablet (768px): layout correct ✓
[ ] Desktop (1280px+): layout correct, max-widths respected ✓
[ ] All touch targets minimum 44px height ✓

PERFORMANCE
[ ] Google Fonts loaded with display=swap (check Network tab) ✓
[ ] No layout shift from font loading ✓
[ ] Animations run at 60fps (check FPS in DevTools) ✓
[ ] No unused CSS variables or redundant styles ✓

ACCESSIBILITY
[ ] All interactive elements have visible :focus-visible styles ✓
[ ] Color contrast meets WCAG AA (maroon on white passes) ✓
[ ] Icon-only elements have aria-label attributes ✓
[ ] Error states use both color AND icon (not color alone) ✓
```

---

## WHAT THIS GUIDE NEVER TOUCHES

```
Backend routes / controllers / services
Database schemas or queries
API endpoints or WebSocket logic
Authentication / session logic
Score calculation algorithms
Timer countdown logic (visuals only)
Player join / kick logic (visuals only)
Any .env or configuration files
Any test files
```

---

## ICON QUICK REFERENCE (lucide-react)

| Use Case | Icon Name | Notes |
|----------|-----------|-------|
| App logo accent | `BookOpen` | Pair with brand name |
| Start quiz | `Play` | Inside CTA buttons |
| Leaderboard | `Trophy` | Gold color |
| First place | `Crown` | Gold color |
| Achievement | `Medal` | Gold / silver / bronze |
| Correct answer | `CheckCircle` | Green (#1A7A4A) |
| Wrong answer | `XCircle` | Red (#C0392B) |
| Timer | `Clock` | Changes color with state |
| Score | `Trophy` | Maroon color |
| Streak | `Zap` | Gold color |
| Players | `Users` | Maroon color |
| Next question | `SkipForward` | Host panel |
| Reveal answer | `Eye` | Host panel |
| Pause | `Pause` | Host panel |
| End quiz | `StopCircle` | Red/destructive |
| Kick player | `Ban` | Small, subtle |
| Home | `Home` | Navigation |
| Share | `Share2` | Results screen |
| Replay | `RotateCcw` | Results screen |
| Settings | `Settings` | Nav |
| Copy code | `Copy` | Lobby room code |

---

*End of QUIZ_REDESIGN_PROMPT_GUIDE.md*
*Version 2.0 — Aurum Design System | Maroon × Gold × White × Black*
*This guide is designed to be read by an AI assistant or human UI developer as a sequential redesign instruction set.*
