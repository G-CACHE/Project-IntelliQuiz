# Requirements Document

## Introduction

This document specifies the requirements for updating the UI/UX of the proctor (host) and participant (player) interfaces to be fully aligned with the established theme, color palette, styling patterns, behaviors, and animations used in the superadmin and admin sections of IntelliQuiz. The proctor and participant interfaces will use the EXACT same design system, ensuring complete visual consistency across the entire application.

## Glossary

- **Proctor_Interface**: The host-facing UI including login, lobby, game control, and scoreboard pages
- **Participant_Interface**: The player-facing UI including login, lobby, game play, and scoreboard pages
- **Design_System**: The established visual design system from admin/superadmin including:
  - Primary Color: Maroon (#880015)
  - Accent Color: Gold (#f8c107)
  - Background: Light gray gradient (#f8f9fc to #eef1f5)
  - Font: Montserrat (300-800 weights)
  - Border Radius: 12px-20px for cards, 12px for buttons, 14px for inputs
  - Shadows: Layered shadows with hover effects
  - Animations: fadeIn, slideUp, slideIn, spin (0.8s linear)
- **Card_Component**: White background, 20px border-radius, 24px padding, 0 4px 20px shadow, hover transform translateY(-2px)
- **Page_Header**: Maroon gradient (135deg, #880015 to #a50019 to #6b0012), 20px border-radius, decorative circles, 0 10px 40px shadow
- **Button_Primary**: Gold gradient (145deg, #f8c107 to #ffd54f), 12px border-radius, 0 4px 15px shadow, hover translateY(-2px) scale(1.02)
- **Button_Secondary**: White gradient, 2px border #e2e8f0, hover translateY(-1px)
- **Form_Input**: 16px 20px padding, 14px border-radius, 2px border #e2e8f0, gradient background, focus border #f8c107 with 4px glow
- **Badge_Component**: 50px border-radius, 6px 14px padding, gradient backgrounds, 1px border
- **Modal_Component**: 28px border-radius, maroon gradient header, backdrop blur 12px, slideUp animation
- **Alert_Component**: 16px border-radius, gradient backgrounds, slideIn animation

## Requirements

### Requirement 1: Global Design System Alignment

**User Story:** As a user, I want all proctor and participant pages to use the exact same design system as admin/superadmin, so that the application feels cohesive and professional.

#### Acceptance Criteria

1. THE System SHALL use the Montserrat font family (weights 300-800) for all proctor and participant pages
2. THE System SHALL use the light gradient background (linear-gradient 135deg, #f8f9fc to #eef1f5) for all pages
3. THE System SHALL use the maroon (#880015) and gold (#f8c107) color palette consistently
4. THE System SHALL use the same border-radius values: 20px for cards, 12px for buttons, 14px for inputs, 50px for badges
5. THE System SHALL use the same shadow system: 0 4px 20px rgba(0,0,0,0.08) for cards, 0 4px 15px for buttons
6. THE System SHALL use the same transition timing: 0.2s-0.3s ease for all interactive elements
7. THE System SHALL use the same hover effects: translateY(-2px) for cards, translateY(-2px) scale(1.02) for primary buttons

### Requirement 2: Proctor Login Page Theme Update

**User Story:** As a proctor, I want the login page to match the professional look of the admin interface exactly, so that I have a consistent experience.

#### Acceptance Criteria

1. WHEN a proctor navigates to the login page, THE System SHALL display the light gradient background (#f8f9fc to #eef1f5)
2. WHEN displaying the page header, THE System SHALL use the maroon gradient page-header component with decorative circles and gold accent
3. WHEN displaying the login form, THE System SHALL use a white card with 20px border-radius, 24px padding, and 0 4px 20px shadow
4. WHEN displaying form labels, THE System SHALL use uppercase text, 13px font-size, 600 weight, #475569 color, with gold left border accent
5. WHEN displaying form inputs, THE System SHALL use 16px 20px padding, 14px border-radius, gradient background, 2px border #e2e8f0
6. WHEN an input receives focus, THE System SHALL show #f8c107 border color with 0 0 0 4px rgba(248,193,7,0.12) glow
7. WHEN displaying the submit button, THE System SHALL use the gold gradient (145deg, #f8c107 to #ffd54f), 12px border-radius, 0 4px 15px shadow
8. WHEN hovering the submit button, THE System SHALL apply translateY(-2px) scale(1.02) transform and increased shadow
9. WHEN displaying error messages, THE System SHALL use the alert-error component with gradient background (#fef2f2 to #fee2e2), 1px border #fecaca, slideIn animation
10. WHEN loading, THE System SHALL display a spinner with 4px border, #f8c107 top border color, 0.8s linear spin animation

### Requirement 3: Participant Login Page Theme Update

**User Story:** As a participant, I want the login page to match the admin interface design exactly, so that I feel confident joining the quiz.

#### Acceptance Criteria

1. WHEN a participant navigates to the login page, THE System SHALL display the light gradient background (#f8f9fc to #eef1f5)
2. WHEN displaying the page header, THE System SHALL use the maroon gradient page-header component identical to proctor login
3. WHEN displaying the login form, THE System SHALL use a white card with 20px border-radius, 24px padding, and 0 4px 20px shadow
4. WHEN displaying form labels, THE System SHALL use uppercase text, 13px font-size, 600 weight, #475569 color, with gold left border accent
5. WHEN displaying form inputs, THE System SHALL use 16px 20px padding, 14px border-radius, gradient background, 2px border #e2e8f0
6. WHEN an input receives focus, THE System SHALL show #f8c107 border color with 0 0 0 4px rgba(248,193,7,0.12) glow
7. WHEN displaying the submit button, THE System SHALL use the gold gradient button style identical to proctor login
8. WHEN hovering the submit button, THE System SHALL apply translateY(-2px) scale(1.02) transform and increased shadow
9. WHEN displaying error messages, THE System SHALL use the alert-error component identical to proctor login
10. WHEN loading, THE System SHALL display a spinner identical to proctor login

### Requirement 4: Proctor Lobby Theme Update

**User Story:** As a proctor, I want the lobby interface to match the admin dashboard style exactly, so that I have a professional hosting experience.

#### Acceptance Criteria

1. WHEN a proctor enters the lobby, THE System SHALL display the light gradient background
2. WHEN displaying the lobby header, THE System SHALL use the maroon gradient page-header with quiz title, subtitle, and proctor PIN badge
3. WHEN displaying the proctor PIN, THE System SHALL use a badge component with gold gradient background
4. WHEN displaying connected teams, THE System SHALL use data-card components with 20px border-radius, 4px left border on hover, translateY(-4px) hover effect
5. WHEN displaying the connection status, THE System SHALL use badge-success (green) for connected, badge-warning (yellow) for connecting, badge-danger (red) for disconnected
6. WHEN displaying the team count, THE System SHALL use a badge-accent component with gold gradient
7. WHEN displaying the Start Quiz button, THE System SHALL use the btn-primary gold gradient style with 0 4px 15px shadow
8. WHEN displaying the Leave button, THE System SHALL use the btn-secondary style with white gradient and 2px border
9. WHEN displaying the leave confirmation modal, THE System SHALL use the modal-overlay with backdrop blur 12px, modal-content with 28px border-radius, maroon gradient header, slideUp animation
10. WHEN teams connect/disconnect, THE System SHALL animate with fadeIn/fadeOut 0.3s ease

### Requirement 5: Participant Lobby Theme Update

**User Story:** As a participant, I want the waiting lobby to match the admin design exactly while clearly showing my team status.

#### Acceptance Criteria

1. WHEN a participant enters the lobby, THE System SHALL display the light gradient background
2. WHEN displaying the page header, THE System SHALL use the maroon gradient page-header with team name and quiz title
3. WHEN displaying the team name, THE System SHALL use 28px font-size, 800 weight, #1f2937 color in a card component
4. WHEN displaying the waiting animation, THE System SHALL use a spinner with 4px border, #f8c107 top border, 0.8s linear spin
5. WHEN displaying connection status, THE System SHALL use badge components identical to proctor lobby
6. WHEN displaying team count, THE System SHALL use a badge-info component with blue gradient
7. WHEN displaying the waiting message, THE System SHALL use a card component with centered text, #6b7280 color
8. WHEN the quiz starts, THE System SHALL transition with fadeOut animation before navigation

### Requirement 6: Proctor Game Control Theme Update

**User Story:** As a proctor, I want the game control interface to match the admin design patterns exactly for a professional experience.

#### Acceptance Criteria

1. WHEN displaying the game interface, THE System SHALL use the light gradient background
2. WHEN displaying the header, THE System SHALL use a sticky header with maroon background (#880015), white text, 64px height
3. WHEN displaying question progress, THE System SHALL use text with #9ca3af color for secondary info, #fff for primary
4. WHEN displaying the timer, THE System SHALL use a stat-card style component with gold accent
5. WHEN displaying questions, THE System SHALL use a card component with 20px border-radius, 24px padding
6. WHEN displaying answer options, THE System SHALL use data-card components in a 2-column grid with hover effects
7. WHEN displaying the "End Question" button, THE System SHALL use btn-warning style (orange gradient)
8. WHEN displaying the "Reveal Answer" button, THE System SHALL use btn-info style (blue gradient)
9. WHEN displaying the "Show Scoreboard" button, THE System SHALL use btn-primary style (gold gradient)
10. WHEN displaying the "Next Question" button, THE System SHALL use btn-success style (green gradient)
11. WHEN displaying submission statistics, THE System SHALL use stat-card components with icon, value (36px 800 weight), and label
12. WHEN displaying recent submissions, THE System SHALL use a table with admin table styling

### Requirement 7: Participant Game Interface Theme Update

**User Story:** As a participant, I want the game interface to match the admin design exactly while being engaging and easy to use.

#### Acceptance Criteria

1. WHEN displaying the game interface, THE System SHALL use the light gradient background
2. WHEN displaying the header, THE System SHALL use a sticky header with maroon background (#880015), white text, 64px height
3. WHEN displaying the timer, THE System SHALL use a prominent display with gold (#f8c107) color when time is adequate, red (#ef4444) when low
4. WHEN displaying questions, THE System SHALL use a card component with 20px border-radius, centered text, 18px font-size
5. WHEN displaying answer options, THE System SHALL use colorful buttons (red #ef4444, blue #3b82f6, yellow #f59e0b, green #22c55e) with 16px border-radius, hover scale(1.02)
6. WHEN an option is selected, THE System SHALL show a 4px gold border and scale(1.05) transform
7. WHEN displaying the submit button, THE System SHALL use btn-primary gold gradient style
8. WHEN an answer is submitted, THE System SHALL show an alert-success component with green gradient and checkmark icon
9. WHEN displaying the waiting state, THE System SHALL use a card with centered spinner and #6b7280 text
10. WHEN revealing the correct answer, THE System SHALL highlight correct option with green gradient, incorrect with red gradient
11. WHEN displaying result feedback, THE System SHALL use stat-card style with large icon, result text, and points earned

### Requirement 8: Scoreboard Theme Update

**User Story:** As a proctor or participant, I want the scoreboard to match the admin table design exactly while being visually impressive.

#### Acceptance Criteria

1. WHEN displaying the scoreboard, THE System SHALL use the light gradient background
2. WHEN displaying the header, THE System SHALL use the maroon gradient page-header with "Scoreboard" or "Final Results" title
3. WHEN displaying rankings, THE System SHALL use the admin table-container with 20px border-radius
4. WHEN displaying table headers, THE System SHALL use uppercase text, 12px font-size, 700 weight, #6b7280 color, gradient background
5. WHEN displaying table rows, THE System SHALL use 20px 24px padding, 14px font-size, #374151 color, 1px border bottom
6. WHEN hovering table rows, THE System SHALL show gradient background (90deg, rgba(248,193,7,0.05) to transparent)
7. WHEN highlighting 1st place, THE System SHALL use badge-accent with gold gradient and trophy icon
8. WHEN highlighting 2nd place, THE System SHALL use badge-gray with silver gradient (#9ca3af to #d1d5db)
9. WHEN highlighting 3rd place, THE System SHALL use badge with bronze gradient (#cd7f32 to #b87333)
10. WHEN highlighting current team (participant view), THE System SHALL use a 4px gold left border and light gold background
11. WHEN displaying final results, THE System SHALL show confetti animation and celebratory header with larger title

### Requirement 9: Shared Component Styling

**User Story:** As a developer, I want shared components to use the exact same styling as admin/superadmin components.

#### Acceptance Criteria

1. WHEN displaying the Timer component, THE System SHALL use stat-card styling with gold accent, 36px font-size for time, progress bar with gold fill
2. WHEN displaying the TeamGrid component, THE System SHALL use a responsive grid (repeat(auto-fill, minmax(280px, 1fr))), data-card styling for each team
3. WHEN displaying the QuestionDisplay component, THE System SHALL use card styling with 20px border-radius, 24px padding, centered question text
4. WHEN displaying the ScoreboardDisplay component, THE System SHALL use table-container styling identical to admin tables
5. WHEN displaying error states, THE System SHALL use alert-error component with slideIn animation
6. WHEN displaying loading states, THE System SHALL use loading-spinner (50px, 4px border, #f8c107 top, 0.8s spin)
7. WHEN displaying empty states, THE System SHALL use empty-state component with 80px icon, 18px title, 14px description

### Requirement 10: Animations and Transitions

**User Story:** As a user, I want all animations and transitions to match the admin/superadmin behavior exactly.

#### Acceptance Criteria

1. THE System SHALL use fadeIn animation (0.25s ease) for page loads and modal overlays
2. THE System SHALL use slideUp animation (0.35s cubic-bezier(0.16, 1, 0.3, 1)) for modals and cards appearing
3. THE System SHALL use slideIn animation (0.3s ease) for alerts and notifications
4. THE System SHALL use spin animation (0.8s linear infinite) for loading spinners
5. THE System SHALL use translateY(-2px) on hover for cards with 0.3s ease transition
6. THE System SHALL use translateY(-2px) scale(1.02) on hover for primary buttons with 0.3s ease transition
7. THE System SHALL use translateX(4px) on hover for quick-action style components
8. THE System SHALL use 0.2s ease transitions for all color and border changes
9. WHEN elements appear, THE System SHALL use opacity 0 to 1 with transform translateY(20px) to translateY(0)
10. WHEN elements disappear, THE System SHALL use opacity 1 to 0 with 0.2s ease transition

### Requirement 11: Responsive Design Consistency

**User Story:** As a user on any device, I want the proctor and participant interfaces to be responsive exactly like admin/superadmin.

#### Acceptance Criteria

1. WHEN viewport width is less than 768px, THE System SHALL display single-column layouts
2. WHEN viewport width is less than 768px, THE System SHALL stack page-header content vertically with center alignment
3. WHEN viewport width is between 768px and 1200px, THE System SHALL display 2-column grids
4. WHEN viewport width is greater than 1200px, THE System SHALL display up to 4-column grids
5. WHEN displaying buttons on mobile, THE System SHALL ensure minimum 44px touch target height
6. WHEN displaying modals on mobile, THE System SHALL use full-width with 24px padding
7. WHEN displaying tables on mobile, THE System SHALL use horizontal scroll with sticky first column
8. THE System SHALL use max-width 1400px with auto margins for content containers

### Requirement 12: CSS Architecture

**User Story:** As a developer, I want the proctor and participant styles to be organized consistently with admin/superadmin.

#### Acceptance Criteria

1. THE System SHALL create a dedicated `proctor.css` file following the same structure as admin.css
2. THE System SHALL create a dedicated `participant.css` file following the same structure as admin.css
3. THE System SHALL import and use CSS variables from `variables.css` for all colors
4. THE System SHALL use the same CSS class naming convention: `{role}-{component}-{modifier}` (e.g., proctor-card, proctor-btn-primary)
5. THE System SHALL organize CSS sections with comment headers matching admin.css structure
6. THE System SHALL define animations using @keyframes with the same names as admin/superadmin

