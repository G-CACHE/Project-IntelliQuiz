import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomSelect from '../../components/common/CustomSelect';
import {
  BiPlus, BiEdit, BiTrash, BiShield,
  BiSearch, BiX, BiErrorCircle,
} from 'react-icons/bi';
import { usersApi, type User, type CreateUserRequest } from '../../services/api';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUserRequest>({
    username: '',
    password: '',
    role: 'EXAMINER',
  });
  const navigate = useNavigate();

  useEffect(() => { loadUsers(); }, []);

  useEffect(() => {
    setFilteredUsers(
      users.filter((u) => u.username.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [users, searchQuery]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.username.trim()) return setError('Username is required');
    if (!formData.password.trim()) return setError('Password is required');
    if (formData.password.length < 8) return setError('Password must be at least 8 characters');
    try {
      const newUser = await usersApi.create(formData);
      setUsers((prev) => [...prev, newUser]);
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  const handleUpdate = async () => {
    if (!selectedUser || !formData.username.trim()) return setError('Username is required');
    try {
      const updated = await usersApi.update(selectedUser.id, {
        username: formData.username,
        ...(formData.password && { password: formData.password }),
      });
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? updated : u)));
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await usersApi.delete(selectedUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({ username: user.username, password: '', role: user.role });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({ username: '', password: '', role: 'EXAMINER' });
    setError(null);
  };

  if (loading) {
    return <div className="loading-container"><div className="loading-spinner" /></div>;
  }

  return (
    <div className="superadmin-page">

      {/* Hero */}
      <div className="sa-page-hero">
        <div className="sa-page-hero-content">
          <div>
            <h1 className="sa-page-hero-title">User Management</h1>
            <p className="sa-page-hero-subtitle">Manage admin accounts and access permissions</p>
          </div>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>
            <BiPlus size={16} /> Create User
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error">
          <div className="alert-content"><BiErrorCircle size={18} /><span>{error}</span></div>
          <button onClick={() => setError(null)} className="btn-icon"><BiX size={18} /></button>
        </div>
      )}

      {/* Search */}
      <div className="card sa-card-compact">
        <div className="search-input-wrapper">
          <BiSearch size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by username…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: 46 }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>USERNAME</th>
              <th>ROLE</th>
              <th style={{ textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <span className="sa-table-username">{user.username}</span>
                  </td>
                  <td>
                    <span className={`badge ${user.role === 'SUPER_ADMIN' ? 'badge-primary' : 'badge-accent'}`}>
                      {user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                    </span>
                  </td>
                  <td>
                    <div className="sa-table-actions">
                      <button className="btn-icon" onClick={() => openEditModal(user)} title="Edit user">
                        <BiEdit size={16} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => navigate(`/superadmin/permissions?userId=${user.id}`)}
                        title="Manage permissions"
                      >
                        <BiShield size={16} />
                      </button>
                      <button
                        className="btn-icon danger"
                        onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}
                        title="Delete user"
                        disabled={user.role === 'SUPER_ADMIN'}
                        style={{ opacity: user.role === 'SUPER_ADMIN' ? 0.35 : 1 }}
                      >
                        <BiTrash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3}>
                  <div className="empty-state">
                    <h3>No users found</h3>
                    <p>{searchQuery ? 'Try a different search term' : 'Create your first admin user to get started'}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create Admin User</h2>
              <button onClick={() => setShowCreateModal(false)} className="btn-icon"><BiX size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Username</label>
                <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="form-input" placeholder="Enter username" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="form-input" placeholder="Minimum 8 characters" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Role</label>
                <CustomSelect
                  value={formData.role}
                  onChange={(v) => setFormData({ ...formData, role: v as 'ADMIN' | 'EXAMINER' | 'SUPER_ADMIN' })}
                  options={[
                    { value: 'EXAMINER', label: 'Admin' },
                    { value: 'ADMIN', label: 'Admin (Legacy)' },
                    { value: 'SUPER_ADMIN', label: 'Super Admin' },
                  ]}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleCreate} className="btn btn-primary">Create User</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit User</h2>
              <button onClick={() => setShowEditModal(false)} className="btn-icon"><BiX size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Username</label>
                <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="form-input" autoFocus />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">New Password</label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="form-input" placeholder="Leave empty to keep current" />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleUpdate} className="btn btn-primary">Update User</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Delete User</h2>
              <button onClick={() => setShowDeleteModal(false)} className="btn-icon"><BiX size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ margin: 0, color: '#374151', lineHeight: 1.6 }}>
                Delete <strong style={{ color: '#111111' }}>{selectedUser.username}</strong>? This will also remove all their quiz assignments.
              </p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="btn btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
