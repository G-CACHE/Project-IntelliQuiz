import { useState, useEffect } from 'react';
import { Lock, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Loader } from '../../components/common/Loader';
import { ErrorBanner } from '../../components/common/ErrorBanner';

interface Quiz {
  id: number;
  title: string;
  status: string;
}

interface AdminUser {
  id: number;
  username: string;
  role: string;
}

interface QuizAssignment {
  id: number;
  adminId: number;
  adminUsername: string;
  quizId: number;
  quizTitle: string;
  permissions: string[];
  assignedAt: string;
}

interface AdminPermission {
  key: string;
  label: string;
  description: string;
}

const AVAILABLE_PERMISSIONS: AdminPermission[] = [
  {
    key: 'CAN_VIEW_DETAILS',
    label: 'View Details',
    description: 'Read-only access to quiz configuration',
  },
  {
    key: 'CAN_EDIT_CONTENT',
    label: 'Edit Content',
    description: 'Create/update/delete questions',
  },
  {
    key: 'CAN_MANAGE_TEAMS',
    label: 'Manage Teams',
    description: 'Register teams, generate access codes',
  },
  {
    key: 'CAN_HOST_GAME',
    label: 'Host Game',
    description: 'Access live session controls and proctor PIN',
  },
];

export default function PermissionManagementPage() {
  const [assignments, setAssignments] = useState<QuizAssignment[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<QuizAssignment | null>(null);
  const [formData, setFormData] = useState({
    adminId: 0,
    quizId: 0,
    permissions: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [adminsRes, quizzesRes, assignmentsRes] = await Promise.all([
        fetch('/api/users', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/quizzes', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/users/assignments', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      if (adminsRes.ok) {
        const data = await adminsRes.json();
        setAdmins(data.filter((u: any) => u.role === 'ADMIN'));
      }

      if (quizzesRes.ok) {
        const data = await quizzesRes.json();
        setQuizzes(data);
      }

      if (assignmentsRes.ok) {
        const data = await assignmentsRes.json();
        setAssignments(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    if (!formData.adminId || !formData.quizId || formData.permissions.length === 0) {
      setError('Admin, quiz, and at least one permission are required');
      return;
    }

    try {
      const response = await fetch(`/api/users/${formData.adminId}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          quizId: formData.quizId,
          permissions: formData.permissions,
        }),
      });

      if (!response.ok) throw new Error('Failed to create assignment');
      
      setShowCreateModal(false);
      setFormData({ adminId: 0, quizId: 0, permissions: [] });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assignment');
    }
  };

  const handleRevokeAccess = async () => {
    if (!selectedAssignment) return;

    try {
      const response = await fetch(
        `/api/users/${selectedAssignment.adminId}/permissions/${selectedAssignment.quizId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to revoke access');
      
      setShowDeleteConfirm(false);
      setSelectedAssignment(null);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke access');
    }
  };

  const togglePermission = (permission: string) => {
    if (formData.permissions.includes(permission)) {
      setFormData({
        ...formData,
        permissions: formData.permissions.filter(p => p !== permission),
      });
    } else {
      setFormData({
        ...formData,
        permissions: [...formData.permissions, permission],
      });
    }
  };

  const openDeleteConfirm = (assignment: QuizAssignment) => {
    setSelectedAssignment(assignment);
    setShowDeleteConfirm(true);
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lock className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">Permission Management</h1>
        </div>
        <Button 
          onClick={() => {
            setFormData({ adminId: 0, quizId: 0, permissions: [] });
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Assign Permissions
        </Button>
      </div>

      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {/* Permission Legend */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {AVAILABLE_PERMISSIONS.map(perm => (
          <div key={perm.key} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm font-semibold text-blue-900">{perm.label}</p>
            <p className="text-xs text-blue-700 mt-1">{perm.description}</p>
          </div>
        ))}
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Admin User</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Quiz</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Permissions</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Assigned</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {assignments.map(assignment => (
              <tr key={assignment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                  {assignment.adminUsername}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {assignment.quizTitle}
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex flex-wrap gap-1">
                    {assignment.permissions.map(perm => (
                      <span 
                        key={perm}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800"
                      >
                        {AVAILABLE_PERMISSIONS.find(p => p.key === perm)?.label || perm}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(assignment.assignedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <button
                    onClick={() => openDeleteConfirm(assignment)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Revoke access"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {assignments.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No permissions assigned yet. Create your first assignment to get started.
          </div>
        )}
      </div>

      {/* Create Assignment Modal */}
      <Modal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Assign Quiz Permissions"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin User *
            </label>
            <select
              value={formData.adminId}
              onChange={(e) => setFormData({ ...formData, adminId: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={0}>Select an admin user</option>
              {admins.map(admin => (
                <option key={admin.id} value={admin.id}>
                  {admin.username} ({admin.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quiz *
            </label>
            <select
              value={formData.quizId}
              onChange={(e) => setFormData({ ...formData, quizId: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={0}>Select a quiz</option>
              {quizzes.map(quiz => (
                <option key={quiz.id} value={quiz.id}>
                  {quiz.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permissions * (select at least one)
            </label>
            <div className="space-y-2">
              {AVAILABLE_PERMISSIONS.map(perm => (
                <label key={perm.key} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(perm.key)}
                    onChange={() => togglePermission(perm.key)}
                    className="mt-1 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{perm.label}</p>
                    <p className="text-xs text-gray-600">{perm.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleCreateAssignment}
              className="flex-1"
            >
              Assign
            </Button>
            <Button 
              onClick={() => setShowCreateModal(false)}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Revoke Access Confirmation Modal */}
      <Modal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Revoke Access"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to revoke <strong>{selectedAssignment?.adminUsername}</strong>'s access to <strong>{selectedAssignment?.quizTitle}</strong>?
          </p>
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleRevokeAccess}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Revoke
            </Button>
            <Button 
              onClick={() => setShowDeleteConfirm(false)}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
