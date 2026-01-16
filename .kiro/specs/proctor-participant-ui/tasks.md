# Implementation Plan: Proctor and Participant UI

## Overview

This implementation plan covers the development of the proctor (host) and participant (team/player) user interfaces for IntelliQuiz. The implementation follows an incremental approach, starting with core infrastructure (API services, WebSocket hooks), then building login pages, lobby interfaces, game interfaces, and finally the scoreboard displays.

## Tasks

- [x] 1. Set up API services and types for access code resolution
  - [x] 1.1 Create access API service with resolveCode function
    - Add `accessApi` to `services/api.ts` with proper TypeScript types
    - Implement `AccessResolutionResponse`, `TeamResponse`, `QuizResponse` interfaces
    - _Requirements: 1.3, 1.4, 1.5, 1.6_

  - [x] 1.2 Create session storage utilities
    - Create `services/sessionStorage.ts` for proctor/participant session management
    - Implement `saveProctorSession`, `saveParticipantSession`, `getSession`, `clearSession` functions
    - _Requirements: 10.1, 10.4_

- [x] 2. Implement WebSocket connection infrastructure
  - [x] 2.1 Install and configure STOMP WebSocket client
    - Add `@stomp/stompjs` and `sockjs-client` dependencies
    - Create WebSocket configuration constants
    - _Requirements: 6.1_

  - [x] 2.2 Create useWebSocket custom hook
    - Implement connection management with auto-reconnect
    - Add subscription handlers for game state, timer, and host channels
    - Implement `sendCommand` and `submitAnswer` functions
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 2.3 Write property test for WebSocket state broadcast
    - **Property 10: WebSocket State Broadcast**
    - **Validates: Requirements 6.2**

- [x] 3. Implement proctor login page
  - [x] 3.1 Create ProctorLogin component
    - Build PIN input form with validation
    - Integrate with accessApi.resolveCode
    - Handle routing to host lobby on success
    - Display error messages on failure
    - _Requirements: 1.1, 1.3, 1.4, 1.6, 1.7_

  - [x] 3.2 Write property test for access code routing
    - **Property 1: Access Code Routing Consistency**
    - **Validates: Requirements 1.4, 1.5, 1.6**

- [x] 4. Implement participant login page
  - [x] 4.1 Create ParticipantLogin component
    - Build team code input form with validation
    - Integrate with accessApi.resolveCode
    - Handle routing to player lobby on success
    - Display error messages on failure
    - _Requirements: 1.2, 1.3, 1.5, 1.6, 1.7_

  - [x] 4.2 Write property test for form validation feedback
    - **Property 15: Form Validation Feedback**
    - **Validates: Requirements 8.7**

- [x] 5. Update universal login page and router
  - [x] 5.1 Update UniversalLogin with navigation to separate login pages
    - Add buttons for "Proctor Login" and "Participant Login"
    - Keep "Admin Login" button for admin/superadmin access
    - Style consistently with existing design
    - _Requirements: 1.1, 1.2_

  - [x] 5.2 Update router with new routes
    - Add `/proctor/login` route for ProctorLogin
    - Add `/participant/login` route for ParticipantLogin
    - Update existing `/host/*` and `/player/*` routes
    - _Requirements: 1.4, 1.5_

- [x] 6. Checkpoint - Verify login flow works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement proctor lobby interface
  - [x] 7.1 Create HostLobby component with WebSocket integration
    - Display quiz title and proctor PIN
    - Show connection status indicator
    - Integrate useWebSocket hook for real-time updates
    - _Requirements: 2.1, 2.2, 2.6_

  - [x] 7.2 Create TeamGrid component for connected teams display
    - Build responsive grid layout
    - Show team names with connection status
    - Handle real-time team connection/disconnection updates
    - _Requirements: 2.3, 2.7_

  - [x] 7.3 Add Start Quiz functionality
    - Implement "Start Quiz" button with disabled state
    - Send START_QUIZ command via WebSocket
    - Navigate to game interface on quiz start
    - _Requirements: 2.4, 2.5_

  - [x] 7.4 Write property test for team grid updates
    - **Property 2: Team Grid Real-Time Updates**
    - **Validates: Requirements 2.3, 2.7**

- [x] 8. Implement participant lobby interface
  - [x] 8.1 Create PlayerLobby component with WebSocket integration
    - Display team name and quiz title
    - Show connection status with animated indicator
    - Display "Waiting for host to start" message
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [x] 8.2 Add automatic navigation on quiz start
    - Listen for game state changes via WebSocket
    - Navigate to game interface when state changes to QUESTION
    - _Requirements: 3.4_

  - [x] 8.3 Write property test for game state navigation
    - **Property 3: Game State Transition Navigation**
    - **Validates: Requirements 3.4**

- [x] 9. Checkpoint - Verify lobby interfaces work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement shared game components
  - [x] 10.1 Create Timer component
    - Display countdown with seconds remaining
    - Show progress bar for large variant
    - Add visual warning when time is low (<=5s)
    - _Requirements: 4.2, 5.1_

  - [x] 10.2 Create QuestionDisplay component
    - Render question text prominently
    - Display answer options in grid layout
    - Support different option colors (red, blue, yellow, green)
    - _Requirements: 4.2, 5.1_

  - [x] 10.3 Write property test for question display completeness
    - **Property 4: Question Display Completeness**
    - **Validates: Requirements 4.2, 5.1**

- [x] 11. Implement proctor game control interface
  - [x] 11.1 Create HostGame component structure
    - Display question number and total questions
    - Show current question with options
    - Display timer countdown
    - _Requirements: 4.1, 4.2_

  - [x] 11.2 Implement game state control buttons
    - Add "Show Buffer" button for QUESTION state
    - Add "Reveal Answer" button for BUFFER state
    - Add "Show Scoreboard" button for ANSWER_REVEAL state
    - Add "Next Question" / "End Quiz" buttons for SCOREBOARD state
    - _Requirements: 4.3, 4.4, 4.5, 4.6_

  - [x] 11.3 Implement WebSocket command dispatch
    - Send appropriate commands on button clicks
    - Handle state transitions and navigation
    - _Requirements: 4.7, 4.8_

  - [x] 11.4 Write property test for proctor command dispatch
    - **Property 5: Proctor Command Dispatch**
    - **Validates: Requirements 4.7**

  - [x] 11.5 Add submission statistics display for BUFFER state
    - Show count of submissions received
    - Display team submission notifications
    - _Requirements: 4.4_

- [x] 12. Implement participant game interface
  - [x] 12.1 Create PlayerGame component structure
    - Display question number and timer
    - Render question text and options
    - _Requirements: 5.1_

  - [x] 12.2 Implement answer selection and highlighting
    - Handle option click to select answer
    - Highlight selected option with distinct styling
    - Disable selection after submission
    - _Requirements: 5.2_

  - [x] 12.3 Write property test for answer selection highlighting
    - **Property 6: Answer Selection Highlighting**
    - **Validates: Requirements 5.2**

  - [x] 12.4 Implement answer submission flow
    - Add "Submit Answer" button
    - Send submission via WebSocket
    - Disable further submissions after submit
    - Display confirmation message
    - _Requirements: 5.3, 5.4_

  - [x] 12.5 Write property test for answer submission flow
    - **Property 7: Answer Submission Flow**
    - **Validates: Requirements 5.3, 5.4**

  - [x] 12.6 Implement timer expiration handling
    - Block submissions when timer reaches 0
    - Auto-transition to waiting state
    - _Requirements: 5.5_

  - [x] 12.7 Write property test for timer expiration block
    - **Property 8: Timer Expiration Submission Block**
    - **Validates: Requirements 5.5**

  - [x] 12.8 Implement BUFFER and ANSWER_REVEAL state displays
    - Show "Waiting for results" in BUFFER state
    - Display correct answer and result in ANSWER_REVEAL state
    - _Requirements: 5.6, 5.7_

- [x] 13. Checkpoint - Verify game interfaces work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Implement scoreboard components
  - [x] 14.1 Create ScoreboardDisplay component
    - Display teams ranked by score (descending)
    - Show rank, team name, and score for each team
    - Highlight current team (for participants)
    - _Requirements: 7.1, 7.2, 5.8_

  - [x] 14.2 Add special styling for top 3 teams
    - Gold styling for 1st place
    - Silver styling for 2nd place
    - Bronze styling for 3rd place
    - _Requirements: 7.3_

  - [x] 14.3 Implement tied score handling
    - Teams with equal scores share the same rank
    - Display tied teams with equal rank numbers
    - _Requirements: 7.4_

  - [x] 14.4 Write property test for scoreboard ranking
    - **Property 9: Scoreboard Ranking Correctness**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

  - [x] 14.5 Create HostScoreboard page
    - Display scoreboard with proctor controls
    - Add "Next Question" or "End Quiz" button
    - Show question number or "Final Results" label
    - _Requirements: 4.6, 7.6_

  - [x] 14.6 Create PlayerScoreboard page
    - Display scoreboard with team highlighting
    - Show waiting message for next action
    - _Requirements: 5.8, 7.6_

- [x] 15. Implement error handling and loading states
  - [x] 15.1 Create ErrorDisplay component
    - Display user-friendly error messages
    - Provide retry button for recoverable errors
    - Add "Return to Home" link
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 15.2 Create LoadingSpinner component
    - Display loading indicator during API calls
    - Show connection status during WebSocket setup
    - _Requirements: 8.1_

  - [x] 15.3 Add error handling to all API calls
    - Wrap API calls with try-catch
    - Display appropriate error messages
    - _Requirements: 1.7, 8.2_

  - [x] 15.4 Write property test for API loading state
    - **Property 13: API Loading State**
    - **Validates: Requirements 8.1, 8.2**

- [x] 16. Implement session management
  - [x] 16.1 Add session restoration on page refresh
    - Check sessionStorage for existing session
    - Restore session and reconnect WebSocket
    - Navigate to appropriate page based on game state
    - _Requirements: 10.2_

  - [x] 16.2 Write property test for session persistence
    - **Property 12: Session Persistence**
    - **Validates: Requirements 10.1, 10.2**

  - [x] 16.3 Add session cleanup on disconnect
    - Clear sessionStorage on manual disconnect
    - Close WebSocket connection
    - Navigate to login page
    - _Requirements: 10.4_

  - [x] 16.4 Write property test for session cleanup
    - **Property 14: Session Cleanup on Disconnect**
    - **Validates: Requirements 10.4**

  - [x] 16.5 Add navigation controls
    - Add "Return to Login" button on final results
    - Add confirmation dialog for proctor leaving lobby
    - _Requirements: 10.3, 10.6_

- [x] 17. Checkpoint - Verify complete flow works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. Final integration and polish
  - [x] 18.1 Add responsive styling for mobile devices
    - Ensure single-column layout on mobile
    - Optimize touch targets for buttons
    - _Requirements: 9.1, 9.5_

  - [x] 18.2 Add responsive styling for tablets and desktop
    - Optimize grid layouts for larger screens
    - Adjust spacing and font sizes
    - _Requirements: 9.2, 9.3, 9.4_

  - [x] 18.3 Wire all components together
    - Verify navigation flow between all pages
    - Test complete proctor and participant journeys
    - Ensure consistent styling throughout
    - _Requirements: 10.5_

- [x] 19. Final checkpoint - Complete system verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for complete implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- WebSocket integration requires backend to be running for full testing
