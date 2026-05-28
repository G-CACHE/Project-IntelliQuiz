import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BiShield,
  BiSearch,
  BiEdit,
  BiGroup,
  BiJoystick,
  BiCheckCircle,
  BiXCircle,
  BiKey,
  BiData,
  BiBookOpen,
  BiUser,
  BiPin,
  BiPlus,
  BiTrash,
  BiX,
  BiErrorCircle,
  BiSave,
  BiLock,
} from 'react-icons/bi';
import CustomSelect from '../../components/common/CustomSelect';
import { Loader } from '../../components/common/Loader';
import { quizzesApi, usersApi } from '../../services/api';
import './PermissionsPage.css';

interface Permission { key: string; label: string; description: string; icon: React.ReactNode; color: string; }
interface AdminUser { id: number; username: string; role: 'ADMIN' | 'SUPER_ADMIN'; }
interface Quiz { id: number; title: string; status: string; }
interface QuizAssignment { id: number; adminId: number; adminUsername: string; quizId: number; quizTitle: string; permissions: string[]; assignedAt: string; }

const PERMISSIONS: Permission[] = [
  { key: 'CAN_VIEW_DETAILS', label: 'View Details', description: 'Read-only access to quiz configuration', icon: <BiSearch size={22} />, color: '#7a1733' },
  { key: 'CAN_EDIT_CONTENT', label: 'Edit Content', description: 'Create, update, and delete questions', icon: <BiEdit size={22} />, color: '#7a1733' },
  { key: 'CAN_MANAGE_TEAMS', label: 'Manage Teams', description: 'Register teams and generate access codes', icon: <BiGroup size={22} />, color: '#c9a84c' },
  { key: 'CAN_HOST_GAME', label: 'Host Game', description: 'Access live session controls and proctor PIN', icon: <BiJoystick size={22} />, color: '#7a1733' },
];

export default function PermissionsPage() {
  const [searchParams] = useSearchParams();
  const userIdParam = searchParams.get('userId') ?? '';
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [assignments, setAssignments] = useState<QuizAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState(userIdParam);
  const [showEditor, setShowEditor] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<QuizAssignment | null>(null);
  const [formData, setFormData] = useState({ adminId: 0, quizId: 0, permissions: [] as string[] });

  useEffect(() => { loadBaseData(); }, []);
  useEffect(() => { if (userIdParam) { setSelectedUserId(userIdParam); void loadAssignments(Number(userIdParam)); } }, [userIdParam]);

  const selectedUser = useMemo(() => admins.find((admin) => String(admin.id) === selectedUserId) ?? null, [admins, selectedUserId]);
  const selectedAssignments = useMemo(() => assignments.filter((assignment) => assignment.adminId === Number(selectedUserId)), [assignments, selectedUserId]);

  const loadBaseData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [users, quizList] = await Promise.all([usersApi.getAll(), quizzesApi.getAll()]);
      setAdmins(users.filter((user) => user.role === 'ADMIN'));
      setQuizzes(quizList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permission data');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async (adminId: number) => {
    if (!adminId) return;
    setLoading(true);
    setError(null);
    try {
      setAssignments(await usersApi.getUserAssignments(adminId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const openEditor = (assignment?: QuizAssignment) => {
    if (!selectedUser) return setError('Select an admin user first');
    setFormData(assignment ? { adminId: assignment.adminId, quizId: assignment.quizId, permissions: [...assignment.permissions] } : { adminId: selectedUser.id, quizId: 0, permissions: [] });
    setShowEditor(true);
  };

  const savePermissions = async () => {
    if (!formData.adminId || !formData.quizId || formData.permissions.length === 0) return setError('Select a quiz and at least one permission');
    setSaving(true);
    try {
      await usersApi.assignPermissions(formData.adminId, { quizId: formData.quizId, permissions: formData.permissions });
      setShowEditor(false);
      await loadAssignments(formData.adminId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const revokeAssignment = async () => {
    if (!selectedAssignment) return;
    setSaving(true);
    try {
      await usersApi.revokePermissions(selectedAssignment.adminId, selectedAssignment.quizId);
      setShowDeleteConfirm(false);
      setSelectedAssignment(null);
      await loadAssignments(selectedAssignment.adminId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke access');
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (permission: string) => setFormData((prev) => ({
    ...prev,
    permissions: prev.permissions.includes(permission) ? prev.permissions.filter((p) => p !== permission) : [...prev.permissions, permission],
  }));

  if (loading && admins.length === 0 && quizzes.length === 0) return <Loader />;

  return (
    <div className="permissions-kahoot">
      {/* Hero Header */}
      <div className="permissions-hero">
        <div className="hero-content">
          <div className="hero-left">
            <div className="hero-icon-wrap">
              <BiShield size={32} />
            </div>
            <div>
              <h1>Permission Control</h1>
              <p>Super Admin manages quiz-level access for each admin user</p>
            </div>
          </div>
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

      {/* Admin Independence Info */}
      <div className="info-section">
        <div className="perm-info-card">
          <div className="perm-info-icon"><BiBookOpen size={36} /></div>
          <div>
            <h2 className="perm-info-title">Edit permissions per admin</h2>
            <p className="perm-info-text">
              Choose an admin user, load their current quiz assignments, then edit or revoke access from this screen.
            </p>
          </div>
        </div>
      </div>

      {/* Admin User Selector */}
      <div className="card sa-card-compact" style={{ marginBottom: 16 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Select admin user</label>
          <CustomSelect
            value={selectedUserId}
            onChange={async (v) => { setSelectedUserId(v); await loadAssignments(Number(v)); }}
            placeholder="Choose an admin to manage"
            options={admins.map((admin) => ({ value: String(admin.id), label: `${admin.username} (${admin.role})` }))}
          />
        </div>
      </div>

      {/* Permission Types Grid */}
      <div className="permissions-section">
        <h2 className="section-title">
          <BiShield className="title-icon-svg" />
          Admin Capabilities
        </h2>
        <div className="permissions-grid">
          {PERMISSIONS.map((p) => (
            <div 
              key={p.key} 
              className="permission-card"
              style={{ '--card-color': p.color } as React.CSSProperties}
            >
              <div className="permission-icon" style={{ background: p.color }}>
                {p.icon}
              </div>
              <div className="permission-info">
                <h3>{p.label}</h3>
                <p>{p.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="how-it-works-section">
        <h2 className="section-title" style={{ justifyContent: 'center' }}>How Role-Based Access Works</h2>
        
        <div className="perm-roles-grid">
          {/* Admin Card */}
          <div className="perm-role-card">
            <div className="perm-role-header">
              <div className="perm-role-icon perm-role-icon--maroon"><BiUser size={20} /></div>
              <h3 className="perm-role-name">Admin</h3>
            </div>
            <ul className="perm-role-list">
              <li><BiCheckCircle size={15} className="perm-check" /> Can be granted quiz-specific permissions</li>
              <li><BiCheckCircle size={15} className="perm-check" /> Can manage assigned quizzes and content</li>
              <li><BiCheckCircle size={15} className="perm-check" /> Can host or maintain only the quizzes they are assigned to</li>
              <li><BiXCircle size={15} className="perm-x" /> Cannot manage quizzes they are not assigned to</li>
            </ul>
          </div>

          {/* Super Admin Card */}
          <div className="perm-role-card">
            <div className="perm-role-header">
              <div className="perm-role-icon perm-role-icon--gold"><BiKey size={20} /></div>
              <h3 className="perm-role-name">Super Admin</h3>
            </div>
            <ul className="perm-role-list">
              <li><BiSearch size={15} className="perm-check" /> View all users and quiz assignments</li>
              <li><BiShield size={15} className="perm-check" /> Assign and revoke quiz permissions</li>
              <li><BiData size={15} className="perm-check" /> Manage system backups</li>
              <li><BiXCircle size={15} className="perm-x" /> Does not own quiz content by default</li>
            </ul>
          </div>

          {/* Participant Card */}
          <div className="perm-role-card">
            <div className="perm-role-header">
              <div className="perm-role-icon perm-role-icon--gold"><BiJoystick size={20} /></div>
              <h3 className="perm-role-name">Participant</h3>
            </div>
            <ul className="perm-role-list">
              <li><BiEdit size={15} className="perm-check" /> Answer quiz questions</li>
              <li><BiGroup size={15} className="perm-check" /> Join teams to participate</li>
              <li><BiBookOpen size={15} className="perm-check" /> View live scoreboard</li>
              <li><BiXCircle size={15} className="perm-x" /> No creation or management rights</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Key Points */}
      <div className="additional-info-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h3 className="perm-keypoints-title"><BiPin size={16} /> Key Points</h3>
          <button className="btn btn-primary" onClick={() => openEditor()} disabled={!selectedUser}><BiPlus size={18} /> Assign / Edit Permissions</button>
        </div>
        <ul className="perm-keypoints-list">
          <li><strong>Admin Selection:</strong> Super Admin chooses a user before editing permissions.</li>
          <li><strong>Quiz-Level Control:</strong> Permissions are applied per quiz, not globally.</li>
          <li><strong>Full Oversight:</strong> Super Admin can review, assign, edit, and revoke access at any time.</li>
          <li><strong>Secure by Default:</strong> Fine-grained role-based access control at both UI and API layers.</li>
        </ul>
      </div>

      {/* Permissions Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>QUIZ</th>
              <th>PERMISSIONS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {selectedAssignments.length > 0 ? selectedAssignments.map((assignment) => (
              <tr key={assignment.id}>
                <td style={{ fontWeight: 600 }}>{assignment.quizTitle}</td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {assignment.permissions.map((perm) => (
                      <span key={perm} className="badge badge-primary">
                        {PERMISSIONS.find((p) => p.key === perm)?.label || perm}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn-icon" onClick={() => openEditor(assignment)} title="Edit permissions">
                    <BiEdit size={18} />
                  </button>
                  <button className="btn-icon danger" onClick={() => { setSelectedAssignment(assignment); setShowDeleteConfirm(true); }} title="Revoke access">
                    <BiTrash size={18} />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={3}>
                  <div className="empty-state">
                    <BiLock size={48} className="empty-state-icon" />
                    <h3>{selectedUser ? 'No permissions assigned for this admin yet' : 'Select an admin to view permissions'}</h3>
                    <p>{selectedUser ? 'Use Assign / Edit Permissions to change access' : 'Choose a user from the dropdown above'}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Assign/Edit Permissions Modal */}
      {showEditor && (
        <div className="modal-overlay" onClick={() => setShowEditor(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Assign Quiz Permissions</h2>
              <button onClick={() => setShowEditor(false)} className="btn-icon">
                <BiX size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Admin User *</label>
                <CustomSelect
                  value={String(formData.adminId)}
                  onChange={(v) => setFormData({ ...formData, adminId: parseInt(v) })}
                  placeholder="Select an admin user"
                  options={admins.map((admin) => ({ value: String(admin.id), label: `${admin.username} (${admin.role})` }))}
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
                  {PERMISSIONS.map((perm) => (
                    <label key={perm.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', border: `1.5px solid ${formData.permissions.includes(perm.key) ? '#c9a84c' : '#e2d7da'}`, borderRadius: 12, background: formData.permissions.includes(perm.key) ? '#faf2df' : '#ffffff', cursor: 'pointer' }}>
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
              {(!formData.quizId || formData.permissions.length === 0) && (
                <p style={{ fontSize: 12, color: '#b91c1c', margin: '0 auto 0 0' }}>
                  {!formData.quizId ? 'Select a quiz.' : 'Select at least one permission.'}
                </p>
              )}
              <button onClick={() => setShowEditor(false)} className="btn btn-secondary">Cancel</button>
              <button
                onClick={savePermissions}
                className="btn btn-primary"
                disabled={saving || !formData.quizId || formData.permissions.length === 0}
              >
                <BiSave size={18} /> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Access Confirmation Modal */}
      {showDeleteConfirm && selectedAssignment && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Revoke Access</h2>
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-icon">
                <BiX size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
                <div style={{ width: 56, height: 56, margin: '0 auto 14px', background: '#f6e9ed', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a1733' }}>
                  <BiTrash size={26} />
                </div>
                <p style={{ color: '#374151', margin: '0 0 4px' }}>
                  Revoke <strong style={{ color: '#111111' }}>{selectedAssignment.adminUsername}</strong>'s access to <strong style={{ color: '#111111' }}>{selectedAssignment.quizTitle}</strong>?
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={revokeAssignment} className="btn btn-danger" disabled={saving}>Revoke</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
