import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  BiShield, 
  BiPlus, 
  BiTrash, 
  BiX, 
  BiErrorCircle, 
  BiShow, 
  BiEdit, 
  BiGroup, 
  BiJoystick,
  BiCheckCircle,
  BiLockOpen,
  BiUser,
  BiBookOpen,
} from 'react-icons/bi';
import { usersApi, quizzesApi, type User, type Quiz } from '../../services/api';
import './PermissionsPage.css';

interface Permission { key: string; label: string; description: string; icon: React.ReactNode; color: string; }
interface QuizAssignment { id: number; adminId: number; adminUsername: string; quizId: number; quizTitle: string; permissions: string[]; assignedAt: string; }

const PERMISSIONS: Permission[] = [
  { key: 'CAN_VIEW_DETAILS', label: 'View Details', description: 'Read-only access to quiz configuration', icon: <BiShow size={22} />, color: '#1368ce' },
  { key: 'CAN_EDIT_CONTENT', label: 'Edit Content', description: 'Create, update, and delete questions', icon: <BiEdit size={22} />, color: '#26890c' },
  { key: 'CAN_MANAGE_TEAMS', label: 'Manage Teams', description: 'Register teams and generate access codes', icon: <BiGroup size={22} />, color: '#ffa602' },
  { key: 'CAN_HOST_GAME', label: 'Host Game', description: 'Access live session controls and proctor PIN', icon: <BiJoystick size={22} />, color: '#e21b3c' },
];

export default function PermissionsPage() {
  const [searchParams] = useSearchParams();
  const preselectedUserId = searchParams.get('userId');
  const [assignments, setAssignments] = useState<QuizAssignment[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<QuizAssignment | null>(null);
  const [formData, setFormData] = useState({ adminId: preselectedUserId ? parseInt(preselectedUserId) : 0, quizId: 0, permissions: [] as string[] });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (preselectedUserId) setFormData((p) => ({ ...p, adminId: parseInt(preselectedUserId) })); }, [preselectedUserId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, quizzesData] = await Promise.all([
        usersApi.getAll().catch(() => []),
        quizzesApi.getAll()
      ]);
      setAdmins(usersData.filter((u) => u.role === 'ADMIN'));
      setQuizzes(quizzesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!formData.adminId) return setError('Please select an admin user');
    if (!formData.quizId) return setError('Please select a quiz');
    if (formData.permissions.length === 0) return setError('Please select at least one permission');
    
    setSubmitting(true);
    try {
      await usersApi.assignPermissions(formData.adminId, { quizId: formData.quizId, permissions: formData.permissions });
      const admin = admins.find((a) => a.id === formData.adminId);
      const quiz = quizzes.find((q) => q.id === formData.quizId);
      setAssignments((p) => [...p, { 
        id: Date.now(), 
        adminId: formData.adminId, 
        adminUsername: admin?.username || '', 
        quizId: formData.quizId, 
        quizTitle: quiz?.title || '', 
        permissions: formData.permissions, 
        assignedAt: new Date().toISOString() 
      }]);
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign permissions');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    if (!selectedAssignment) return;
    setSubmitting(true);
    try {
      await usersApi.revokePermissions(selectedAssignment.adminId, selectedAssignment.quizId);
      setAssignments((p) => p.filter((a) => a.id !== selectedAssignment.id));
      setShowDeleteModal(false);
      setSelectedAssignment(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke permissions');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePermission = (key: string) => {
    setFormData((p) => ({ ...p, permissions: p.permissions.includes(key) ? p.permissions.filter((k) => k !== key) : [...p.permissions, key] }));
  };

  const selectAllPermissions = () => {
    setFormData((p) => ({ ...p, permissions: PERMISSIONS.map(p => p.key) }));
  };

  const resetForm = () => { 
    setFormData({ adminId: preselectedUserId ? parseInt(preselectedUserId) : 0, quizId: 0, permissions: [] }); 
    setError(null); 
  };

  if (loading) {
    return (
      <div className="permissions-loading">
        <div className="loading-bounce">
          <span></span><span></span><span></span>
        </div>
        <p>Loading permissions...</p>
      </div>
    );
  }

  return (
    <div className="permissions-kahoot">
      {/* Hero Header */}
      <div className="permissions-hero">
        <div className="hero-bg">
          <div className="hero-shape s1"></div>
          <div className="hero-shape s2"></div>
          <div className="hero-shape s3"></div>
        </div>
        <div className="hero-content">
          <div className="hero-left">
            <div className="hero-icon-wrap">
              <BiShield size={32} />
            </div>
            <div>
              <h1>Permission Control</h1>
              <p>Manage who can do what with your quizzes</p>
            </div>
          </div>
          <button className="hero-btn" onClick={() => { resetForm(); setShowCreateModal(true); }}>
            <BiPlus size={22} />
            <span>Assign Access</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <BiErrorCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)}><BiX size={20} /></button>
        </div>
      )}

      {/* Permission Types Grid */}
      <div className="permissions-section">
        <h2 className="section-title">
          <BiShield className="title-icon-svg" />
          Available Permissions
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

      {/* Assignments Section */}
      <div className="assignments-section">
        <h2 className="section-title">
          <BiGroup className="title-icon-svg" />
          Active Assignments
        </h2>
        
        {assignments.length > 0 ? (
          <div className="assignments-list">
            {assignments.map((a, index) => {
              const colors = ['#e21b3c', '#1368ce', '#26890c', '#ffa602'];
              return (
                <div key={a.id} className="assignment-card">
                  <div className="assignment-user">
                    <div className="user-avatar" style={{ background: colors[index % 4] }}>
                      {a.adminUsername.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                      <h4>{a.adminUsername}</h4>
                      <span className="user-role">Admin User</span>
                    </div>
                  </div>
                  
                  <div className="assignment-quiz">
                    <BiBookOpen size={18} />
                    <span>{a.quizTitle}</span>
                  </div>
                  
                  <div className="assignment-permissions">
                    {a.permissions.map((p) => {
                      const perm = PERMISSIONS.find((x) => x.key === p);
                      return (
                        <span 
                          key={p} 
                          className="perm-badge"
                          style={{ background: perm?.color || '#6b7280' }}
                        >
                          {perm?.label || p}
                        </span>
                      );
                    })}
                  </div>
                  
                  <div className="assignment-date">
                    {new Date(a.assignedAt).toLocaleDateString()}
                  </div>
                  
                  <button 
                    className="revoke-btn"
                    onClick={() => { setSelectedAssignment(a); setShowDeleteModal(true); }}
                  >
                    <BiTrash size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-assignments">
            <div className="empty-icon">
              <BiShield size={48} />
            </div>
            <h3>No permissions assigned yet</h3>
            <p>Start by assigning quiz access to your admin users</p>
            <button className="empty-cta" onClick={() => { resetForm(); setShowCreateModal(true); }}>
              <BiPlus size={20} /> Assign First Permission
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay-kahoot" onClick={() => setShowCreateModal(false)}>
          <div className="modal-kahoot" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-kahoot purple">
              <div className="modal-title-wrap">
                <BiShield size={24} />
                <h2>Assign Permissions</h2>
              </div>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                <BiX size={24} />
              </button>
            </div>
            
            <div className="modal-body-kahoot">
              <div className="form-group-kahoot">
                <label>
                  <BiUser size={18} />
                  Select Admin User
                </label>
                <select 
                  value={formData.adminId} 
                  onChange={(e) => setFormData({ ...formData, adminId: parseInt(e.target.value) })}
                  className="select-kahoot"
                >
                  <option value={0}>Choose an admin...</option>
                  {admins.map((a) => <option key={a.id} value={a.id}>{a.username}</option>)}
                </select>
              </div>
              
              <div className="form-group-kahoot">
                <label>
                  <BiBookOpen size={18} />
                  Select Quiz
                </label>
                <select 
                  value={formData.quizId} 
                  onChange={(e) => setFormData({ ...formData, quizId: parseInt(e.target.value) })}
                  className="select-kahoot"
                >
                  <option value={0}>Choose a quiz...</option>
                  {quizzes.map((q) => <option key={q.id} value={q.id}>{q.title} ({q.status})</option>)}
                </select>
              </div>
              
              <div className="form-group-kahoot">
                <div className="label-row">
                  <label>
                    <BiShield size={18} />
                    Permissions
                  </label>
                  <button type="button" className="select-all-btn" onClick={selectAllPermissions}>
                    Select All
                  </button>
                </div>
                <div className="permissions-checklist">
                  {PERMISSIONS.map((p) => (
                    <label 
                      key={p.key} 
                      className={`permission-check ${formData.permissions.includes(p.key) ? 'checked' : ''}`}
                      style={{ '--perm-color': p.color } as React.CSSProperties}
                    >
                      <input 
                        type="checkbox" 
                        checked={formData.permissions.includes(p.key)} 
                        onChange={() => togglePermission(p.key)} 
                      />
                      <div className="check-icon" style={{ background: p.color }}>
                        {p.icon}
                      </div>
                      <div className="check-info">
                        <span className="check-label">{p.label}</span>
                        <span className="check-desc">{p.description}</span>
                      </div>
                      {formData.permissions.includes(p.key) && (
                        <BiCheckCircle size={22} className="check-mark" />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="modal-footer-kahoot">
              <button className="btn-cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="btn-confirm purple" onClick={handleAssign} disabled={submitting}>
                {submitting ? 'Assigning...' : 'Assign Access'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedAssignment && (
        <div className="modal-overlay-kahoot" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-kahoot small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-kahoot red">
              <div className="modal-title-wrap">
                <BiLockOpen size={24} />
                <h2>Revoke Access</h2>
              </div>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <BiX size={24} />
              </button>
            </div>
            
            <div className="modal-body-kahoot center">
              <div className="revoke-icon">
                <BiLockOpen size={36} />
              </div>
              <p>
                Remove <strong>{selectedAssignment.adminUsername}</strong>'s access to <strong>{selectedAssignment.quizTitle}</strong>?
              </p>
              <span className="revoke-warning">This action cannot be undone</span>
            </div>
            
            <div className="modal-footer-kahoot">
              <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>Keep Access</button>
              <button className="btn-confirm red" onClick={handleRevoke} disabled={submitting}>
                {submitting ? 'Revoking...' : 'Revoke Access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
