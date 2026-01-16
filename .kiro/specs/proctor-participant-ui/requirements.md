# Requirements Document

## Introduction

This document specifies the requirements for implementing the proctor (host) and participant (team/player) user interfaces for the IntelliQuiz system. The feature provides separate login flows, lobby experiences, real-time gameplay, and scoreboard displays for both proctors and participants, fully integrated with the existing backend API and WebSocket infrastructure.

## Glossary

- **Proctor**: A quiz host who controls the game flow using a proctor PIN
- **Participant**: A team member who joins a quiz session using a team code
- **Access_Code**: Either a team code or proctor PIN used for authentication
- **Team_Code**: A unique code assigned to a team for joining a quiz session
- **Proctor_PIN**: A unique PIN assigned to a quiz for proctor access
- **Quiz_Session**: An active quiz game instance with connected participants and a proctor
- **Game_State**: The current state of the quiz (LOBBY, QUESTION, BUFFER, ANSWER_REVEAL, SCOREBOARD, FINAL_RESULTS)
- **WebSocket_Connection**: Real-time bidirectional communication channel between client and server
- **Access_Resolution_Service**: Backend service that validates and routes access codes

## Requirements

### Requirement 1: Access Code Login System

**User Story:** As a proctor or participant, I want to enter an access code on a dedicated login page, so that I can join the appropriate quiz session with the correct role.

#### Acceptance Criteria

1. WHEN a user navigates to the proctor login page, THE System SHALL display an input field for entering a proctor PIN
2. WHEN a user navigates to the participant login page, THE System SHALL display an input field for entering a team code
3. WHEN a user submits an access code, THE System SHALL call the `/api/access/resolve` endpoint to validate the code
4. WHEN the access code is a valid proctor PIN, THE System SHALL route the user to the host lobby with quiz information
5. WHEN the access code is a valid team code, THE System SHALL route the user to the player lobby with team information
6. WHEN the access code is invalid, THE System SHALL display an error message and allow retry
7. WHEN the API request fails, THE System SHALL display an appropriate error message

### Requirement 2: Proctor Lobby Interface

**User Story:** As a proctor, I want to see a lobby interface showing connected teams and game controls, so that I can monitor participation and start the quiz when ready.

#### Acceptance Criteria

1. WHEN a proctor enters the lobby, THE System SHALL establish a WebSocket connection to `/ws/quiz/{quizId}`
2. WHEN the WebSocket connection is established, THE System SHALL display the quiz title and proctor PIN
3. WHEN teams connect to the session, THE System SHALL display a real-time grid of connected teams with their names
4. WHEN the proctor is ready to start, THE System SHALL provide a "Start Quiz" button
5. WHEN the proctor clicks "Start Quiz", THE System SHALL send a START_QUIZ command via WebSocket
6. WHEN the WebSocket connection fails, THE System SHALL display an error and provide reconnection options
7. WHEN teams disconnect, THE System SHALL update the team grid in real-time

### Requirement 3: Participant Lobby Interface

**User Story:** As a participant, I want to see a waiting lobby that confirms my team's connection, so that I know I'm ready to play when the proctor starts the quiz.

#### Acceptance Criteria

1. WHEN a participant enters the lobby, THE System SHALL establish a WebSocket connection to `/ws/quiz/{quizId}`
2. WHEN the WebSocket connection is established, THE System SHALL display the team name and quiz title
3. WHEN the participant is waiting, THE System SHALL display a "Waiting for host to start" message
4. WHEN the proctor starts the quiz, THE System SHALL automatically transition to the game interface
5. WHEN the WebSocket connection fails, THE System SHALL display an error message
6. WHEN other teams join, THE System SHALL optionally display a count of connected teams

### Requirement 4: Proctor Game Control Interface

**User Story:** As a proctor, I want to control the quiz flow with buttons for each game phase, so that I can manage the quiz progression and timing.

#### Acceptance Criteria

1. WHEN the quiz starts, THE System SHALL display the current question number and total questions
2. WHEN in QUESTION state, THE System SHALL display the question text, options, and a countdown timer
3. WHEN in QUESTION state, THE System SHALL provide a "Show Buffer" button to transition to BUFFER state
4. WHEN in BUFFER state, THE System SHALL display submission statistics and a "Reveal Answer" button
5. WHEN in ANSWER_REVEAL state, THE System SHALL display the correct answer and a "Show Scoreboard" button
6. WHEN in SCOREBOARD state, THE System SHALL display team rankings and a "Next Question" or "End Quiz" button
7. WHEN the proctor clicks control buttons, THE System SHALL send the appropriate WebSocket command
8. WHEN the quiz ends, THE System SHALL display final results and an option to return to the lobby

### Requirement 5: Participant Game Interface

**User Story:** As a participant, I want to see questions and submit answers during the quiz, so that I can compete with other teams.

#### Acceptance Criteria

1. WHEN a question is displayed, THE System SHALL show the question text, all answer options, and a countdown timer
2. WHEN the participant selects an answer, THE System SHALL highlight the selected option
3. WHEN the participant submits an answer, THE System SHALL send a submission via WebSocket to `/app/quiz/{quizId}/submit`
4. WHEN an answer is submitted, THE System SHALL disable further submissions and display a confirmation message
5. WHEN the timer expires, THE System SHALL prevent answer submission
6. WHEN in BUFFER state, THE System SHALL display a "Waiting for results" message
7. WHEN in ANSWER_REVEAL state, THE System SHALL display the correct answer and whether the team answered correctly
8. WHEN in SCOREBOARD state, THE System SHALL display the current team rankings with scores

### Requirement 6: Real-Time WebSocket Communication

**User Story:** As a system, I want to maintain real-time bidirectional communication between clients and server, so that game state updates are synchronized across all participants.

#### Acceptance Criteria

1. WHEN a client connects, THE System SHALL authenticate the WebSocket connection using the access code
2. WHEN the game state changes, THE System SHALL broadcast state updates to all connected clients via `/topic/quiz/{quizId}/state`
3. WHEN a team submits an answer, THE System SHALL broadcast submission notifications to the proctor via `/topic/quiz/{quizId}/host`
4. WHEN the timer updates, THE System SHALL broadcast timer messages to all clients via `/topic/quiz/{quizId}/timer`
5. WHEN an error occurs, THE System SHALL send error messages to the affected client via `/user/queue/errors`
6. WHEN a client disconnects, THE System SHALL clean up the connection and notify other clients if necessary
7. WHEN the WebSocket connection is lost, THE System SHALL attempt automatic reconnection

### Requirement 7: Scoreboard Display

**User Story:** As a proctor or participant, I want to see a visually appealing scoreboard showing team rankings, so that I can track competition progress.

#### Acceptance Criteria

1. WHEN the scoreboard is displayed, THE System SHALL show all teams ranked by total score
2. WHEN displaying team rankings, THE System SHALL show team name, current score, and rank position
3. WHEN in the final scoreboard, THE System SHALL highlight the top 3 teams with special styling
4. WHEN scores are tied, THE System SHALL display teams with equal rank
5. WHEN the scoreboard updates, THE System SHALL animate rank changes smoothly
6. WHEN viewing the scoreboard, THE System SHALL display the current question number or "Final Results"

### Requirement 8: Error Handling and User Feedback

**User Story:** As a user, I want clear error messages and loading states, so that I understand what's happening and can recover from errors.

#### Acceptance Criteria

1. WHEN an API request is pending, THE System SHALL display a loading indicator
2. WHEN an API request fails, THE System SHALL display a user-friendly error message
3. WHEN a WebSocket connection fails, THE System SHALL display a connection error and retry button
4. WHEN an access code is invalid, THE System SHALL display "Invalid code. Please try again."
5. WHEN a network error occurs, THE System SHALL display "Network error. Please check your connection."
6. WHEN the quiz session ends unexpectedly, THE System SHALL display an appropriate message and navigation options
7. WHEN form validation fails, THE System SHALL display inline validation errors

### Requirement 9: Responsive UI Design

**User Story:** As a user, I want the interface to work well on different screen sizes, so that I can participate from various devices.

#### Acceptance Criteria

1. WHEN viewing on mobile devices, THE System SHALL display a single-column layout
2. WHEN viewing on tablets, THE System SHALL optimize spacing and font sizes for touch interaction
3. WHEN viewing on desktop, THE System SHALL utilize available screen space efficiently
4. WHEN displaying the team grid, THE System SHALL use a responsive grid layout that adapts to screen size
5. WHEN displaying buttons, THE System SHALL ensure they are large enough for touch interaction on mobile devices

### Requirement 10: Navigation and Session Management

**User Story:** As a user, I want clear navigation options and session persistence, so that I can move through the application smoothly.

#### Acceptance Criteria

1. WHEN a user successfully logs in with an access code, THE System SHALL store the session information in browser storage
2. WHEN a user refreshes the page during an active session, THE System SHALL restore the session and reconnect to WebSocket
3. WHEN a quiz session ends, THE System SHALL provide a "Return to Login" button
4. WHEN a user manually disconnects, THE System SHALL clean up WebSocket connections and clear session data
5. WHEN navigating between pages, THE System SHALL maintain consistent styling and branding
6. WHEN a proctor leaves the lobby, THE System SHALL confirm the action before disconnecting
