import { useState, useEffect } from 'react';
import { LayoutDashboard, BookOpen, Users, Trophy, Settings } from 'lucide-react';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { Loader } from '../../components/common/Loader';

interface DashboardStats {
  totalQuizzes: number;
  activeQuizzes: number;
  totalAdmins: number;
}

interface RecentActivity {
  id: number;
  action: string;
  description: string;
  timestamp: string;
  type: 'quiz' | 'user' | 'team' | 'submission';
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalQuizzes: 0,
    activeQuizzes: 0,
    totalAdmins: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [quizzesRes, usersRes] = await Promise.all([
        fetch('/api/quizzes', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/users', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      if (!quizzesRes.ok || !usersRes.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const quizzes = await quizzesRes.json();
      const users = await usersRes.json();

      setStats({
        totalQuizzes: quizzes.length,
        activeQuizzes: quizzes.filter((q: any) => q.status === 'ACTIVE').length,
        totalAdmins: users.length,
      });

      // Mock recent activity
      setRecentActivity([
        {
          id: 1,
          action: 'Admin User Created',
          description: 'New admin "john_admin" created',
          timestamp: new Date().toISOString(),
          type: 'user',
        },
        {
          id: 2,
          action: 'Quiz Created',
          description: 'New quiz "General Knowledge" created',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          type: 'quiz',
        },
        {
          id: 3,
          action: 'Permissions Assigned',
          description: 'Permissions assigned to admin user',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          type: 'user',
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'quiz':
        return <BookOpen className="w-4 h-4" />;
      case 'user':
        return <Users className="w-4 h-4" />;
      case 'team':
        return <Users className="w-4 h-4" />;
      case 'submission':
        return <Trophy className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getActivityColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'quiz':
        return 'bg-purple-100 text-purple-700';
      case 'user':
        return 'bg-red-100 text-red-700';
      case 'team':
        return 'bg-green-100 text-green-700';
      case 'submission':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading && !stats.totalQuizzes) return <Loader />;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="w-8 h-8 text-red-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
            <p className="text-gray-600 text-sm mt-1">System administration and control</p>
          </div>
        </div>
      </div>

      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Quizzes */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm font-medium">Total Quizzes</p>
            <BookOpen className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalQuizzes}</p>
          <p className="text-xs text-gray-500 mt-2">
            {stats.activeQuizzes} active
          </p>
        </div>

        {/* Active Quizzes */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm font-medium">Active Now</p>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.activeQuizzes}</p>
          <p className="text-xs text-gray-500 mt-2">Live sessions</p>
        </div>

        {/* Admin Users */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm font-medium">Admin Users</p>
            <Users className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalAdmins}</p>
          <p className="text-xs text-gray-500 mt-2">Total admins</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Admin Actions</h2>
          <div className="space-y-3">
            <a
              href="/superadmin/users"
              className="block px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium"
            >
              👤 Manage Users
            </a>
            <a
              href="/superadmin/quizzes"
              className="block px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors font-medium"
            >
              📋 Manage Quizzes
            </a>
            <a
              href="/superadmin/editor"
              className="block px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
            >
              ✏️ Edit Quiz
            </a>
            <a
              href="/superadmin/permissions"
              className="block px-4 py-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors font-medium"
            >
              🔐 Assign Permissions
            </a>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">System Activity</h2>
          
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map(activity => (
                <div
                  key={activity.id}
                  className="flex gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0"
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {activity.action}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No recent activity
            </div>
          )}
        </div>
      </div>

      {/* System Info Card */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200 p-6">
        <div className="flex items-start gap-4">
          <Settings className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">System Overview</h3>
            <ul className="text-gray-700 text-sm space-y-1">
              <li>✓ All admin users and permissions are managed from this dashboard</li>
              <li>✓ You have full access to create and manage all quizzes</li>
              <li>✓ Delegate quiz management to admin users with specific permissions</li>
              <li>✓ Monitor all system activity and audit logs</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Two-Tier Admin System Info */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Two-Tier Admin System</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-semibold text-red-700 mb-2">SUPER_ADMIN (You)</p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Full system access</li>
              <li>• Create/manage admin users</li>
              <li>• Create/manage all quizzes</li>
              <li>• Assign permissions to admins</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-700 mb-2">ADMIN (Delegated)</p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Restricted to assigned quizzes</li>
              <li>• CAN_VIEW_DETAILS - View quiz</li>
              <li>• CAN_EDIT_CONTENT - Edit questions</li>
              <li>• CAN_MANAGE_TEAMS - Register teams</li>
              <li>• CAN_HOST_GAME - Control sessions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
