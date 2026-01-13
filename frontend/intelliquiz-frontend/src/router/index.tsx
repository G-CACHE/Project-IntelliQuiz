import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import SuperAdminLayout from '../components/superadmin/SuperAdminLayout';

// Super Admin Pages
import DashboardPage from '../pages/superadmin/DashboardPage';
import UsersPage from '../pages/superadmin/UsersPage';
import QuizzesPage from '../pages/superadmin/QuizzesPage';
import QuestionsPage from '../pages/superadmin/QuestionsPage';
import PermissionsPage from '../pages/superadmin/PermissionsPage';
import TeamsPage from '../pages/superadmin/TeamsPage';
import ScoreboardPage from '../pages/superadmin/ScoreboardPage';
import BackupsPage from '../pages/superadmin/BackupsPage';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
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
]);

export default router;
