# Design Document: Proctor & Participant Theme Update

## Introduction

This design document specifies the technical implementation for updating proctor (host) and participant (player) interfaces to use the exact same design system as admin/superadmin. The goal is complete visual consistency across the entire IntelliQuiz application.

## Design Overview

### Architecture Decision

Create two dedicated CSS files (`proctor.css` and `participant.css`) that mirror the structure and styling of `superadmin.css`, using the same CSS variables from `variables.css`. All components will use identical styling patterns, colors, animations, and behaviors.

### Design System Reference (from superadmin.css)

| Element | Specification |
|---------|---------------|
| Font | Montserrat (300-800 weights) |
| Primary Color | #880015 (Maroon) |
| Accent Color | #f8c107 (Gold) |
| Background | linear-gradient(135deg, #f8f9fc 0%, #eef1f5 100%) |
| Card Border Radius | 20px |
| Button Border Radius | 12px |
| Input Border Radius | 14px |
| Card Shadow | 0 4px 20px rgba(0, 0, 0, 0.08) |
| Card Hover Shadow | 0 8px 30px rgba(0, 0, 0, 0.12) |
| Transition | 0.3s ease |


## Component Specifications

### 1. Page Header Component

```css
.proctor-page-header, .participant-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  padding: 24px 32px;
  background: linear-gradient(135deg, #880015 0%, #a50019 50%, #6b0012 100%);
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(136, 0, 21, 0.3);
  position: relative;
  overflow: hidden;
}

/* Decorative circles (::before and ::after pseudo-elements) */
/* Gold circle top-right, white circle bottom-left */
```

### 2. Card Component

```css
.proctor-card, .participant-card {
  background: #fff;
  border: none;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.proctor-card:hover, .participant-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}
```

### 3. Primary Button (Gold Gradient)

```css
.proctor-btn-primary, .participant-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  font-family: var(--font-family);
  font-size: 14px;
  font-weight: 700;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(145deg, #f8c107 0%, #ffd54f 50%, #f8c107 100%);
  color: #1a1a2e;
  box-shadow: 0 4px 15px rgba(248, 193, 7, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.proctor-btn-primary:hover, .participant-btn-primary:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 25px rgba(248, 193, 7, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3);
}
```


### 4. Secondary Button

```css
.proctor-btn-secondary, .participant-btn-secondary {
  background: linear-gradient(180deg, #fff 0%, #f8fafc 100%);
  color: #475569;
  border: 2px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.proctor-btn-secondary:hover, .participant-btn-secondary:hover {
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  border-color: #cbd5e1;
  transform: translateY(-1px);
}
```

### 5. Form Input

```css
.proctor-form-input, .participant-form-input {
  width: 100%;
  padding: 16px 20px;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  color: #1e293b;
  font-family: var(--font-family);
  font-size: 15px;
  font-weight: 500;
  transition: all 0.25s ease;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
}

.proctor-form-input:focus, .participant-form-input:focus {
  outline: none;
  border-color: #f8c107;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(248, 193, 7, 0.12), inset 0 2px 4px rgba(0, 0, 0, 0.02);
}
```

### 6. Form Label

```css
.proctor-form-label, .participant-form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.proctor-form-label::before, .participant-form-label::before {
  content: '';
  width: 3px;
  height: 14px;
  background: linear-gradient(180deg, #f8c107 0%, #ffd54f 100%);
  border-radius: 2px;
}
```


### 7. Badge Components

```css
.proctor-badge, .participant-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 50px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Badge variants - same as superadmin */
.proctor-badge-accent, .participant-badge-accent {
  background: linear-gradient(135deg, rgba(248, 193, 7, 0.2) 0%, rgba(248, 193, 7, 0.1) 100%);
  color: #b45309;
  border: 1px solid rgba(248, 193, 7, 0.3);
}

.proctor-badge-success, .participant-badge-success {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.proctor-badge-warning, .participant-badge-warning {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.proctor-badge-danger, .participant-badge-danger {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.1) 100%);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.proctor-badge-info, .participant-badge-info {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%);
  color: #2563eb;
  border: 1px solid rgba(59, 130, 246, 0.2);
}
```


### 8. Modal Component

```css
.proctor-modal-overlay, .participant-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 24px;
  animation: fadeIn 0.25s ease;
}

.proctor-modal-content, .participant-modal-content {
  background: #fff;
  border-radius: 28px;
  width: 100%;
  max-width: 440px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1), 0 25px 60px rgba(0, 0, 0, 0.35), 0 10px 30px rgba(136, 0, 21, 0.15);
  animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.proctor-modal-header, .participant-modal-header {
  padding: 32px 32px 28px;
  background: linear-gradient(145deg, #880015 0%, #a8001c 50%, #6d0011 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}

.proctor-modal-body, .participant-modal-body {
  padding: 32px 40px;
  overflow-y: auto;
  flex: 1;
  background: linear-gradient(180deg, #fff 0%, #fafbfc 100%);
}

.proctor-modal-footer, .participant-modal-footer {
  padding: 24px 32px;
  background: linear-gradient(180deg, #f8f9fc 0%, #f1f3f5 100%);
  display: flex;
  gap: 14px;
  justify-content: flex-end;
  border-top: 1px solid #e8eaed;
}
```


### 9. Alert Component

```css
.proctor-alert, .participant-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 16px;
  margin-bottom: 24px;
  animation: slideIn 0.3s ease;
}

.proctor-alert-error, .participant-alert-error {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 1px solid #fecaca;
  color: #dc2626;
}

.proctor-alert-success, .participant-alert-success {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border: 1px solid #a7f3d0;
  color: #059669;
}
```

### 10. Loading Spinner

```css
.proctor-loading-spinner, .participant-loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f4f6;
  border-top-color: #f8c107;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### 11. Data Card (for teams, stats)

```css
.proctor-data-card, .participant-data-card {
  background: #fff;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
  position: relative;
}

.proctor-data-card:hover, .participant-data-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  border-left-color: #f8c107;
}
```


### 12. Table Component (for scoreboard)

```css
.proctor-table-container, .participant-table-container {
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.proctor-table th, .participant-table th {
  background: linear-gradient(135deg, #f8f9fc 0%, #eef1f5 100%);
  padding: 16px 24px;
  text-align: left;
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-bottom: 2px solid #e5e7eb;
}

.proctor-table td, .participant-table td {
  padding: 20px 24px;
  font-size: 14px;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
}

.proctor-table tr:hover td, .participant-table tr:hover td {
  background: linear-gradient(90deg, rgba(248, 193, 7, 0.05) 0%, transparent 100%);
}
```

### 13. Stat Card (for timer, scores)

```css
.proctor-stat-card, .participant-stat-card {
  background: #fff;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.proctor-stat-card:hover, .participant-stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}

.proctor-stat-value, .participant-stat-value {
  font-size: 36px;
  font-weight: 800;
  color: #1f2937;
  line-height: 1;
}

.proctor-stat-label, .participant-stat-label {
  font-size: 13px;
  font-weight: 600;
  color: #9ca3af;
  margin-top: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```


## Animations

All animations match superadmin.css exactly:

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(40px) scale(0.92); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

## Responsive Breakpoints

Match superadmin.css responsive behavior:

```css
@media (max-width: 1200px) {
  .proctor-grid-4, .participant-grid-4 { grid-template-columns: repeat(2, 1fr); }
  .proctor-grid-3, .participant-grid-3 { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .proctor-grid-2, .proctor-grid-3, .proctor-grid-4,
  .participant-grid-2, .participant-grid-3, .participant-grid-4 { 
    grid-template-columns: 1fr; 
  }
  .proctor-page-header, .participant-page-header { 
    flex-direction: column; 
    gap: 16px; 
    text-align: center; 
  }
}
```


## Page-Specific Designs

### Proctor Login Page

- Light gradient background (#f8f9fc to #eef1f5)
- Centered card layout with max-width 440px
- Maroon gradient page header with "IntelliQuiz" title and "Proctor Portal" subtitle
- Gold accent decorative circle in header
- White card with 20px border-radius, 24px padding
- Form label with gold left border accent
- Input with gradient background, gold focus glow
- Gold gradient submit button
- Error alert with slideIn animation

### Participant Login Page

- Identical layout to Proctor Login
- Header subtitle: "Join the Quiz"
- Form label: "Team Code"
- Button text: "Join Quiz"

### Host Lobby Page

- Light gradient background
- Maroon gradient page header with quiz title, "Proctor Lobby" subtitle
- Proctor PIN displayed in badge-accent style
- Connection status using badge-success/warning/danger
- Team grid using data-card components
- Gold gradient "Start Quiz" button
- Secondary style "Leave Lobby" button
- Modal with maroon header for leave confirmation

### Player Lobby Page

- Light gradient background
- Maroon gradient page header with team name, quiz title
- Waiting spinner with gold accent
- Connection status badges
- Team count badge
- Card with waiting message

### Host Game Page

- Sticky header with maroon background (#880015)
- Question progress in header
- Timer as stat-card with gold accent
- Question in centered card
- Answer options as data-cards in 2-column grid
- Action buttons: btn-warning (End), btn-info (Reveal), btn-primary (Scoreboard), btn-success (Next)
- Submission stats as stat-cards

### Player Game Page

- Sticky header with maroon background
- Timer with gold color (normal) / red color (low time)
- Question in centered card
- Answer buttons: colorful (red, blue, yellow, green) with 16px border-radius
- Selected answer: 4px gold border, scale(1.05)
- Submit button: gold gradient
- Result feedback as stat-card with icon


### Scoreboard Pages (Host & Player)

- Light gradient background
- Maroon gradient page header with "Scoreboard" or "Final Results"
- Table container with 20px border-radius
- Table headers: uppercase, gradient background
- Table rows: hover with gold gradient
- Rank badges:
  - 1st: badge-accent (gold gradient) with trophy icon
  - 2nd: badge-gray (silver gradient #9ca3af to #d1d5db)
  - 3rd: badge with bronze gradient (#cd7f32 to #b87333)
- Current team highlight: 4px gold left border, light gold background
- Final results: confetti animation, larger title

## File Structure

```
frontend/intelliquiz-frontend/src/styles/
├── variables.css (existing - use for all colors)
├── admin.css (existing - reference)
├── superadmin.css (existing - primary reference)
├── proctor.css (NEW - create)
└── participant.css (NEW - create)
```

## CSS Class Naming Convention

Follow the pattern: `{role}-{component}-{modifier}`

Examples:
- `proctor-page-header`
- `proctor-card`
- `proctor-btn-primary`
- `proctor-form-input`
- `proctor-badge-success`
- `participant-page-header`
- `participant-card`
- `participant-btn-primary`
- `participant-alert-error`

## Implementation Notes

1. Import Montserrat font at top of both CSS files
2. Import variables.css and use CSS custom properties
3. Structure CSS sections with comment headers matching superadmin.css
4. All hover effects use 0.3s ease transition
5. All focus states use gold (#f8c107) with 4px glow
6. All cards use translateY(-2px) or translateY(-4px) on hover
7. Primary buttons use translateY(-2px) scale(1.02) on hover


## Correctness Properties

### Visual Consistency Properties

1. **Color Consistency**: All proctor/participant pages MUST use only colors from variables.css (maroon #880015, gold #f8c107, grays from palette)
2. **Typography Consistency**: All text MUST use Montserrat font family with weights 300-800
3. **Spacing Consistency**: All padding/margins MUST match superadmin values (24px card padding, 32px page header padding)
4. **Border Radius Consistency**: Cards=20px, Buttons=12px, Inputs=14px, Badges=50px, Modals=28px

### Animation Properties

1. **Transition Timing**: All interactive elements MUST use 0.2s-0.3s ease transitions
2. **Hover Effects**: Cards MUST translateY(-2px to -4px), buttons MUST translateY(-2px) scale(1.02)
3. **Modal Animation**: MUST use slideUp with cubic-bezier(0.16, 1, 0.3, 1)
4. **Alert Animation**: MUST use slideIn 0.3s ease

### Responsive Properties

1. **Breakpoint Consistency**: MUST use same breakpoints as superadmin (768px, 1200px)
2. **Mobile Layout**: Single column below 768px, stacked headers
3. **Touch Targets**: Buttons MUST have minimum 44px height on mobile

### Accessibility Properties

1. **Focus States**: All interactive elements MUST have visible focus indicators (gold border + glow)
2. **Color Contrast**: Text MUST meet WCAG AA contrast requirements
3. **Interactive Feedback**: All buttons/links MUST have hover/active states

## Testing Checklist

- [ ] Proctor Login matches admin/superadmin visual style
- [ ] Participant Login matches admin/superadmin visual style
- [ ] Host Lobby uses correct page header, cards, badges, buttons
- [ ] Player Lobby uses correct page header, cards, badges
- [ ] Host Game uses correct header, stat cards, data cards, buttons
- [ ] Player Game uses correct header, timer, answer buttons, feedback
- [ ] Host Scoreboard uses correct table styling, rank badges
- [ ] Player Scoreboard uses correct table styling, current team highlight
- [ ] All animations match superadmin timing and easing
- [ ] Responsive layouts work at all breakpoints
- [ ] Focus states visible on all interactive elements
