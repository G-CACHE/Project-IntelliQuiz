import { createBrowserRouter } from 'react-router-dom';

// Layouts
import SuperAdminLayout from '../components/superadmin/SuperAdminLayout';
import AdminLayout from '../components/admin/AdminLayout';

// Super Admin Pages
import DashboardPage from '../pages/superadmin/DashboardPage';
import UsersPage from '../pages/superadmin/UsersPage';
import QuizzesPage from '../pages/superadmin/QuizzesPage';
import QuestionsPage from '../pages/superadmin/QuestionsPage';
import PermissionsPage from '../pages/superadmin/PermissionsPage';
import TeamsPage from '../pages/superadmin/TeamsPage';
import ScoreboardPage from '../pages/superadmin/ScoreboardPage';
import BackupsPage from '../pages/superadmin/BackupsPage';

// Admin Pages
import AdminDashboardPage from '../pages/admin/DashboardPage';
import AdminQuizzesPage from '../pages/admin/QuizzesPage';
import AdminQuestionsPage from '../pages/admin/QuestionsPage';
import AdminTeamsPage from '../pages/admin/TeamsPage';
import AdminScoreboardPage from '../pages/admin/ScoreboardPage';
import AdminHostPage from '../pages/admin/HostPage';
import AdminNoPermissionsPage from '../pages/admin/NoPermissionsPage';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import UniversalLogin from '../pages/auth/UniversalLogin';

// Proctor Pages
import ProctorLogin from '../pages/proctor/ProctorLogin';
import HostLobby from '../pages/host/HostLobby';
import HostGame from '../pages/host/HostGame';
import HostScoreboard from '../pages/host/HostScoreboard';

// Participant Pages
import ParticipantLogin from '../pages/participant/ParticipantLogin';
import PlayerLobby from '../pages/player/PlayerLobby';
import PlayerGame from '../pages/player/PlayerGame';
import PlayerScoreboard from '../pages/player/PlayerScoreboard';

export const router = createBrowserRouter([
  // Universal Landing Page
  {
    path: '/',
    element: <UniversalLogin />,
  },
  // Admin Login (existing)
  {
    path: '/login',
    element: <LoginPage />,
  },
  // Proctor Routes
  {
    path: '/proctor/login',
    element: <ProctorLogin />,
  },
  {
    path: '/host/lobby',
    element: <HostLobby />,
  },
  {
    path: '/host/game',
    element: <HostGame />,
  },
  {
    path: '/host/scoreboard',
    element: <HostScoreboard />,
  },
  // Participant Routes
  {
    path: '/participant/login',
    element: <ParticipantLogin />,
  },
  {
    path: '/player/lobby',
    element: <PlayerLobby />,
  },
  {
    path: '/player/game',
    element: <PlayerGame />,
  },
  {
    path: '/player/scoreboard',
    element: <PlayerScoreboard />,
  },
  // Super Admin Routes
  {
    path: '/superadmin',
    element: <SuperAdminLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'users',
        element: <UsersPage />,
      },
      {
        path: 'quizzes',
        element: <QuizzesPage />,
      },
      {
        path: 'quizzes/:quizId/questions',
        element: <QuestionsPage />,
      },
      {
        path: 'permissions',
        element: <PermissionsPage />,
      },
      {
        path: 'teams',
        element: <TeamsPage />,
      },
      {
        path: 'scoreboard',
        element: <ScoreboardPage />,
      },
      {
        path: 'backups',
        element: <BackupsPage />,
      },
    ],
  },
  // Admin Routes
  {
    path: '/admin/no-permissions',
    element: <AdminNoPermissionsPage />,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <AdminDashboardPage />,
      },
      {
        path: 'quizzes',
        element: <AdminQuizzesPage />,
      },
      {
        path: 'quizzes/:quizId/questions',
        element: <AdminQuestionsPage />,
      },
      {
        path: 'teams',
        element: <AdminTeamsPage />,
      },
      {
        path: 'scoreboard',
        element: <AdminScoreboardPage />,
      },
      {
        path: 'host',
        element: <AdminHostPage />,
      },
    ],
  },
]);

export default router;
