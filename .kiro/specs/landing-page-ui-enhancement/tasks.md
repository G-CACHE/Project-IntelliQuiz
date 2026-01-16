# Implementation Plan: Landing Page UI Enhancement

## Overview

This plan implements the enhanced landing page UI by creating a new CSS file following the established design system patterns and updating the UniversalLogin component to use the new styling.

## Tasks

- [x] 1. Create landing page CSS file
  - [x] 1.1 Create `landing.css` with base styles and page layout
    - Create file at `frontend/intelliquiz-frontend/src/styles/landing.css`
    - Add page container styles with gradient background matching participant/proctor pages
    - Add hero section styles with maroon gradient header and decorative elements
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2_
  - [x] 1.2 Add login card styles with variants
    - Add base card styles (white background, rounded corners, shadows)
    - Add primary variant (gold accent) for participant card
    - Add secondary variant (maroon accent) for proctor card
    - Add tertiary variant (muted gray) for admin card
    - Add hover and active state transitions
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 1.3 Add animation keyframes and responsive styles
    - Add fadeIn and slideUp keyframe animations
    - Add staggered animation delays for cards
    - Add responsive breakpoints for mobile layout
    - Add footer styles
    - _Requirements: 2.4, 4.1, 4.2, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2_

- [x] 2. Update UniversalLogin component
  - [x] 2.1 Refactor component structure with new CSS classes
    - Import the new landing.css file
    - Update JSX structure to use landing-* class names
    - Add hero section with decorative elements
    - Update login cards with proper variant classes
    - Update footer with 2026 copyright
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.3, 3.6, 6.1, 6.3_

- [x] 3. Checkpoint - Visual verification
  - Ensure the landing page renders correctly
  - Verify visual consistency with participant/proctor pages
  - Test responsive behavior on different screen sizes

- [x] 4. Write unit tests for UniversalLogin
  - [x] 4.1 Write tests for component rendering and navigation
    - Test that component renders without errors
    - Test that all three login options are displayed
    - Test that each card contains icon and description
    - Test navigation triggers on card click
    - Test footer displays correct copyright year
    - _Requirements: 3.6, 6.3_

- [x] 5. Final checkpoint
  - Ensure all tests pass
  - Ask the user if questions arise

## Notes

- All tasks are required for comprehensive implementation
- The CSS follows the same patterns as `participant.css` and `proctor.css` for consistency
- Visual testing should be done manually to verify animations and hover effects
