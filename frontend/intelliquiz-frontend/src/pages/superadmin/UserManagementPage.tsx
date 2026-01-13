import { useState, useEffect } from 'react';
import { User, Plus, Edit2, Trash2, Lock } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Loader } from '../../components/common/Loader';
import { ErrorBanner } from '../../components/common/ErrorBanner';

interface AdminUser {
  id: number;
  username: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  createdAt: string;
}

interface CreateUserRequest {
  username: string;
  password: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState<CreateUserRequest>({
    username: '',
    password: '',
    role: 'ADMIN',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/users', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to load users');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!formData.username || !formData.password) {
      setError('Username and password are required');
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create user');
      
      setShowCreateModal(false);
      setFormData({ username: '', password: '', role: 'ADMIN' });
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || !formData.username || !formData.password) {
      setError('Username and password are required');
      return;
    }

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      if (!response.ok) throw new Error('Failed to update user');
      
      setShowEditModal(false);
      setSelectedUser(null);
      setFormData({ username: '', password: '', role: 'ADMIN' });
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete user');
      
      setShowDeleteConfirm(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const openEditModal = (user: AdminUser) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '',
      role: user.role,
    });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (user: AdminUser) => {
    setSelectedUser(user);
    setShowDeleteConfirm(true);
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <User className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        </div>
        <Button 
          onClick={() => {
            setFormData({ username: '', password: '', role: 'ADMIN' });
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Admin User
        </Button>
      </div>

      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Username</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{user.username}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    user.role === 'SUPER_ADMIN' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <button
                    onClick={() => openEditModal(user)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="Edit user"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openDeleteConfirm(user)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Delete user"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-amber-600 hover:bg-amber-50 rounded"
                    title="Manage permissions"
                  >
                    <Lock className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No admin users found. Create one to get started.
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <Modal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Admin User"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'SUPER_ADMIN' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleCreateUser}
              className="flex-1"
            >
              Create
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

      {/* Edit User Modal */}
      <Modal 
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Admin User"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password (leave empty to keep current)
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter new password"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleUpdateUser}
              className="flex-1"
            >
              Update
            </Button>
            <Button 
              onClick={() => setShowEditModal(false)}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete User"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <strong>{selectedUser?.username}</strong>? 
            This will also remove all their quiz assignments.
          </p>
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleDeleteUser}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Delete
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
