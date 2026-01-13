import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BiUser,
  BiPlus,
  BiEdit,
  BiTrash,
  BiShield,
  BiSearch,
  BiX,
  BiErrorCircle,
  BiUserCircle,
  BiCrown,
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
    role: 'ADMIN',
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter((user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
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
      setUsers(prev => [...prev, newUser]);
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;
    if (!formData.username.trim()) return setError('Username is required');

    try {
      const updatedUser = await usersApi.update(selectedUser.id, {
        username: formData.username,
        ...(formData.password && { password: formData.password }),
      });
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? updatedUser : u));
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
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
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
    setFormData({ username: '', password: '', role: 'ADMIN' });
    setError(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div>
      {/* Page Header with gradient background */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--spacing-xl)',
        marginBottom: 'var(--spacing-xl)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative shapes */}
        <div style={{
          position: 'absolute',
          top: -30,
          right: 80,
          width: 120,
          height: 120,
          background: 'rgba(248, 193, 7, 0.1)',
          borderRadius: '50%',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -20,
          right: 200,
          width: 80,
          height: 80,
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute',
          top: '50%',
          right: 50,
          width: 6,
          height: 60,
          background: 'rgba(248, 193, 7, 0.3)',
          borderRadius: 'var(--radius-full)',
          transform: 'translateY(-50%) rotate(20deg)',
        }} />
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <div style={{
              width: 56,
              height: 56,
              background: 'rgba(248, 193, 7, 0.2)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-accent)',
            }}>
              <BiUser size={28} />
            </div>
            <div>
              <h1 style={{ color: 'var(--color-white)', fontSize: 'var(--font-size-2xl)', fontWeight: 700, margin: 0 }}>
                User Management
              </h1>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 'var(--font-size-sm)', margin: '4px 0 0' }}>
                Manage admin users and their access permissions
              </p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>
            <BiPlus size={18} /> Create User
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          <div className="alert-content">
            <BiErrorCircle size={20} />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="btn-icon">
            <BiX size={20} />
          </button>
        </div>
      )}

      {/* Search Card */}
      <div className="card" style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)' }}>
        <div style={{ position: 'relative' }}>
          <BiSearch 
            size={20} 
            style={{ 
              position: 'absolute', 
              left: 16, 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: 'var(--text-muted)' 
            }} 
          />
          <input
            type="text"
            placeholder="Search users by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: 48 }}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>USER</th>
              <th>ROLE</th>
              <th style={{ textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 'var(--radius-lg)',
                        background: user.role === 'SUPER_ADMIN' 
                          ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))'
                          : 'linear-gradient(135deg, var(--color-accent), var(--color-accent-light))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: user.role === 'SUPER_ADMIN' ? 'white' : 'var(--color-black)',
                      }}>
                        {user.role === 'SUPER_ADMIN' ? <BiCrown size={22} /> : <BiUserCircle size={22} />}
                      </div>
                      <div>
                        <span style={{ fontWeight: 600, display: 'block', color: 'var(--text-primary)' }}>{user.username}</span>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>ID: {user.id}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${user.role === 'SUPER_ADMIN' ? 'badge-primary' : 'badge-accent'}`}>
                      {user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'flex-end' }}>
                      <button className="btn-icon" onClick={() => openEditModal(user)} title="Edit">
                        <BiEdit size={18} />
                      </button>
                      <button 
                        className="btn-icon" 
                        onClick={() => navigate(`/superadmin/permissions?userId=${user.id}`)} 
                        title="Permissions"
                      >
                        <BiShield size={18} />
                      </button>
                      <button
                        className="btn-icon danger"
                        onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}
                        title="Delete"
                        disabled={user.role === 'SUPER_ADMIN'}
                        style={{ opacity: user.role === 'SUPER_ADMIN' ? 0.4 : 1 }}
                      >
                        <BiTrash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3}>
                  <div className="empty-state">
                    <BiUserCircle size={56} className="empty-state-icon" />
                    <p style={{ fontWeight: 600, marginTop: 'var(--spacing-md)' }}>No users found</p>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                      {searchQuery ? 'Try a different search term' : 'Create your first admin user to get started'}
                    </p>
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
              <button onClick={() => setShowCreateModal(false)} className="btn-icon"><BiX size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="form-input"
                  placeholder="Enter username"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="form-input"
                  placeholder="Minimum 8 characters"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'SUPER_ADMIN' })}
                  className="form-input form-select"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
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
              <button onClick={() => setShowEditModal(false)} className="btn-icon"><BiX size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="form-input"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="form-input"
                  placeholder="Leave empty to keep current"
                />
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
              <button onClick={() => setShowDeleteModal(false)} className="btn-icon"><BiX size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: 'var(--spacing-md)' }}>
                <div style={{
                  width: 64,
                  height: 64,
                  margin: '0 auto var(--spacing-md)',
                  background: 'rgba(136, 0, 21, 0.1)',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary)',
                }}>
                  <BiTrash size={28} />
                </div>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{selectedUser.username}</strong>?
                </p>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginTop: 'var(--spacing-xs)' }}>
                  This will also remove all their quiz assignments.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="btn btn-danger">Delete User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
