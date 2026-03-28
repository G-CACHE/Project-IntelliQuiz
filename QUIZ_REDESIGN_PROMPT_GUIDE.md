# 🎮 QUIZ SYSTEM — UI REDESIGN PROMPT GUIDE
> **Version:** 1.0 | **Style:** Neo-Brutalism × Pixel-Pop Hybrid  
> **Purpose:** Step-by-step UI redesign prompts for AI or human UI developers.  
> **Scope:** Frontend only — zero changes to backend, API, database, or business logic.

---

## 📌 HOW TO USE THIS GUIDE

- Follow each **Phase** in order. Do NOT skip phases.
- Each phase has a **prompt block** you paste directly to your UI developer or AI tool.
- Every phase targets **one isolated UI section** to avoid breaking other parts.
- After each phase: **test all existing functionality** before moving to the next.
- This guide only changes: CSS, fonts, colors, layout, component visuals, animations.
- This guide never changes: API calls, data bindings, route logic, state management, backend endpoints.

---

## 🎨 DESIGN SYSTEM FOUNDATION

> Read this section first. All phases below reference these tokens.

### Style Identity
**Name:** `PixelBrute` — Neo-Brutalism structure with Pixel-Pop energy  
**Vibe:** Bold, loud, fun, game-like. Think Kahoot meets a retro arcade cabinet.  
**References:**
- Image 1: Pixel platformer game — chunky pixel fonts, bright sky palette, pixel sprites
- Image 2: Neon green NFT app — lime green background, white cards, bold black typography, playful doodle accents
- Image 3: Yellow/purple gaming page — electric yellow base, deep purple sections, rounded chunky elements, retro game controller icons

---

### 🔤 Typography System

```
DISPLAY FONT:   "Press Start 2P" (Google Fonts) → use for scores, game over, question numbers, big headings
HEADING FONT:   "Boogaloo" (Google Fonts) → use for question text, section titles, CTA buttons
BODY FONT:      "Nunito" (Google Fonts) → use for answer options, descriptions, instructions
MONO/DATA FONT: "Share Tech Mono" (Google Fonts) → use for timers, countdowns, point values
```

**Google Fonts import (add to global CSS or index.html `<head>`):**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Boogaloo&family=Nunito:wght@400;700;900&family=Share+Tech+Mono&display=swap" rel="stylesheet">
```

**Font Usage Rules:**
- `Press Start 2P` → max 3 sizes only: 48px (hero), 24px (score), 14px (labels). Never use for body text.
- `Boogaloo` → 32px headings, 22px subheadings, 18px buttons
- `Nunito` → 16px body, 14px captions. Weight 700 for answer options, 400 for descriptions
- `Share Tech Mono` → always uppercase, letter-spacing: 0.1em, for any number/timer display

---

### 🎨 Color Palette

```css
:root {
  /* === PRIMARY PALETTE === */
  --color-primary:       #FFE500;   /* Electric Yellow — main brand color, buttons, highlights */
  --color-secondary:     #5B21FF;   /* Deep Violet — headers, nav, large sections */
  --color-accent-pink:   #FF2D78;   /* Hot Pink — wrong answer states, alerts */
  --color-accent-green:  #00E87A;   /* Neon Green — correct answer states, success */
  --color-accent-orange: #FF6B00;   /* Pixel Orange — streaks, bonuses, fire effects */

  /* === NEUTRALS === */
  --color-black:         #0D0D0D;   /* Near-black — borders, text, shadows */
  --color-white:         #FAFAF5;   /* Warm white — card backgrounds */
  --color-cream:         #FFF8DC;   /* Cream — page backgrounds (light mode) */

  /* === GAME STATE COLORS === */
  --color-correct:       #00E87A;   /* Correct answer */
  --color-wrong:         #FF2D78;   /* Wrong answer */
  --color-timer-ok:      #FFE500;   /* Timer — plenty of time */
  --color-timer-warn:    #FF6B00;   /* Timer — running low */
  --color-timer-danger:  #FF2D78;   /* Timer — critical */

  /* === LEADERBOARD RANKS === */
  --color-rank-1:        #FFD700;   /* Gold */
  --color-rank-2:        #C0C0C0;   /* Silver */
  --color-rank-3:        #CD7F32;   /* Bronze */

  /* === NEO-BRUTALISM SHADOW === */
  --shadow-brutal:       4px 4px 0px var(--color-black);
  --shadow-brutal-lg:    6px 6px 0px var(--color-black);
  --shadow-brutal-hover: 2px 2px 0px var(--color-black);

  /* === BORDER === */
  --border-brutal:       3px solid var(--color-black);
  --border-radius-pixel: 4px;    /* Slightly rounded for pixel feel */
  --border-radius-card:  8px;    /* Cards */
  --border-radius-btn:   6px;    /* Buttons */

  /* === GRID BACKGROUND TEXTURE === */
  --bg-grid: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect width='20' height='20' fill='none'/%3E%3Cpath d='M 20 0 L 0 0 0 20' fill='none' stroke='%230D0D0D' stroke-width='0.3' stroke-opacity='0.08'/%3E%3C/svg%3E");
}
```

---

### 🧱 Core Component Rules (apply to ALL phases)

```
1. BORDERS:       All interactive elements use --border-brutal (3px solid black)
2. SHADOWS:       All cards/buttons use --shadow-brutal. On hover: translate(-2px, -2px) + shadow grows
3. BUTTONS:       Flat fill + border + shadow. NO gradients. Active state: translate(4px, 4px) shadow disappears
4. CARDS:         White/cream background + thick border + offset shadow
5. BACKGROUNDS:   Page bg = --color-cream with --bg-grid overlay (subtle grid like Image 3)
6. ANIMATIONS:    CSS only. Pixel-jump keyframes for correct answers. Shake keyframe for wrong answers
7. NO GLASSMORPHISM, no blur effects, no soft shadows, no rounded corners above 8px
8. PIXEL ACCENTS: Use CSS box-shadow stacking to simulate pixel-art borders on key elements
```

---

## 🚦 PHASES OVERVIEW

| Phase | Section | Est. Effort |
|-------|---------|-------------|
| Phase 0 | Global CSS Variables & Fonts | 1–2 hrs |
| Phase 1 | Navigation / Header Bar | 1–2 hrs |
| Phase 2 | Home / Landing Screen | 2–3 hrs |
| Phase 3 | Quiz Lobby / Room Screen | 1–2 hrs |
| Phase 4 | Question Card Component | 2–3 hrs |
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

## 🎯 Goal
Inject the new design tokens system-wide WITHOUT touching any component logic.
This is the foundation. All other phases build on this.

## ⚠️ Safety Rules
- Only edit: `global.css` / `index.css` / `app.css` (whichever is your global stylesheet)
- Do NOT edit any component files yet
- Do NOT change any class names that are referenced in JS/JSX/TS files
- Add variables ONLY inside `:root {}` — do not replace existing variables yet, add alongside them

## 📋 Prompt to give your UI developer / AI

```
You are redesigning the global CSS foundation of a quiz app (similar to Kahoot/Quizlet).
Do NOT touch any component files, JS, TS, or backend files.
Only modify the global stylesheet.

TASK: Add the following CSS custom properties to the :root {} block in the global stylesheet.
If a :root block already exists, ADD these variables inside it without removing existing ones.
Also add the Google Fonts import at the very top of the file.

Add this import at the top:
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Boogaloo&family=Nunito:wght@400;700;900&family=Share+Tech+Mono&display=swap');

Add these variables inside :root:
  --font-display: 'Press Start 2P', monospace;
  --font-heading: 'Boogaloo', cursive;
  --font-body: 'Nunito', sans-serif;
  --font-mono: 'Share Tech Mono', monospace;
  --color-primary: #FFE500;
  --color-secondary: #5B21FF;
  --color-accent-pink: #FF2D78;
  --color-accent-green: #00E87A;
  --color-accent-orange: #FF6B00;
  --color-black: #0D0D0D;
  --color-white: #FAFAF5;
  --color-cream: #FFF8DC;
  --color-correct: #00E87A;
  --color-wrong: #FF2D78;
  --color-timer-ok: #FFE500;
  --color-timer-warn: #FF6B00;
  --color-timer-danger: #FF2D78;
  --color-rank-1: #FFD700;
  --color-rank-2: #C0C0C0;
  --color-rank-3: #CD7F32;
  --shadow-brutal: 4px 4px 0px #0D0D0D;
  --shadow-brutal-lg: 6px 6px 0px #0D0D0D;
  --shadow-brutal-hover: 2px 2px 0px #0D0D0D;
  --border-brutal: 3px solid #0D0D0D;
  --border-radius-pixel: 4px;
  --border-radius-card: 8px;
  --border-radius-btn: 6px;

Also add these global keyframe animations at the bottom of the global stylesheet:
@keyframes pixel-jump {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}
@keyframes pixel-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}
@keyframes pixel-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}
@keyframes pixel-flash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}

After making changes, verify the page still loads and all existing functionality works.
Report what file was changed and show the diff.
```

---

---

# PHASE 1 — Navigation / Header Bar

## 🎯 Goal
Restyle the top navigation bar to match the PixelBrute design system.

## ⚠️ Safety Rules
- Only change CSS/styles of the nav component
- Do NOT change navigation links, route paths, or onClick handlers
- Do NOT remove or rename any existing CSS class names used in JS
- Add new classes with prefix `pb-` (PixelBrute) to avoid conflicts

## 📋 Prompt to give your UI developer / AI

```
You are restyling ONLY the navigation/header bar of a quiz app.
Do NOT change any routing logic, links, or JavaScript.
Do NOT remove existing class names — only add new styling on top.
Reference style: Bold yellow top bar like Image 3 (gaming landing page),
thick black border on bottom, game-controller energy.

TARGET LOOK:
- Background: var(--color-secondary) [deep violet #5B21FF]
- Bottom border: 4px solid var(--color-black)
- Box shadow: 0 4px 0 var(--color-black)
- Logo text: font-family var(--font-display), color var(--color-primary) [yellow], font-size 16px, text-shadow: 2px 2px 0 var(--color-black)
- Nav links: font-family var(--font-heading), color white, font-size 18px, uppercase
- Nav link hover: background var(--color-primary), color var(--color-black), padding 4px 10px, border: 2px solid var(--color-black), box-shadow: var(--shadow-brutal-hover), transition: all 0.1s
- Active nav link: background var(--color-primary), color var(--color-black)
- User avatar/profile pill: border: var(--border-brutal), box-shadow: var(--shadow-brutal), background white
- CTA button in nav (e.g., "Host Quiz", "Join"): background var(--color-primary), color var(--color-black), font-family var(--font-heading), border: var(--border-brutal), box-shadow: var(--shadow-brutal), border-radius: var(--border-radius-btn), padding: 8px 20px, font-size: 18px
- CTA button hover: transform translateX(-2px) translateY(-2px), box-shadow: var(--shadow-brutal-lg)
- CTA button active: transform translateX(4px) translateY(4px), box-shadow: none

Keep the navbar fully responsive. On mobile: hamburger icon stays, just restyle it to use --color-primary color.
```

---

---

# PHASE 2 — Home / Landing Screen

## 🎯 Goal
Redesign the main landing/home page hero section.

## ⚠️ Safety Rules
- Only restyle the home page component's CSS
- Do NOT change any data fetching, routing links, or state logic
- Preserve all existing button onClick handlers — only restyle the buttons

## 📋 Prompt to give your UI developer / AI

```
You are restyling ONLY the home/landing page of a quiz app.
No logic changes. Only visual redesign.
Reference: Image 2 (neon green NFT app energy — big bold text, white cards on vivid background)
and Image 3 (yellow/purple gaming page — chunky layout, game icons, retro fun).

TARGET LOOK FOR THE HOME PAGE:

PAGE BACKGROUND:
- Background color: var(--color-cream) [#FFF8DC]
- Add subtle grid overlay using CSS background-image:
  background-image: linear-gradient(rgba(13,13,13,0.06) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(13,13,13,0.06) 1px, transparent 1px);
  background-size: 24px 24px;

HERO SECTION:
- Main heading (e.g., "Quiz Time!" or app name): 
  font-family: var(--font-display)
  font-size: clamp(32px, 6vw, 72px)
  color: var(--color-black)
  text-shadow: 4px 4px 0 var(--color-secondary), 8px 8px 0 rgba(91,33,255,0.2)
  line-height: 1.1
- Sub-heading: font-family var(--font-heading), font-size 24px, color var(--color-secondary)
- Hero background section: var(--color-primary) [yellow], with the grid overlay on top
- Decorative pixel-art style border on the hero block:
  border: 4px solid var(--color-black)
  box-shadow: 8px 8px 0 var(--color-secondary)

PRIMARY CTA BUTTON ("Create Quiz", "Join Game", "Start"):
- background: var(--color-secondary)
- color: var(--color-primary)
- font-family: var(--font-heading)
- font-size: 24px
- padding: 14px 36px
- border: var(--border-brutal)
- box-shadow: var(--shadow-brutal-lg)
- border-radius: var(--border-radius-btn)
- hover: transform translate(-3px, -3px), box-shadow: 9px 9px 0 var(--color-black)
- active: transform translate(6px, 6px), box-shadow: none

SECONDARY CTA BUTTON:
- background: var(--color-white)
- color: var(--color-black)
- Same border and shadow rules as primary
- hover: background var(--color-primary)

FEATURE CARDS (if present on home):
- background: var(--color-white)
- border: var(--border-brutal)
- box-shadow: var(--shadow-brutal-lg)
- border-radius: var(--border-radius-card)
- padding: 24px
- Card icon area: background var(--color-primary), padding 12px, border: 2px solid var(--color-black), display inline-block
- Card title: font-family var(--font-heading), font-size 22px
- Card body: font-family var(--font-body), font-size 15px
- Card hover: transform translate(-3px, -3px), box-shadow: 9px 9px 0 var(--color-black)

Do not change any onClick, routing, or API calls.
```

---

---

# PHASE 3 — Quiz Lobby / Room Screen

## 🎯 Goal
Restyle the "waiting room" or lobby where players join before a quiz starts.

## ⚠️ Safety Rules
- Only restyle visuals
- Preserve: room code display logic, player join list data binding, countdown timer logic, host start button handler

## 📋 Prompt to give your UI developer / AI

```
You are restyling ONLY the quiz lobby/waiting room screen.
No logic, state, or data changes. Visual redesign only.
Vibe: Pixel arcade game lobby — like a retro game select screen.
Reference: Image 1 (pixel platformer) for the chunky bordered UI panels.

ROOM CODE DISPLAY:
- Large display box: background var(--color-secondary), border: 4px solid var(--color-black)
- box-shadow: 8px 8px 0 var(--color-black)
- Room code text: font-family var(--font-display), font-size 36px, color var(--color-primary)
- Label above code ("Game PIN" or "Room Code"): font-family var(--font-heading), color white, font-size 18px, letter-spacing 0.1em, uppercase

PLAYER LIST / AVATAR GRID:
- Each player tile: background var(--color-white), border: var(--border-brutal)
- box-shadow: var(--shadow-brutal)
- border-radius: var(--border-radius-card)
- Player name: font-family var(--font-heading), font-size 16px, color var(--color-black)
- Avatar background: rotate through [var(--color-primary), var(--color-secondary), var(--color-accent-pink), var(--color-accent-green), var(--color-accent-orange)] based on player index % 5
- New player joining animation: animation: pixel-pop 0.3s ease-out

WAITING TEXT / STATUS:
- "Waiting for players..." : font-family var(--font-display), font-size 12px, color var(--color-secondary)
- Add blinking cursor effect: animation: pixel-flash 1s infinite

HOST START BUTTON:
- background: var(--color-accent-green)
- color: var(--color-black)
- font-family: var(--font-heading)
- font-size: 28px
- padding: 16px 48px
- border: var(--border-brutal)
- box-shadow: var(--shadow-brutal-lg)
- border-radius: var(--border-radius-btn)
- hover: transform translate(-3px,-3px), box-shadow: 9px 9px 0 var(--color-black)

PAGE BACKGROUND: var(--color-cream) with grid overlay (same as home page)

Do not change any WebSocket connections, room join logic, player state, or host controls logic.
```

---

---

# PHASE 4 — Question Card Component

## 🎯 Goal
Restyle the main question display card that shows during active quiz.

## ⚠️ Safety Rules
- Only restyle the question card component CSS
- Preserve: question text data binding, question number logic, image display (if any), media handling
- Do NOT change timer logic — only restyle the timer visuals (that comes in Phase 6)

## 📋 Prompt to give your UI developer / AI

```
You are restyling ONLY the question card component in a quiz app.
No data or logic changes.
Reference: Image 3 (the purple game section card) + Image 1 (chunky pixel-bordered panels).

QUESTION CARD CONTAINER:
- background: var(--color-secondary) [deep violet]
- border: 4px solid var(--color-black)
- box-shadow: var(--shadow-brutal-lg)
- border-radius: var(--border-radius-card)
- padding: 32px 40px
- min-height: 180px
- position: relative
- max-width: 900px, centered

QUESTION NUMBER BADGE (e.g., "Q 3"):
- position: absolute, top: -18px, left: 24px
- background: var(--color-primary)
- color: var(--color-black)
- font-family: var(--font-display)
- font-size: 12px
- padding: 6px 16px
- border: var(--border-brutal)
- box-shadow: var(--shadow-brutal)

QUESTION TEXT:
- font-family: var(--font-heading)
- font-size: clamp(20px, 3vw, 34px)
- color: var(--color-white)
- line-height: 1.3
- text-align: center

CATEGORY / TAG BADGE (if present):
- background: var(--color-accent-pink)
- color: white
- font-family: var(--font-body)
- font-size: 12px
- font-weight: 700
- padding: 3px 12px
- border: 2px solid var(--color-black)
- border-radius: 3px
- position: absolute, top: -18px, right: 24px

QUESTION IMAGE (if exists):
- border: var(--border-brutal)
- box-shadow: var(--shadow-brutal)
- border-radius: var(--border-radius-pixel)
- max-height: 240px, object-fit: cover

PAGE BACKGROUND DURING QUIZ:
- background: var(--color-cream) with grid overlay

Do not change any question data fetching, state, or timer logic.
```

---

---

# PHASE 5 — Answer Option Buttons

## 🎯 Goal
Restyle the 4 answer option buttons. This is one of the most impactful visual changes.

## ⚠️ Safety Rules
- Only restyle the answer buttons CSS
- Preserve ALL onClick handlers, answer submission logic, disabled states logic, and correct/wrong class toggling
- If existing code adds classes like `.correct`, `.wrong`, `.selected` via JS — keep those class names, just add new styles for them

## 📋 Prompt to give your UI developer / AI

```
You are restyling ONLY the answer option buttons in a quiz app.
These are the 4 clickable answer choices shown during a quiz question.
Do NOT change onClick handlers, state, submission logic, or disabled states.
If existing JS adds classes like "correct", "wrong", "selected", "disabled" — preserve those class names exactly.

ANSWER BUTTON BASE STYLE (all 4 options):
- display: flex, align-items: center, gap: 12px
- width: 100%
- padding: 16px 24px
- font-family: var(--font-heading)
- font-size: 20px
- font-weight: 700 (Nunito bold)
- border: var(--border-brutal)
- box-shadow: var(--shadow-brutal)
- border-radius: var(--border-radius-btn)
- cursor: pointer
- transition: transform 0.08s, box-shadow 0.08s
- text-align: left
- position: relative
- overflow: hidden

ANSWER OPTION COLOR VARIANTS (assign one per answer A/B/C/D):
- Option A: background #FF6B6B (coral red), color white
- Option B: background #4ECDC4 (teal), color var(--color-black)
- Option C: background #FFE500 (yellow), color var(--color-black)
- Option D: background #A855F7 (purple), color white

ANSWER LETTER BADGE (A, B, C, D — shown on left side of button):
- width: 36px, height: 36px
- background: rgba(0,0,0,0.2)
- border: 2px solid rgba(0,0,0,0.3)
- border-radius: 4px
- font-family: var(--font-display)
- font-size: 11px
- display: flex, align-items: center, justify-content: center
- flex-shrink: 0

HOVER STATE (not yet answered):
- transform: translate(-2px, -2px)
- box-shadow: var(--shadow-brutal-lg)

ACTIVE/CLICK STATE:
- transform: translate(4px, 4px)
- box-shadow: none

SELECTED STATE (.selected class):
- border-width: 4px
- border-color: var(--color-black)
- brightness: 1.1

CORRECT STATE (.correct class — added by existing JS):
- background: var(--color-correct) [#00E87A] !important
- color: var(--color-black) !important
- border-color: var(--color-black)
- animation: pixel-jump 0.4s ease-out
- Add checkmark icon via ::after pseudo-element: content "✓", position absolute, right 16px, font-size 24px, font-weight 900

WRONG STATE (.wrong class — added by existing JS):
- background: var(--color-wrong) [#FF2D78] !important
- color: white !important
- animation: pixel-shake 0.4s ease-out
- Add X icon via ::after: content "✗", position absolute, right 16px, font-size 24px

DISABLED STATE (.disabled class):
- opacity: 0.5
- cursor: not-allowed
- pointer-events: none

ANSWER GRID LAYOUT:
- Display as 2x2 grid on desktop: grid-template-columns: 1fr 1fr, gap: 16px
- On mobile: single column
- Max-width: 900px, centered

Do not change any JS logic whatsoever.
```

---

---

# PHASE 6 — Timer Component

## 🎯 Goal
Restyle the countdown timer shown during questions.

## ⚠️ Safety Rules
- Only restyle CSS
- Preserve all timer logic, countdown state, and any JS that changes timer classes or values
- If JS changes a class on the timer based on time remaining, preserve those class names

## 📋 Prompt to give your UI developer / AI

```
You are restyling ONLY the timer/countdown component in a quiz app.
Do NOT change any timer logic, countdown calculations, or class-toggling JavaScript.

TIMER CONTAINER:
- display: flex, align-items: center, justify-content: center
- width: 72px, height: 72px (circular)
- border: 4px solid var(--color-black)
- border-radius: 50%
- box-shadow: var(--shadow-brutal)
- background: var(--color-timer-ok) [yellow] — default state
- position: relative
- transition: background 0.3s

TIMER NUMBER TEXT:
- font-family: var(--font-display)
- font-size: 20px
- color: var(--color-black)
- line-height: 1

WARNING STATE (when timer class changes to indicate low time — keep existing class names):
- background: var(--color-timer-warn) [#FF6B00]
- animation: pixel-flash 0.8s infinite

DANGER STATE (critical time — keep existing class names):
- background: var(--color-timer-danger) [#FF2D78]
- color: white
- animation: pixel-flash 0.4s infinite
- transform: scale(1.1)

PROGRESS BAR VERSION (if a bar-style timer exists):
- height: 16px
- background: var(--color-timer-ok)
- border: var(--border-brutal)
- border-radius: var(--border-radius-pixel)
- box-shadow: var(--shadow-brutal)
- The fill/progress element inside: transition: width 1s linear

Do not change any timer countdown logic.
```

---

---

# PHASE 7 — Score / Points Display

## 🎯 Goal
Restyle the score/points counter shown to players during the quiz.

## ⚠️ Safety Rules
- Only restyle. Do NOT change score calculation logic or state management.

## 📋 Prompt to give your UI developer / AI

```
You are restyling ONLY the score/points display component.
No logic changes. Preserve all data bindings and state.

SCORE DISPLAY CONTAINER:
- background: var(--color-black)
- border: 3px solid var(--color-primary)
- box-shadow: 4px 4px 0 var(--color-primary)
- padding: 8px 20px
- border-radius: var(--border-radius-card)
- display: inline-flex, align-items: center, gap: 10px

SCORE LABEL ("SCORE", "PTS", "POINTS"):
- font-family: var(--font-display)
- font-size: 9px
- color: rgba(255,255,255,0.5)
- text-transform: uppercase
- letter-spacing: 0.15em

SCORE NUMBER VALUE:
- font-family: var(--font-display)
- font-size: 22px
- color: var(--color-primary)
- transition: all 0.3s

SCORE INCREASE ANIMATION (when points are added — trigger via JS adding a class):
- Create class .score-pop: animation: pixel-pop 0.3s ease-out

STREAK BADGE (if streak counter exists):
- background: var(--color-accent-orange)
- color: white
- font-family: var(--font-heading)
- font-size: 14px
- padding: 2px 10px
- border: 2px solid var(--color-black)
- border-radius: 3px
- box-shadow: 2px 2px 0 var(--color-black)

BONUS POINTS POPUP (floating +200, +BONUS text that appears briefly):
- position: absolute
- font-family: var(--font-display)
- font-size: 14px
- color: var(--color-accent-green)
- text-shadow: 2px 2px 0 var(--color-black)
- animation: float 1s ease-out forwards, then fade out
- pointer-events: none

Do not change score calculation, bonus logic, or state management.
```

---

---

# PHASE 8 — Correct / Wrong Answer Feedback States

## 🎯 Goal
Restyle the full-screen or overlay feedback shown after answering (correct/wrong flash screens).

## ⚠️ Safety Rules
- Only restyle the feedback overlay/screen CSS
- Preserve: timing logic, transition to next question, score update calls

## 📋 Prompt to give your UI developer / AI

```
You are restyling ONLY the answer feedback overlay/screen in a quiz app.
This is the screen shown briefly after a player answers (correct or wrong).
Do NOT change timing, transitions to next question, or score update logic.
Reference: Image 1 (pixel game — chunky bordered feedback panels).

CORRECT ANSWER OVERLAY / STATE:
- Background: var(--color-correct) [#00E87A]
- Add grid overlay on top (same grid as other pages)
- Big checkmark or "CORRECT!" heading:
  font-family: var(--font-display)
  font-size: clamp(28px, 5vw, 56px)
  color: var(--color-black)
  text-shadow: 4px 4px 0 rgba(0,0,0,0.2)
- Points earned display: font-family var(--font-display), font-size 24px, color var(--color-black)
- Animate entrance: scale from 0.5 to 1, animation: pixel-pop 0.3s ease-out

WRONG ANSWER OVERLAY / STATE:
- Background: var(--color-wrong) [#FF2D78]
- "WRONG!" heading: same font rules, color white
- Correct answer shown below: font-family var(--font-heading), font-size 20px, background rgba(0,0,0,0.2), padding 12px 20px, border-radius 4px, color white
- Shake animation on load: animation: pixel-shake 0.4s ease-out

SHARED FEEDBACK RULES:
- border: 4px solid var(--color-black) (if it's a card/modal, not full screen)
- box-shadow: var(--shadow-brutal-lg)
- border-radius: var(--border-radius-card)
- Transition in: animation: pixel-pop 0.2s ease-out

TIME BONUS DISPLAY (if shown):
- font-family: var(--font-mono)
- font-size: 14px
- color: var(--color-black)
- opacity: 0.7
- "SPEED BONUS +100" etc.

Do not change any timing, auto-advance, or score update logic.
```

---

---

# PHASE 9 — Leaderboard Screen

## 🎯 Goal
Restyle the mid-game or post-game leaderboard.

## ⚠️ Safety Rules
- Only restyle. Preserve player data binding, rank sorting logic, and any animations triggered by JS rank changes.

## 📋 Prompt to give your UI developer / AI

```
You are restyling ONLY the leaderboard screen in a quiz app.
No logic changes. Preserve all data bindings and sorting logic.
Reference: Image 3 (gaming leaderboard energy) + Image 2 (bold stats display from NFT app).

PAGE / SECTION BACKGROUND:
- Background: var(--color-secondary) [deep violet]
- Grid overlay (same as other pages but lighter: rgba(255,255,255,0.05))

LEADERBOARD TITLE ("LEADERBOARD", "TOP PLAYERS"):
- font-family: var(--font-display)
- font-size: clamp(20px, 4vw, 40px)
- color: var(--color-primary)
- text-shadow: 3px 3px 0 var(--color-black)
- text-align: center
- letter-spacing: 0.05em

LEADERBOARD ROW (each player entry):
- background: var(--color-white)
- border: var(--border-brutal)
- box-shadow: var(--shadow-brutal)
- border-radius: var(--border-radius-card)
- padding: 12px 20px
- display: flex, align-items: center, gap: 16px
- margin-bottom: 10px

RANK NUMBER (#1, #2, #3):
- font-family: var(--font-display)
- font-size: 16px
- width: 40px, text-align: center
- #1: color var(--color-rank-1) [gold]
- #2: color var(--color-rank-2) [silver]
- #3: color var(--color-rank-3) [bronze]
- #4+: color var(--color-black), opacity 0.5

PLAYER AVATAR CIRCLE:
- width: 44px, height: 44px, border-radius: 50%
- border: 3px solid var(--color-black)
- Colors rotate: index % 5 maps to [primary, secondary, accent-pink, accent-green, accent-orange]
- Player initials: font-family var(--font-heading), font-size 18px, color white

PLAYER NAME:
- font-family: var(--font-heading)
- font-size: 20px
- color: var(--color-black)
- flex: 1

PLAYER SCORE:
- font-family: var(--font-display)
- font-size: 14px
- color: var(--color-secondary)
- text-align: right

#1 ROW SPECIAL STYLING:
- background: var(--color-primary)
- border-width: 4px
- box-shadow: var(--shadow-brutal-lg)
- Scale: transform scale(1.02)
- Rank number gets a crown emoji via ::before or a pixel crown SVG

ROW ENTRANCE ANIMATION (stagger):
- Each row: animation: pixel-pop 0.2s ease-out
- Stagger with animation-delay: calc(var(--row-index) * 0.08s)
- Set --row-index via inline style on each row element

Do not change player data fetching, rank sorting, or any real-time update logic.
```

---

---

# PHASE 10 — Results / End Screen

## 🎯 Goal
Restyle the final results screen shown at the end of a quiz.

## ⚠️ Safety Rules
- Only restyle. Preserve final score data, retry/replay logic, share functionality.

## 📋 Prompt to give your UI developer / AI

```
You are restyling ONLY the end/results screen of a quiz app.
No logic changes. Preserve all final score data, share buttons, and replay logic.
Vibe: Pixel game "GAME OVER / YOU WIN" screen. Reference: Image 1 directly.

PAGE BACKGROUND:
- Full page: background var(--color-primary) [yellow]
- Grid overlay
- Consider a pixel-art style landscape silhouette at the bottom (CSS only, using box-shadows)

MAIN RESULT HEADING ("QUIZ COMPLETE!", "GAME OVER", "YOU WIN!"):
- font-family: var(--font-display)
- font-size: clamp(28px, 6vw, 72px)
- color: var(--color-secondary)
- text-shadow: 6px 6px 0 var(--color-black), -2px -2px 0 var(--color-black)
- text-align: center
- animation: pixel-pop 0.5s ease-out

FINAL SCORE DISPLAY:
- Large centered card: background var(--color-black), border: 4px solid var(--color-primary)
- box-shadow: 8px 8px 0 var(--color-secondary)
- border-radius: var(--border-radius-card)
- padding: 32px 48px
- Score number: font-family var(--font-display), font-size clamp(36px, 6vw, 80px), color var(--color-primary)
- "FINAL SCORE" label: font-family var(--font-display), font-size 10px, color white, opacity 0.5, letter-spacing 0.2em

STATS ROW (accuracy, correct count, time, etc.):
- display grid, grid-template-columns repeat(3, 1fr), gap 16px
- Each stat cell: background var(--color-white), border var(--border-brutal), box-shadow var(--shadow-brutal), padding 16px, border-radius var(--border-radius-card), text-align center
- Stat number: font-family var(--font-display), font-size 22px, color var(--color-secondary)
- Stat label: font-family var(--font-body), font-size 12px, color var(--color-black), opacity 0.6, uppercase, letter-spacing 0.1em

PLAY AGAIN BUTTON:
- background: var(--color-secondary)
- color: var(--color-primary)
- font-family: var(--font-heading), font-size: 26px
- padding: 14px 40px
- border: var(--border-brutal), box-shadow: var(--shadow-brutal-lg)
- border-radius: var(--border-radius-btn)
- hover: transform translate(-3px,-3px), box-shadow 9px 9px 0 var(--color-black)

SHARE BUTTON (secondary):
- background: var(--color-white)
- color: var(--color-black)
- Same border/shadow rules

HOME BUTTON (tertiary):
- background: transparent
- color: var(--color-black)
- border: var(--border-brutal)
- box-shadow: var(--shadow-brutal)

RANK/MEDAL BADGE (if player rank is shown):
- font-family: var(--font-display)
- #1 badge: background gold, black border, black text, font-size 12px, padding 8px 20px, box-shadow var(--shadow-brutal)

Do not change any score calculation, share API, or routing logic.
```

---

---

# PHASE 11 — Host Controls Panel

## 🎯 Goal
Restyle the host dashboard/controls panel (the screen only the quiz host/teacher sees).

## ⚠️ Safety Rules
- Only restyle. Preserve all host control logic: next question, pause, kick player, end quiz, show answers.
- Do NOT rename button IDs or classes used in event listeners.

## 📋 Prompt to give your UI developer / AI

```
You are restyling ONLY the host controls panel / dashboard of a quiz app.
No logic changes. Preserve all control button handlers, player management logic, and real-time state.

HOST PANEL LAYOUT:
- Sidebar or top panel: background var(--color-black), border-right or border-bottom 4px solid var(--color-primary)
- Control section label: font-family var(--font-display), font-size 9px, color var(--color-primary), letter-spacing 0.2em, uppercase

NEXT QUESTION BUTTON (primary host action):
- background: var(--color-accent-green)
- color: var(--color-black)
- font-family: var(--font-heading), font-size: 22px
- padding: 12px 32px
- border: var(--border-brutal), box-shadow: var(--shadow-brutal)
- border-radius: var(--border-radius-btn)
- hover/active: same brutal press effect as other buttons

SHOW ANSWER / REVEAL BUTTON:
- background: var(--color-primary)
- color: var(--color-black)
- Same styling rules

PAUSE BUTTON:
- background: var(--color-accent-orange)
- color: white
- Same styling rules

END QUIZ BUTTON:
- background: var(--color-accent-pink)
- color: white
- Same styling rules
- Requires confirm dialog before firing — do NOT remove the confirmation logic

CONNECTED PLAYERS COUNT:
- font-family: var(--font-display), font-size: 14px, color: var(--color-primary)
- Label: "PLAYERS ONLINE", font-family var(--font-display), font-size 8px, color rgba(255,255,255,0.4)

PLAYER LIST IN HOST VIEW:
- Each player row: background rgba(255,255,255,0.05), border-bottom 1px solid rgba(255,255,255,0.08)
- Player name: font-family var(--font-body), color white
- Player score: font-family var(--font-mono), color var(--color-primary), text-align right
- Kick button: small, background transparent, color var(--color-accent-pink), border 1px solid var(--color-accent-pink), font-size 11px

Do not touch any WebSocket, player kick logic, or game state management.
```

---

---

# PHASE 12 — Micro-interactions & Final Polish

## 🎯 Goal
Add the final layer of polish: hover effects, transitions, loading states, empty states, and overall cohesion check.

## ⚠️ Safety Rules
- CSS only additions. No logic changes.
- Test on mobile, tablet, and desktop before finalizing.

## 📋 Prompt to give your UI developer / AI

```
You are doing FINAL POLISH on the quiz app UI after all components have been restyled.
This phase is CSS-only micro-interactions and consistency fixes.
No logic changes whatsoever.

TASKS:

1. BUTTON CONSISTENCY AUDIT:
   - Every button in the app must have: border var(--border-brutal), box-shadow var(--shadow-brutal)
   - Every button must have: hover → translate(-2px,-2px) + larger shadow
   - Every button must have: active → translate(4px,4px) + box-shadow none
   - Check all buttons have font-family var(--font-heading) or var(--font-display)

2. LOADING STATES:
   - Any loading spinner: replace with a blinking pixel-art style using CSS box-shadows
   - Loading text: font-family var(--font-display), font-size 12px, animation: pixel-flash 1s infinite
   - Skeleton loaders: background repeating-linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%), background-size 200% 100%, animation: shimmer 1.5s infinite

3. EMPTY STATES:
   - No results / empty leaderboard: font-family var(--font-heading), color var(--color-secondary), font-size 20px
   - Add a simple pixel-art dashed border box around empty state messages

4. SCROLLBAR STYLING (webkit):
   ::-webkit-scrollbar { width: 8px; }
   ::-webkit-scrollbar-track { background: var(--color-cream); border-left: 1px solid var(--color-black); }
   ::-webkit-scrollbar-thumb { background: var(--color-secondary); border: 2px solid var(--color-black); }

5. FOCUS STATES (accessibility):
   *:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 2px; }

6. PAGE TRANSITIONS:
   - On route change: add a class that does a quick fade (opacity 0 to 1, 150ms)

7. PIXEL DECORATIVE ACCENTS:
   - Add 4–6 small decorative pixel stars/sparkles using CSS ::before/::after on section headings
   - Use box-shadow stacking on small elements to create pixel-art style accents

8. MOBILE RESPONSIVE FINAL CHECK:
   - All grid-template-columns on mobile: 1 column
   - Font sizes: use clamp() for all display fonts
   - Touch targets: minimum 44px height for all interactive elements
   - Test that brutal shadows don't clip on small screens (reduce shadow from 6px to 3px on mobile)

9. COHESION CHECK — find and fix any elements that still look "default/unstyled":
   - Input fields: border var(--border-brutal), box-shadow var(--shadow-brutal), font-family var(--font-body)
   - Select dropdowns: same border/shadow rules
   - Modals/Dialogs: background var(--color-white), border: 4px solid var(--color-black), box-shadow: 8px 8px 0 var(--color-secondary)
   - Tooltips: background var(--color-black), color white, font-family var(--font-body), font-size 12px, padding 4px 10px, border-radius 3px

Do not change any functionality.
```

---

---

## ✅ POST-REDESIGN CHECKLIST

After all phases are complete, run through this checklist:

```
VISUAL
[ ] All buttons have brutal border + shadow + press effect
[ ] Color palette is consistent across all screens
[ ] Press Start 2P font used only for scores, numbers, big headings
[ ] Boogaloo used for questions, body headings, buttons
[ ] Nunito used for body text and answer options
[ ] Share Tech Mono used for timers and data values
[ ] No default browser styles leaking through (no blue outline links, no default selects)
[ ] Grid background texture visible on all page backgrounds

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
[ ] Mobile (375px): all screens usable ✓
[ ] Tablet (768px): layout correct ✓
[ ] Desktop (1280px+): layout correct ✓

PERFORMANCE
[ ] Google Fonts loaded (check Network tab) ✓
[ ] No layout shift from font loading (add font-display: swap to import) ✓
[ ] Animations don't cause jank (check FPS in DevTools) ✓
```

---

## 🚫 WHAT THIS GUIDE NEVER TOUCHES

```
❌ Backend routes / controllers / services
❌ Database schemas or queries
❌ API endpoints
❌ WebSocket / real-time connection logic
❌ Authentication / session logic
❌ Score calculation algorithms
❌ Timer countdown logic (only visuals)
❌ Player join / kick logic (only visuals)
❌ Any .env or configuration files
❌ Any test files
```

---

## 📎 REFERENCE IMAGES SUMMARY

| Image | Key Elements to Extract |
|-------|------------------------|
| Image 1 (Pixel Platformer) | Chunky pixel-art border panels, orange/yellow text with dark outline, heart-based health bars, pixel button style, green landscape background |
| Image 2 (NFT App) | Lime green background energy, clean white cards, bold black sans-serif headings, colorful pastel illustration accents, stat display layout |
| Image 3 (Gaming Page) | Electric yellow page background, deep purple content sections, white card containers, retro game controller icons, bold chunky typography mix |

**Combined direction = PixelBrute:**
Yellow + Violet + Pink + Green + Orange palette.
Thick black borders everywhere.
Offset box shadows (brutalist).
Pixel-art display font for scores and headings.
Rounded but bold body font for readability.
Grid background texture throughout.
Game-state feedback (correct/wrong) with full-color flash states.

---

*End of QUIZ_REDESIGN_PROMPT_GUIDE.md*
*This file is designed to be read by an AI assistant or human UI developer as a sequential redesign instruction set.*
