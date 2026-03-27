import { createBrowserRouter } from 'react-router-dom';
import { Navigate } from 'react-router-dom';

// Layouts
import SuperAdminLayout from '../components/superadmin/SuperAdminLayout';
import AdminLayout from '../components/admin/AdminLayout';

// Super Admin Pages
import DashboardPage from '../pages/superadmin/DashboardPage';
import UsersPage from '../pages/superadmin/UsersPage';
import PermissionsPage from '../pages/superadmin/PermissionsPage';
import BackupsPage from '../pages/superadmin/BackupsPage';

// Admin Pages
import AdminDashboardPage from '../pages/admin/DashboardPage';
import AdminQuizzesPage from '../pages/admin/QuizzesPage';
import AdminQuestionsPage from '../pages/admin/QuestionsPage';
import QuizWorkspacePage from '../pages/admin/QuizWorkspacePage';
import AdminNoPermissionsPage from '../pages/admin/NoPermissionsPage';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import UniversalLogin from '../pages/auth/UniversalLogin';

// Proctor Pages
import ProctorDashboard from '../pages/proctor/ProctorDashboard';
import HostLobby from '../pages/host/HostLobby';
import HostGame from '../pages/host/HostGame';
import HostScoreboard from '../pages/host/HostScoreboard';

// Participant Pages
import ParticipantLogin from '../pages/participant/ParticipantLogin';
import PlayerLobby from '../pages/player/PlayerLobby';
import PlayerGame from '../pages/player/PlayerGame';
import PlayerScoreboard from '../pages/player/PlayerScoreboard';
import SessionTerminated from '../pages/player/SessionTerminated';

// Admin Extra Pages
import QuestionBankPage from '../pages/admin/QuestionBankPage';

export const router = createBrowserRouter([
  // Universal Landing Page
  {
    path: '/',
    element: <UniversalLogin />,
  },
  // Admin Login (existing)
  {
    path: '/login',
    element: <Navigate to="/portal" replace />,
  },
  {
    path: '/portal',
    element: <LoginPage />,
  },
  // Proctor Routes
  {
    path: '/proctor/login',
    element: <Navigate to="/" replace />,
  },
  {
    path: '/proctor/dashboard',
    element: <ProctorDashboard />,
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
  {
    path: '/player/terminated',
    element: <SessionTerminated />,
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
        path: 'permissions',
        element: <PermissionsPage />,
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
        path: 'quizzes/:quizId',
        element: <QuizWorkspacePage />,
      },
      {
        path: 'quizzes/:quizId/questions',
        element: <AdminQuestionsPage />,
      },
      {
        path: 'teams',
        element: <Navigate to="/admin/quizzes" replace />,
      },
      {
        path: 'host',
        element: <Navigate to="/admin/quizzes" replace />,
      },
      {
        path: 'question-bank',
        element: <QuestionBankPage />,
      },
    ],
  },
]);

export default router;
