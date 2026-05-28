import { useEffect, useMemo, useState } from 'react';
import { BiLock, BiPlus, BiTrash, BiX, BiErrorCircle, BiShield, BiSave, BiEdit } from 'react-icons/bi';
import CustomSelect from '../../components/common/CustomSelect';
import { Loader } from '../../components/common/Loader';
import { usersApi, quizzesApi } from '../../services/api';

interface Quiz {
  id: number;
  title: string;
  status: string;
}

interface AdminUser {
  id: number;
  username: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
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

const normalizeAssignments = (assignments: QuizAssignment[]) =>
  assignments
    .filter((assignment) => assignment.quizId && assignment.quizTitle)
    .sort((a, b) => a.quizTitle.localeCompare(b.quizTitle));

export default function PermissionManagementPage() {
  const [assignments, setAssignments] = useState<QuizAssignment[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<QuizAssignment | null>(null);
  const [pendingSaveAssignmentId, setPendingSaveAssignmentId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    adminId: 0,
    quizId: 0,
    permissions: [] as string[],
  });

  useEffect(() => { loadData(); }, []);

  const selectedUser = useMemo(
    () => admins.find((admin) => String(admin.id) === selectedUserId) ?? null,
    [admins, selectedUserId],
  );

  const selectedAssignments = useMemo(() => {
    if (!selectedUser) return [];
    return normalizeAssignments(assignments.filter((assignment) => assignment.adminId === selectedUser.id));
  }, [assignments, selectedUser]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, quizzesRes] = await Promise.all([
        usersApi.getAll(),
        quizzesApi.getAll(),
      ]);

      setAdmins(usersRes.filter((user) => user.role === 'ADMIN'));
      setQuizzes(quizzesRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignmentsForUser = async (userId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await usersApi.getUserAssignments(userId);
      setAssignments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = async (value: string) => {
    setSelectedUserId(value);
    if (!value) {
      setAssignments([]);
      return;
    }
    await loadAssignmentsForUser(Number(value));
  };

  const openCreateModal = () => {
    if (!selectedUser) {
      setError('Select an admin user first');
      return;
    }
    setFormData({ adminId: selectedUser.id, quizId: 0, permissions: [] });
    setShowCreateModal(true);
  };

  const openEditAssignment = (assignment: QuizAssignment) => {
    setFormData({
      adminId: assignment.adminId,
      quizId: assignment.quizId,
      permissions: [...assignment.permissions],
    });
    setPendingSaveAssignmentId(assignment.id);
    setShowCreateModal(true);
  };

  const handleCreateOrUpdateAssignment = async () => {
    if (!formData.adminId || !formData.quizId || formData.permissions.length === 0) {
      setError('Admin, quiz, and at least one permission are required');
      return;
    }

    setSaving(true);
    try {
      await usersApi.assignPermissions(formData.adminId, {
        quizId: formData.quizId,
        permissions: formData.permissions,
      });
      setShowCreateModal(false);
      setPendingSaveAssignmentId(null);
      setFormData({ adminId: 0, quizId: 0, permissions: [] });
      if (selectedUserId) {
        await loadAssignmentsForUser(Number(selectedUserId));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeAccess = async () => {
    if (!selectedAssignment) return;
    setSaving(true);
    try {
      await usersApi.revokePermissions(selectedAssignment.adminId, selectedAssignment.quizId);
      setShowDeleteConfirm(false);
      setSelectedAssignment(null);
      if (selectedUserId) {
        await loadAssignmentsForUser(Number(selectedUserId));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke access');
    } finally {
      setSaving(false);
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

  if (loading && admins.length === 0 && quizzes.length === 0) return <Loader />;

  return (
    <div className="superadmin-page">
      <div className="sa-page-hero">
        <div className="sa-page-hero-content">
          <div>
            <h1 className="sa-page-hero-title">Permission Management</h1>
            <p className="sa-page-hero-subtitle">Edit quiz-level permissions for each admin user</p>
          </div>
          <button className="btn btn-primary" onClick={openCreateModal} disabled={!selectedUser}>
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

      <div className="card sa-card-compact" style={{ marginBottom: 16 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Select admin user</label>
          <CustomSelect
            value={selectedUserId}
            onChange={handleUserChange}
            placeholder="Choose an admin to manage"
            options={admins.map((admin) => ({
              value: String(admin.id),
              label: `${admin.username} (${admin.role})`,
            }))}
          />
        </div>
      </div>

      <div className="grid-4">
        {AVAILABLE_PERMISSIONS.map((perm) => (
          <div key={perm.key} className="card sa-card-compact">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#faf2df', border: '1px solid #eadfc2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a1733', flexShrink: 0 }}>
                <BiShield size={16} />
              </div>
              <p style={{ margin: 0, fontWeight: 700, color: '#111111', fontSize: 13 }}>{perm.label}</p>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#6b6264', lineHeight: 1.45 }}>{perm.description}</p>
          </div>
        ))}
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>QUIZ</th>
              <th>PERMISSIONS</th>
              <th>ASSIGNED</th>
              <th style={{ textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {selectedAssignments.length > 0 ? (
              selectedAssignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td style={{ fontWeight: 600, color: '#111111' }}>{assignment.quizTitle}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {assignment.permissions.map((perm) => (
                        <span key={perm} className="badge badge-primary">
                          {AVAILABLE_PERMISSIONS.find((p) => p.key === perm)?.label || perm}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ color: '#6b6264', fontSize: 13 }}>{new Date(assignment.assignedAt).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-icon" onClick={() => openEditAssignment(assignment)} title="Edit permissions">
                      <BiEdit size={18} />
                    </button>
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
                <td colSpan={4}>
                  <div className="empty-state">
                    <BiLock size={48} className="empty-state-icon" />
                    <h3>{selectedUser ? 'No permissions assigned for this admin yet' : 'Select an admin to view permissions'}</h3>
                    <p>{selectedUser ? 'Use Assign Permissions to grant quiz access' : 'Choose a user from the dropdown above'}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{pendingSaveAssignmentId ? 'Edit Quiz Permissions' : 'Assign Quiz Permissions'}</h2>
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
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', border: `1.5px solid ${formData.permissions.includes(perm.key) ? '#c9a84c' : '#e2d7da'}`, borderRadius: 12, background: formData.permissions.includes(perm.key) ? '#faf2df' : '#ffffff', cursor: 'pointer', transition: 'all 0.15s ease' }}
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
              <button onClick={handleCreateOrUpdateAssignment} className="btn btn-primary" disabled={saving}>
                <BiSave size={18} /> {pendingSaveAssignmentId ? 'Save Changes' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && selectedAssignment && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Revoke Access</h2>
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-icon"><BiX size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
                <div style={{ width: 56, height: 56, margin: '0 auto 14px', background: '#f6e9ed', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a1733' }}>
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
              <button onClick={handleRevokeAccess} className="btn btn-danger" disabled={saving}>Revoke</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
