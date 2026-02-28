# Implementation Tasks

## Task 1: Create proctor.css stylesheet

- [x] Create `frontend/intelliquiz-frontend/src/styles/proctor.css`
- [x] Add Montserrat font import
- [x] Add CSS variables section referencing variables.css
- [x] Add page-header styles (maroon gradient, decorative circles)
- [x] Add card styles (20px radius, shadow, hover effects)
- [x] Add button styles (primary gold gradient, secondary, danger, warning, success, info)
- [x] Add form styles (input, label with gold accent, focus states)
- [x] Add badge styles (accent, success, warning, danger, info, gray)
- [x] Add modal styles (overlay blur, content with maroon header, slideUp animation)
- [x] Add alert styles (error, success with slideIn animation)
- [x] Add loading spinner styles (gold accent, 0.8s spin)
- [x] Add data-card styles (hover with gold left border)
- [x] Add stat-card styles (for timer, stats display)
- [x] Add table styles (for scoreboard)
- [x] Add grid layout styles (2, 3, 4 columns)
- [x] Add all keyframe animations (fadeIn, slideUp, slideIn, spin)
- [x] Add responsive breakpoints (768px, 1200px)


## Task 2: Create participant.css stylesheet

- [x] Create `frontend/intelliquiz-frontend/src/styles/participant.css`
- [x] Add Montserrat font import
- [x] Add CSS variables section referencing variables.css
- [x] Add page-header styles (identical to proctor)
- [x] Add card styles (identical to proctor)
- [x] Add button styles (identical to proctor)
- [x] Add form styles (identical to proctor)
- [x] Add badge styles (identical to proctor)
- [x] Add modal styles (identical to proctor)
- [x] Add alert styles (identical to proctor)
- [x] Add loading spinner styles (identical to proctor)
- [x] Add data-card styles (identical to proctor)
- [x] Add stat-card styles (identical to proctor)
- [x] Add table styles (identical to proctor)
- [x] Add answer button styles (colorful: red, blue, yellow, green with selection state)
- [x] Add grid layout styles
- [x] Add all keyframe animations
- [x] Add responsive breakpoints

## Task 3: Update ProctorLogin.tsx

- [x] Import proctor.css
- [x] Replace dark theme classes with light gradient background
- [x] Add proctor-page-header with maroon gradient, decorative circles
- [x] Update login card to use proctor-card class
- [x] Update form labels to use proctor-form-label with gold accent
- [x] Update inputs to use proctor-form-input with focus glow
- [x] Update submit button to use proctor-btn-primary (gold gradient)
- [x] Update error display to use proctor-alert-error with slideIn
- [x] Update loading spinner to use proctor-loading-spinner
- [x] Update back link styling


## Task 4: Update ParticipantLogin.tsx

- [x] Import participant.css
- [x] Replace dark theme classes with light gradient background
- [x] Add participant-page-header with maroon gradient, decorative circles
- [x] Update login card to use participant-card class
- [x] Update form labels to use participant-form-label with gold accent
- [x] Update inputs to use participant-form-input with focus glow
- [x] Update submit button to use participant-btn-primary (gold gradient)
- [x] Update error display to use participant-alert-error with slideIn
- [x] Update loading spinner to use participant-loading-spinner
- [x] Update back link styling

## Task 5: Update HostLobby.tsx

- [x] Import proctor.css
- [x] Replace dark background with light gradient
- [x] Add proctor-page-header with quiz title, subtitle, decorative elements
- [x] Display proctor PIN using proctor-badge-accent
- [x] Update connection status to use proctor-badge-success/warning/danger
- [x] Update team count badge to use proctor-badge-accent
- [x] Update Start Quiz button to use proctor-btn-primary
- [x] Update Leave button to use proctor-btn-secondary
- [x] Update leave confirmation modal to use proctor-modal-* classes
- [x] Update error display to use proctor-alert-error

## Task 6: Update PlayerLobby.tsx

- [x] Import participant.css
- [x] Replace dark background with light gradient
- [x] Add participant-page-header with team name, quiz title
- [x] Update waiting spinner to use participant-loading-spinner
- [x] Update connection status to use participant-badge-* classes
- [x] Update team count to use participant-badge-info
- [x] Update waiting message card to use participant-card


## Task 7: Update HostGame.tsx

- [x] Import proctor.css
- [x] Replace dark background with light gradient
- [x] Add sticky header with maroon background (#880015)
- [x] Update timer display to use proctor-stat-card with gold accent
- [x] Update question display to use proctor-card
- [x] Update answer options to use proctor-data-card in grid
- [x] Update End Question button to use proctor-btn-warning
- [x] Update Reveal Answer button to use proctor-btn-info
- [x] Update Show Scoreboard button to use proctor-btn-primary
- [x] Update Next Question button to use proctor-btn-success
- [x] Update submission stats to use proctor-stat-card

## Task 8: Update PlayerGame.tsx

- [x] Import participant.css
- [x] Replace dark background with light gradient
- [x] Add sticky header with maroon background (#880015)
- [x] Update timer to use gold color (normal) / red color (low time)
- [x] Update question display to use participant-card
- [x] Update answer buttons with colorful styles (red, blue, yellow, green)
- [x] Add selected state with gold border and scale effect
- [x] Update submit button to use participant-btn-primary
- [x] Update submitted state to use participant-alert-success
- [x] Update waiting state with participant-loading-spinner
- [x] Update result feedback to use participant-stat-card

## Task 9: Update HostScoreboard.tsx

- [x] Import proctor.css
- [x] Replace dark background with light gradient
- [x] Add proctor-page-header with "Scoreboard" or "Final Results"
- [x] Update table to use proctor-table-container and proctor-table
- [x] Add rank badges (gold 1st, silver 2nd, bronze 3rd)
- [x] Add final results styling with larger title


## Task 10: Update PlayerScoreboard.tsx

- [x] Import participant.css
- [x] Replace dark background with light gradient
- [x] Add participant-page-header with "Scoreboard" or "Final Results"
- [x] Update table to use participant-table-container and participant-table
- [x] Add rank badges (gold 1st, silver 2nd, bronze 3rd)
- [x] Add current team highlight with gold left border
- [x] Add final results styling with larger title

## Task 11: Update shared game components

- [x] Update Timer.tsx to use proctor/participant stat-card styling
- [x] Update TeamGrid.tsx to use proctor-data-card styling
- [x] Update QuestionDisplay.tsx to use proctor/participant card styling
- [x] Update ScoreboardDisplay.tsx to use proctor/participant table styling

## Task 12: Testing and validation

- [x] Verify ProctorLogin matches admin/superadmin visual style
- [x] Verify ParticipantLogin matches admin/superadmin visual style
- [x] Verify HostLobby uses correct styling
- [x] Verify PlayerLobby uses correct styling
- [x] Verify HostGame uses correct styling
- [x] Verify PlayerGame uses correct styling
- [x] Verify HostScoreboard uses correct styling
- [x] Verify PlayerScoreboard uses correct styling
- [x] Test all animations work correctly
- [x] Test responsive layouts at 768px and 1200px breakpoints
- [x] Test focus states on all interactive elements
- [x] Verify color consistency across all pages
