import React from 'react';

// Route definitions for the IntelliQuiz application
const router = {
  // Public routes - Landing page
  '/': 'UniversalLogin',
  
  // Proctor (Host) routes
  '/proctor/login': 'ProctorLogin',
  '/host/lobby': 'HostLobby',
  '/host/game': 'HostGame',
  '/host/scoreboard': 'HostScoreboard',
  
  // Participant (Player/Team) routes
  '/participant/login': 'ParticipantLogin',
  '/player/lobby': 'PlayerLobby',
  '/player/game': 'PlayerGame',
  '/player/scoreboard': 'PlayerScoreboard',
  
  // Admin routes (existing)
  '/admin/login': 'AdminLogin',
  '/admin/dashboard': 'AdminDashboard',
  '/admin/quiz-workspace': 'QuizWorkspace',
  '/admin/user-management': 'UserManagement',
};

export default router;
