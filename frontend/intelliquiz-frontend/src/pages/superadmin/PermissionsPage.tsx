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
} from 'react-icons/bi';
import './PermissionsPage.css';

interface Permission { key: string; label: string; description: string; icon: React.ReactNode; color: string; }

const PERMISSIONS: Permission[] = [
  { key: 'CAN_VIEW_DETAILS', label: 'View Details', description: 'Read-only access to quiz configuration', icon: <BiSearch size={22} />, color: '#7a1733' },
  { key: 'CAN_EDIT_CONTENT', label: 'Edit Content', description: 'Create, update, and delete questions', icon: <BiEdit size={22} />, color: '#7a1733' },
  { key: 'CAN_MANAGE_TEAMS', label: 'Manage Teams', description: 'Register teams and generate access codes', icon: <BiGroup size={22} />, color: '#c9a84c' },
  { key: 'CAN_HOST_GAME', label: 'Host Game', description: 'Access live session controls and proctor PIN', icon: <BiJoystick size={22} />, color: '#7a1733' },
];

export default function PermissionsPage() {
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
              <p>Manage capabilities and admin roles in your system</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Independence Info */}
      <div className="info-section">
        <div className="perm-info-card">
          <div className="perm-info-icon"><BiBookOpen size={36} /></div>
          <div>
            <h2 className="perm-info-title">Independent Quiz Ownership</h2>
            <p className="perm-info-text">
              Each Admin automatically owns the quizzes they create. No assignment from Super Admin needed!
              Admins have full rights to manage their own quizzes, question banks, and teams independently.
            </p>
          </div>
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
              <h3 className="perm-role-name">Admin (EXAMINER)</h3>
            </div>
            <ul className="perm-role-list">
              <li><BiCheckCircle size={15} className="perm-check" /> Create and manage own quizzes</li>
              <li><BiCheckCircle size={15} className="perm-check" /> Full rights to own question bank</li>
              <li><BiCheckCircle size={15} className="perm-check" /> Register teams for own quizzes</li>
              <li><BiCheckCircle size={15} className="perm-check" /> Host live quiz sessions</li>
              <li><BiXCircle size={15} className="perm-x" /> Cannot access other admins' quizzes</li>
            </ul>
          </div>

          {/* Super Admin Card */}
          <div className="perm-role-card">
            <div className="perm-role-header">
              <div className="perm-role-icon perm-role-icon--gold"><BiKey size={20} /></div>
              <h3 className="perm-role-name">Super Admin</h3>
            </div>
            <ul className="perm-role-list">
              <li><BiSearch size={15} className="perm-check" /> View all quizzes (read-only)</li>
              <li><BiGroup size={15} className="perm-check" /> Create and manage admin accounts</li>
              <li><BiShield size={15} className="perm-check" /> Control permission levels</li>
              <li><BiData size={15} className="perm-check" /> Manage system backups</li>
              <li><BiXCircle size={15} className="perm-x" /> Does not create quizzes</li>
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
        <h3 className="perm-keypoints-title"><BiPin size={16} /> Key Points</h3>
        <ul className="perm-keypoints-list">
          <li><strong>No Manual Assignment:</strong> Admins automatically own quizzes they create — no Super Admin assignment needed.</li>
          <li><strong>Complete Independence:</strong> Each admin manages their own quiz lifecycle, teams, and question bank independently.</li>
          <li><strong>Super Admin Oversight:</strong> Super Admin can view all quizzes for monitoring purposes (read-only access).</li>
          <li><strong>One-Time Proctor Access:</strong> Proctor PINs expire after quiz completion to prevent reuse.</li>
          <li><strong>Secure by Default:</strong> Fine-grained role-based access control at both UI and API layers.</li>
        </ul>
      </div>
    </div>
  );
}
