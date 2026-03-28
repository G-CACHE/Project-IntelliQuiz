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
  { key: 'CAN_VIEW_DETAILS', label: 'View Details', description: 'Read-only access to quiz configuration', icon: <BiSearch size={22} />, color: '#8f1f42' },
  { key: 'CAN_EDIT_CONTENT', label: 'Edit Content', description: 'Create, update, and delete questions', icon: <BiEdit size={22} />, color: '#7a1733' },
  { key: 'CAN_MANAGE_TEAMS', label: 'Manage Teams', description: 'Register teams and generate access codes', icon: <BiGroup size={22} />, color: '#d4a017' },
  { key: 'CAN_HOST_GAME', label: 'Host Game', description: 'Access live session controls and proctor PIN', icon: <BiJoystick size={22} />, color: '#6f4e57' },
];

export default function PermissionsPage() {
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
              <p>Manage capabilities and admin roles in your system</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Independence Info */}
      <div className="info-section" style={{ padding: '40px 20px', background: 'linear-gradient(135deg, #fff8ea 0%, #fff2dd 100%)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid #e7d8dc', boxShadow: '0 8px 22px rgba(95,16,39,0.08)' }}>
            <div style={{ color: '#5f1027', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BiBookOpen size={40} /></div>
            <div>
              <h2 style={{ margin: '0 0 8px 0', color: '#5f1027', fontSize: '20px', fontWeight: '700' }}>Independent Quiz Ownership</h2>
              <p style={{ margin: 0, color: '#5d3a43', fontSize: '15px', lineHeight: '1.6' }}>
                Each Admin automatically owns the quizzes they create. No assignment from Super Admin needed!  
                Admins have full rights to manage their own quizzes, question banks, and teams independently.
              </p>
            </div>
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
      <div className="how-it-works-section" style={{ padding: '60px 20px', borderTop: '1px solid #e7d8dc' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', color: '#5f1027', fontSize: '24px', fontWeight: '700', marginBottom: '40px' }}>How Role-Based Access Works</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* Admin Card */}
            <div style={{ padding: '24px', background: 'linear-gradient(180deg, #fff 0%, #fff8ea 100%)', borderRadius: '8px', border: '1px solid #e7d8dc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f6d5df', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5f1027' }}><BiUser size={20} /></div>
                <h3 style={{ margin: 0, color: '#5f1027', fontSize: '16px', fontWeight: '700' }}>Admin (EXAMINER)</h3>
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#5d3a43', fontSize: '14px', lineHeight: '1.8' }}>
                <li><BiCheckCircle size={16} style={{ verticalAlign: 'middle' }} /> Create and manage own quizzes</li>
                <li><BiCheckCircle size={16} style={{ verticalAlign: 'middle' }} /> Full rights to own question bank</li>
                <li><BiCheckCircle size={16} style={{ verticalAlign: 'middle' }} /> Register teams for own quizzes</li>
                <li><BiCheckCircle size={16} style={{ verticalAlign: 'middle' }} /> Host live quiz sessions</li>
                <li><BiXCircle size={16} style={{ verticalAlign: 'middle' }} /> Cannot access other admins' quizzes</li>
              </ul>
            </div>

            {/* Super Admin Card */}
            <div style={{ padding: '24px', background: 'linear-gradient(180deg, #fff 0%, #fff8ea 100%)', borderRadius: '8px', border: '1px solid #e7d8dc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#efe7e9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5f1027' }}><BiKey size={20} /></div>
                <h3 style={{ margin: 0, color: '#5f1027', fontSize: '16px', fontWeight: '700' }}>Super Admin</h3>
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#5d3a43', fontSize: '14px', lineHeight: '1.8', }}>
                <li><BiSearch size={16} style={{ verticalAlign: 'middle' }} /> View all quizzes (read-only)</li>
                <li><BiGroup size={16} style={{ verticalAlign: 'middle' }} /> Create and manage admin accounts</li>
                <li><BiShield size={16} style={{ verticalAlign: 'middle' }} /> Control permission levels</li>
                <li><BiData size={16} style={{ verticalAlign: 'middle' }} /> Manage system backups</li>
                <li><BiXCircle size={16} style={{ verticalAlign: 'middle' }} /> Does not create quizzes</li>
              </ul>
            </div>

            {/* Participant Card */}
            <div style={{ padding: '24px', background: 'linear-gradient(180deg, #fff 0%, #fff8ea 100%)', borderRadius: '8px', border: '1px solid #e7d8dc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#fff1c8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5f1027' }}><BiJoystick size={20} /></div>
                <h3 style={{ margin: 0, color: '#5f1027', fontSize: '16px', fontWeight: '700' }}>Participant</h3>
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#5d3a43', fontSize: '14px', lineHeight: '1.8' }}>
                <li><BiEdit size={16} style={{ verticalAlign: 'middle' }} /> Answer quiz questions</li>
                <li><BiGroup size={16} style={{ verticalAlign: 'middle' }} /> Join teams to participate</li>
                <li><BiBookOpen size={16} style={{ verticalAlign: 'middle' }} /> View live scoreboard</li>
                <li><BiXCircle size={16} style={{ verticalAlign: 'middle' }} /> No creation or management rights</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="additional-info-section" style={{ padding: '40px 20px', background: '#fff8ea', borderTop: '1px solid #e7d8dc' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h3 style={{ color: '#5f1027', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><BiPin size={18} /> Key Points:</h3>
          <ul style={{ color: '#5d3a43', lineHeight: '1.8' }}>
            <li><strong>No Manual Assignment:</strong> Admins automatically own quizzes they create — no Super Admin assignment needed.</li>
            <li><strong>Complete Independence:</strong> Each admin manages their own quiz lifecycle, teams, and question bank independently.</li>
            <li><strong>Super Admin Oversight:</strong> Super Admin can view all quizzes for monitoring purposes (read-only access).</li>
            <li><strong>One-Time Proctor Access:</strong> Proctor PINs expire after quiz completion to prevent reuse.</li>
            <li><strong>Secure by Default:</strong> Fine-grained role-based access control at both UI and API layers.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
