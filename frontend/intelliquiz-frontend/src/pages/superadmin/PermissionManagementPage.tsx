import { useState, useEffect } from 'react';
import { BiLock, BiPlus, BiTrash, BiX, BiErrorCircle, BiShield } from 'react-icons/bi';
import CustomSelect from '../../components/common/CustomSelect';
import { Loader } from '../../components/common/Loader';

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
  { key: 'CAN_VIEW_DETAILS', label: 'View Details', description: 'Read-only access to quiz configuration' },
  { key: 'CAN_EDIT_CONTENT', label: 'Edit Content', description: 'Create, update, and delete questions' },
  { key: 'CAN_MANAGE_TEAMS', label: 'Manage Teams', description: 'Register teams and generate access codes' },
  { key: 'CAN_HOST_GAME', label: 'Host Game', description: 'Access live session controls and proctor PIN' },
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

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [adminsRes, quizzesRes, assignmentsRes] = await Promise.all([
        fetch('/api/users', { credentials: 'include' }),
        fetch('/api/quizzes', { credentials: 'include' }),
        fetch('/api/users/assignments', { credentials: 'include' }),
      ]);
      if (adminsRes.ok) {
        const data = await adminsRes.json();
        setAdmins(data.filter((u: AdminUser) => u.role === 'ADMIN'));
      }
      if (quizzesRes.ok) setQuizzes(await quizzesRes.json());
      if (assignmentsRes.ok) setAssignments(await assignmentsRes.json());
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
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: formData.quizId, permissions: formData.permissions }),
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
        { method: 'DELETE', credentials: 'include' }
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
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  if (loading) return <Loader />;

  return (
    <div className="superadmin-page">
      {/* Hero */}
      <div className="sa-page-hero">
        <div className="sa-page-hero-content">
          <div>
            <h1 className="sa-page-hero-title">Permission Management</h1>
            <p className="sa-page-hero-subtitle">Assign quiz access and capabilities to admin users</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => { setFormData({ adminId: 0, quizId: 0, permissions: [] }); setShowCreateModal(true); }}
          >
            <BiPlus size={18} /> Assign Permissions
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <div className="alert-content"><BiErrorCircle size={20} /><span>{error}</span></div>
          <button onClick={() => setError(null)} className="btn-icon"><BiX size={20} /></button>
        </div>
      )}

      {/* Permission Legend */}
      <div className="grid-4">
        {AVAILABLE_PERMISSIONS.map((perm) => (
          <div key={perm.key} className="card sa-card-compact">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: '#faf2df', border: '1px solid #eadfc2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#7a1733', flexShrink: 0,
              }}>
                <BiShield size={16} />
              </div>
              <p style={{ margin: 0, fontWeight: 700, color: '#111111', fontSize: 13 }}>{perm.label}</p>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#6b6264', lineHeight: 1.45 }}>{perm.description}</p>
          </div>
        ))}
      </div>

      {/* Assignments Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ADMIN USER</th>
              <th>QUIZ</th>
              <th>PERMISSIONS</th>
              <th>ASSIGNED</th>
              <th style={{ textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {assignments.length > 0 ? (
              assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td style={{ fontWeight: 600, color: '#111111' }}>{assignment.adminUsername}</td>
                  <td style={{ color: '#374151' }}>{assignment.quizTitle}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {assignment.permissions.map((perm) => (
                        <span key={perm} className="badge badge-primary">
                          {AVAILABLE_PERMISSIONS.find((p) => p.key === perm)?.label || perm}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ color: '#6b6264', fontSize: 13 }}>
                    {new Date(assignment.assignedAt).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn-icon danger"
                      onClick={() => { setSelectedAssignment(assignment); setShowDeleteConfirm(true); }}
                      title="Revoke access"
                    >
                      <BiTrash size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <BiLock size={48} className="empty-state-icon" />
                    <h3>No permissions assigned yet</h3>
                    <p>Create your first assignment to get started</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Assign Quiz Permissions</h2>
              <button onClick={() => setShowCreateModal(false)} className="btn-icon"><BiX size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Admin User *</label>
                <CustomSelect
                  value={String(formData.adminId)}
                  onChange={(v) => setFormData({ ...formData, adminId: parseInt(v) })}
                  placeholder="Select an admin user"
                  options={admins.map((admin) => ({
                    value: String(admin.id),
                    label: `${admin.username} (${admin.role})`,
                  }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Quiz *</label>
                <CustomSelect
                  value={String(formData.quizId)}
                  onChange={(v) => setFormData({ ...formData, quizId: parseInt(v) })}
                  placeholder="Select a quiz"
                  options={quizzes.map((quiz) => ({ value: String(quiz.id), label: quiz.title }))}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Permissions * (select at least one)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {AVAILABLE_PERMISSIONS.map((perm) => (
                    <label
                      key={perm.key}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        padding: '12px 14px',
                        border: `1.5px solid ${formData.permissions.includes(perm.key) ? '#c9a84c' : '#e2d7da'}`,
                        borderRadius: 12,
                        background: formData.permissions.includes(perm.key) ? '#faf2df' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm.key)}
                        onChange={() => togglePermission(perm.key)}
                        style={{ accentColor: '#7a1733', width: 16, height: 16, marginTop: 2, flexShrink: 0 }}
                      />
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, color: '#111111', fontSize: 14 }}>{perm.label}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b6264' }}>{perm.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleCreateAssignment} className="btn btn-primary">Assign</button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Confirmation Modal */}
      {showDeleteConfirm && selectedAssignment && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Revoke Access</h2>
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-icon"><BiX size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
                <div style={{
                  width: 56, height: 56, margin: '0 auto 14px',
                  background: '#f6e9ed', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#7a1733',
                }}>
                  <BiTrash size={26} />
                </div>
                <p style={{ color: '#374151', margin: '0 0 4px' }}>
                  Revoke <strong style={{ color: '#111111' }}>{selectedAssignment.adminUsername}</strong>'s access to{' '}
                  <strong style={{ color: '#111111' }}>{selectedAssignment.quizTitle}</strong>?
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleRevokeAccess} className="btn btn-danger">Revoke</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
