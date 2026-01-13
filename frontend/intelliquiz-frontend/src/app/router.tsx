import React from 'react';

// Route definitions
const router = {
  // Public routes
  '/': 'UniversalLogin',
  
  // Admin routes
  '/admin/login': 'AdminLogin',
  '/admin/dashboard': 'AdminDashboard',
  '/admin/quiz-workspace': 'QuizWorkspace',
  '/admin/user-management': 'UserManagement',
  
  // Host routes
  '/host/lobby': 'HostLobby',
  '/host/game': 'HostGame',
  '/host/scoreboard': 'HostScoreboard',
  
  // Player routes
  '/player/lobby': 'PlayerLobby',
  '/player/game': 'PlayerGame',
};

export default router;
