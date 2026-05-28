import { useState } from 'react';
import {
  Home, Rocket, RefreshCw, PenLine, HelpCircle, Users, Gamepad2,
  Zap, ShieldCheck, Trophy, Lock, Wrench,
  ChevronDown, ChevronUp, ChevronRight,
  Lightbulb, AlertTriangle, Info, AlertCircle,
  CheckCircle2, XCircle, Search, ArrowLeft, ArrowRight,
  Key, ClipboardList, ShieldAlert, BarChart3,
  PlayCircle, PauseCircle, SkipForward, Eye, LogIn,
  Layers, FileQuestion, Clock, Database, GraduationCap,
  Globe, Cpu, MonitorCheck,
} from 'lucide-react';
import '../../styles/admin.css';
import './UserManualPage.css';

// ─── Types ────────────────────────────────────────────────────────────────────
interface StepItem { step: number; title: string; desc: string; }
interface Section  { id: string; icon: React.ReactNode; label: string; color: string; }

// ─── Sidebar sections ─────────────────────────────────────────────────────────
const SECTIONS: Section[] = [
  { id: 'overview',        icon: <Home size={16} />,        label: 'Overview',             color: '#880015' },
  { id: 'getting-started', icon: <Rocket size={16} />,      label: 'Getting Started',      color: '#059669' },
  { id: 'quiz-lifecycle',  icon: <RefreshCw size={16} />,   label: 'Quiz Lifecycle',       color: '#3b82f6' },
  { id: 'create-quiz',     icon: <PenLine size={16} />,     label: 'Creating a Quiz',      color: '#8b5cf6' },
  { id: 'questions',       icon: <HelpCircle size={16} />,  label: 'Managing Questions',   color: '#f97316' },
  { id: 'teams',           icon: <Users size={16} />,       label: 'Teams & Access Codes', color: '#0d9488' },
  { id: 'hosting',         icon: <Gamepad2 size={16} />,    label: 'Hosting a Game',       color: '#dc2626' },
  { id: 'game-flow',       icon: <Zap size={16} />,         label: 'Live Game Flow',       color: '#d97706' },
  { id: 'proctor',         icon: <ShieldCheck size={16} />, label: 'Proctor Dashboard',    color: '#6366f1' },
  { id: 'class-mode',      icon: <GraduationCap size={16} />, label: 'Class Mode',         color: '#0891b2' },
  { id: 'scoreboard',      icon: <Trophy size={16} />,      label: 'Scoreboard & Results', color: '#ca8a04' },
  { id: 'security',        icon: <Lock size={16} />,        label: 'Security & Rules',     color: '#be123c' },
  { id: 'troubleshoot',    icon: <Wrench size={16} />,      label: 'Troubleshooting',      color: '#64748b' },
];

// ─── Reusable primitives ──────────────────────────────────────────────────────
function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="um-section-header">
      <div className="um-section-header-icon">{icon}</div>
      <div>
        <h2 className="um-section-h2">{title}</h2>
        {subtitle && <p className="um-section-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}

function Callout({ type, children }: { type: 'tip' | 'warning' | 'info' | 'important'; children: React.ReactNode }) {
  const cfg = {
    tip:       { icon: <Lightbulb size={15} />,     label: 'Tip',       cls: 'um-callout-tip' },
    warning:   { icon: <AlertTriangle size={15} />, label: 'Warning',   cls: 'um-callout-warning' },
    info:      { icon: <Info size={15} />,          label: 'Note',      cls: 'um-callout-info' },
    important: { icon: <AlertCircle size={15} />,   label: 'Important', cls: 'um-callout-important' },
  }[type];
  return (
    <div className={`um-callout ${cfg.cls}`}>
      <span className="um-callout-icon">{cfg.icon}</span>
      <p className="um-callout-text"><strong>{cfg.label}: </strong>{children}</p>
    </div>
  );
}

function StatusBadge({ label, color }: { label: string; color: string }) {
  return <span className="um-status-badge" style={{ background: color, color: '#fff' }}>{label}</span>;
}

function StepCard({ step, title, desc }: StepItem) {
  return (
    <div className="um-step-card">
      <div className="um-step-num">{step}</div>
      <div className="um-step-body">
        <div className="um-step-title">{title}</div>
        <div className="um-step-desc">{desc}</div>
      </div>
    </div>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="um-subsection">
      <h3 className="um-h3">{title}</h3>
      {children}
    </div>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="um-table-wrap">
      <table className="um-table">
        <thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function OptionCard({ icon, title, desc, note }: { icon: React.ReactNode; title: string; desc: string; note?: string }) {
  return (
    <div className="um-option-card">
      <div className="um-option-card-icon">{icon}</div>
      <div className="um-option-card-title">{title}</div>
      <div className="um-option-card-desc">{desc}</div>
      {note && <div className="um-option-card-note">{note}</div>}
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`um-faq-item ${open ? 'open' : ''}`}>
      <button className="um-faq-q" onClick={() => setOpen(!open)}>
        <span>{question}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && <div className="um-faq-a">{answer}</div>}
    </div>
  );
}

// ─── SECTION: Overview ───────────────────────────────────────────────────────
function OverviewSection({ onNavigate }: { onNavigate: (id: string) => void }) {
  const cards = [
    { icon: <PenLine size={22} />, color: '#880015', title: 'Create', desc: 'Build quizzes with multiple question types, difficulty levels, and per-question time limits.' },
    { icon: <Gamepad2 size={22} />, color: '#059669', title: 'Host', desc: 'Launch live sessions, control question pacing, and monitor all participants in real time.' },
    { icon: <BarChart3 size={22} />, color: '#3b82f6', title: 'Analyze', desc: 'View live scoreboards, violation logs, and final results after every session.' },
  ];
  const quickLinks = [
    { label: 'New to IntelliQuiz?', id: 'getting-started', cta: 'Start here' },
    { label: 'Ready to create a quiz?', id: 'create-quiz', cta: 'Create Quiz' },
    { label: 'About to go live?', id: 'hosting', cta: 'Host a Game' },
    { label: 'Something not working?', id: 'troubleshoot', cta: 'Troubleshoot' },
  ];
  return (
    <div className="um-section">
      <SectionHeader icon={<Home size={24} />} title="Welcome to IntelliQuiz" subtitle="Your complete guide to running effective quizzes" />

      <div className="um-intro-block">
        <p className="um-body">IntelliQuiz is a real-time quiz platform designed for educators, trainers, and event hosts. As an Admin, you have full control over quiz creation, team management, live game hosting, and result monitoring — all from one unified workspace. This guide walks you through every feature so you can get the most out of the platform.</p>
      </div>

      <SubSection title="Core Capabilities">
        <div className="um-card-row">
          {cards.map(c => (
            <div key={c.title} className="um-feature-card" style={{ '--accent': c.color } as React.CSSProperties}>
              <div className="um-feature-card-icon" style={{ color: c.color, background: c.color + '15' }}>{c.icon}</div>
              <div className="um-feature-card-title">{c.title}</div>
              <div className="um-feature-card-desc">{c.desc}</div>
            </div>
          ))}
        </div>
      </SubSection>

      <SubSection title="Quick Navigation">
        <div className="um-quicknav-box">
          <p className="um-quicknav-label">Jump to a topic</p>
          <div className="um-quicknav-grid">
            {quickLinks.map(l => (
              <button key={l.id} className="um-quicknav-item" onClick={() => onNavigate(l.id)}>
                <span className="um-quicknav-text">{l.label}</span>
                <span className="um-quicknav-cta">{l.cta} <ChevronRight size={13} /></span>
              </button>
            ))}
          </div>
        </div>
      </SubSection>
    </div>
  );
}

// ─── SECTION: Getting Started ────────────────────────────────────────────────
function GettingStartedSection() {
  return (
    <div className="um-section">
      <SectionHeader icon={<Rocket size={24} />} title="Getting Started" subtitle="Everything you need before your first quiz" />

      <div className="um-intro-block">
        <p className="um-body">This section walks you through the basics of your admin account, how to navigate the platform, and the recommended steps to launch your very first quiz session.</p>
      </div>

      <SubSection title="Your Admin Account">
        <p className="um-body">You are logged in as an <strong>Admin</strong>. Your account gives you access to:</p>
        <ul className="um-list">
          <li>Creating and managing your own quizzes</li>
          <li>Registering teams and generating unique access codes</li>
          <li>Hosting live quiz sessions in real time</li>
          <li>Viewing scoreboards and violation reports</li>
        </ul>
        <Callout type="info">Super Admins have additional access to user management, system backups, and all quizzes across the platform.</Callout>
      </SubSection>

      <SubSection title="Platform Navigation">
        <p className="um-body">Use the top navigation bar to move between the main areas of IntelliQuiz:</p>
        <DataTable
          headers={['Page', 'What you can do']}
          rows={[
            ['Dashboard', 'See quiz stats at a glance, quick-create a quiz, and view recent activity'],
            ['My Quizzes', 'Full list of your quizzes with search, filter, edit, delete, and status controls'],
            ['User Manual', 'This guide — step-by-step help for every feature in the platform'],
          ]}
        />
      </SubSection>

      <SubSection title="Recommended First Steps">
        <p className="um-body">Follow these five steps to go from zero to a live quiz session:</p>
        <div className="um-steps">
          <StepCard step={1} title="Create a Quiz" desc="Go to Dashboard or My Quizzes → Create Quiz. Give it a title and choose Tournament or Class mode." />
          <StepCard step={2} title="Add Questions" desc="Open the quiz workspace → Questions tab. Add at least one question before marking it Ready." />
          <StepCard step={3} title="Register Teams" desc="In the workspace → Teams & Codes tab, register each participating team. Each gets a unique access code." />
          <StepCard step={4} title="Mark as Ready" desc="Use the Draft / Ready toggle in the workspace header. This unlocks the ability to go Live." />
          <StepCard step={5} title="Go Live" desc="Enter your Proctor PIN at the portal login to open the Host Lobby, then launch the session." />
        </div>
      </SubSection>
    </div>
  );
}

// ─── SECTION: Quiz Lifecycle ─────────────────────────────────────────────────
function QuizLifecycleSection() {
  const states = [
    { status: 'DRAFT',    color: '#64748b', icon: <PenLine size={16} />,    desc: 'Quiz is being built. Questions can be added, edited, or deleted. Teams can be registered.' },
    { status: 'READY',    color: '#2563eb', icon: <CheckCircle2 size={16} />, desc: 'Quiz is finalized and waiting to go live. No more question edits. Teams are locked in.' },
    { status: 'LIVE',     color: '#16a34a', icon: <PlayCircle size={16} />,  desc: 'Active session in progress. Participants are answering questions in real time.' },
    { status: 'ARCHIVED', color: '#92400e', icon: <Database size={16} />,    desc: 'Session ended. Results are preserved. Quiz cannot be reactivated.' },
  ];
  return (
    <div className="um-section">
      <SectionHeader icon={<RefreshCw size={24} />} title="Quiz Lifecycle" subtitle="The four states every quiz moves through" />

      <div className="um-intro-block">
        <p className="um-body">Every quiz in IntelliQuiz follows a predictable lifecycle. Understanding these states is essential to running a smooth session and knowing what actions are available at each stage.</p>
      </div>

      <SubSection title="Lifecycle States">
        <div className="um-lifecycle">
          {states.map(({ status, color, icon, desc }, i) => (
            <div key={status} className="um-lifecycle-row">
              <div className="um-lifecycle-badge" style={{ background: color, color: '#fff' }}>
                {icon}<span>{status}</span>
              </div>
              <div className="um-lifecycle-desc">{desc}</div>
              {i < states.length - 1 && (
                <div className="um-lifecycle-arrow"><ChevronDown size={18} color="#d1d5db" /></div>
              )}
            </div>
          ))}
        </div>
      </SubSection>

      <SubSection title="Status Transition Rules">
        <DataTable
          headers={['From', 'To', 'Requirement']}
          rows={[
            [<StatusBadge label="DRAFT" color="#64748b" />, <StatusBadge label="READY" color="#2563eb" />, 'At least 1 team registered (Restricted) OR any quiz (Public)'],
            [<StatusBadge label="READY" color="#2563eb" />, <StatusBadge label="DRAFT" color="#64748b" />, 'Always allowed — reverts to editing mode'],
            [<StatusBadge label="READY" color="#2563eb" />, <StatusBadge label="LIVE" color="#16a34a" />,  'Host enters Proctor PIN and launches from the Host Lobby'],
            [<StatusBadge label="LIVE" color="#16a34a" />,  <StatusBadge label="ARCHIVED" color="#92400e" />, 'Host ends the quiz session (automatic after final results)'],
          ]}
        />
        <Callout type="important">Only one quiz can be LIVE at a time per admin account. End the current session before starting another.</Callout>
      </SubSection>
    </div>
  );
}

// ─── SECTION: Create Quiz ────────────────────────────────────────────────────
function CreateQuizSection() {
  return (
    <div className="um-section">
      <SectionHeader icon={<PenLine size={24} />} title="Creating a Quiz" subtitle="Step-by-step guide to setting up your quiz" />

      <div className="um-intro-block">
        <p className="um-body">Creating a quiz is the first step in your IntelliQuiz workflow. You'll define the quiz title, configure access and game modes, and then populate it with questions. Follow the steps below to get started.</p>
      </div>

      <SubSection title="How to Create a Quiz">
        <div className="um-steps">
          <StepCard step={1} title='Click "Create Quiz"' desc="From the Dashboard or My Quizzes page, click the Create Quiz button." />
          <StepCard step={2} title="Enter Basics (Step 1 of 2)" desc="Type a Quiz Title (required, max 200 characters) and an optional Description. Press Next or hit Enter." />
          <StepCard step={3} title="Configure Settings (Step 2 of 2)" desc="Choose Access Mode, Quiz Mode, and optional settings. Then click Create Quiz." />
        </div>
      </SubSection>

      <SubSection title="Access Mode">
        <div className="um-option-grid">
          <OptionCard
            icon={<Lock size={20} />}
            title="Restricted Mode"
            desc="Only pre-registered teams with a unique access code can join. Best for controlled classroom or competition settings."
            note="Requires at least 1 registered team before going Ready."
          />
          <OptionCard
            icon={<Globe size={20} />}
            title="Public Mode"
            desc="Anyone with the quiz code can join by entering their team name. Best for open events or large audiences."
            note="No team pre-registration needed. Quiz code is shown on the card."
          />
        </div>
      </SubSection>

      <SubSection title="Quiz Mode">
        <div className="um-option-grid">
          <OptionCard
            icon={<Trophy size={20} />}
            title="Tournament Mode"
            desc="The host controls the pace. All participants see the same question at the same time. The host manually advances to the next question."
            note="Best for competitive events, live shows, and classroom games."
          />
          <OptionCard
            icon={<GraduationCap size={20} />}
            title="Class Mode"
            desc="Participants navigate questions at their own pace within a global time limit. Questions can be randomized per participant."
            note="Requires a time limit (minimum 1 minute). Best for exams and self-paced assessments."
          />
        </div>
      </SubSection>

      <SubSection title="Editing a Quiz">
        <p className="um-body">You can edit a quiz's title, description, access mode, and navigation mode only while it is in <StatusBadge label="DRAFT" color="#64748b" /> status.</p>
        <ul className="um-list">
          <li>From <strong>My Quizzes</strong>: click the edit (pencil) icon on the quiz card.</li>
          <li>From the <strong>Quiz Workspace</strong>: go to the Configuration tab and update settings there.</li>
        </ul>
        <Callout type="warning">Once a quiz is marked Ready or goes Live, settings are locked. Revert to Draft to make changes.</Callout>
      </SubSection>

      <SubSection title="Deleting a Quiz">
        <p className="um-body">Delete a quiz from the My Quizzes page using the trash icon. Deletion is permanent and removes all questions and session data for that quiz.</p>
        <Callout type="important">You cannot delete a quiz while it is LIVE. End the session first.</Callout>
        <Callout type="tip">Deleting a quiz does NOT remove questions from the Question Bank. Bank items are preserved.</Callout>
      </SubSection>
    </div>
  );
}

// ─── SECTION: Questions ──────────────────────────────────────────────────────
function QuestionsSection() {
  return (
    <div className="um-section">
      <SectionHeader icon={<HelpCircle size={24} />} title="Managing Questions" subtitle="Adding, editing, and organizing your question set" />

      <div className="um-intro-block">
        <p className="um-body">Questions are the heart of every quiz. IntelliQuiz supports multiple question types and gives you full control over difficulty levels, point values, and time limits. This section covers everything you need to manage your question set effectively.</p>
      </div>

      <Callout type="important">Questions can only be added, edited, or deleted while the quiz is in DRAFT status.</Callout>

      <SubSection title="Accessing the Questions Editor">
        <p className="um-body">From the Quiz Workspace, click the <strong>Questions</strong> tab to open the editor. You can also reach it from the My Quizzes page by clicking the file icon on a quiz card.</p>
      </SubSection>

      <SubSection title="Question Types">
        <div className="um-option-grid um-option-grid-3">
          <OptionCard icon={<Layers size={20} />} title="Multiple Choice" desc="2–8 answer options (A–H). You select one correct answer. Participants pick one option." />
          <OptionCard icon={<CheckCircle2 size={20} />} title="True / False" desc="Two options: True and False. You select which is correct. Simple and fast to create." />
          <OptionCard icon={<FileQuestion size={20} />} title="Identification" desc="Participants type a text answer. You provide one or more accepted answers (one per line). Optional case-sensitivity toggle." />
        </div>
      </SubSection>

      <SubSection title="Question Fields">
        <DataTable
          headers={['Field', 'Description', 'Default']}
          rows={[
            ['Question Text', 'The question shown to participants (required)', '—'],
            ['Type', 'Multiple Choice, True/False, or Identification', 'Multiple Choice'],
            ['Difficulty', 'Easy, Medium, Hard, or Tie-Breaker', 'Medium'],
            ['Points', 'Score awarded for a correct answer', '10'],
            ['Time Limit', 'Seconds allowed per question (Tournament mode)', '30s'],
            ['Correct Answer', 'The answer key used for grading', '—'],
          ]}
        />
      </SubSection>

      <SubSection title="Importing from Question Bank">
        <p className="um-body">Click <strong>Import from Bank</strong> in the Questions editor to reuse questions from previous quizzes. Search by keyword or filter by quiz, then select multiple questions to import at once.</p>
        <Callout type="tip">The Question Bank is shared across all your quizzes. Deleting a quiz does not remove its questions from the bank.</Callout>
      </SubSection>

      <SubSection title="Difficulty Filter">
        <p className="um-body">Use the difficulty filter in the sidebar to view questions by level: All, Easy, Medium, Hard, or Tie-Breaker. This helps you balance your question set before going live.</p>
      </SubSection>
    </div>
  );
}

// ─── SECTION: Teams ──────────────────────────────────────────────────────────
function TeamsSection() {
  return (
    <div className="um-section">
      <SectionHeader icon={<Users size={24} />} title="Teams & Access Codes" subtitle="Registering participants and distributing access" />

      <div className="um-intro-block">
        <p className="um-body">Teams are how participants join your quiz. In Restricted mode, you pre-register teams and share unique access codes. In Public mode, anyone with the quiz code can join. This section covers team registration, code management, and team rules.</p>
      </div>

      <SubSection title="Registering a Team (Restricted Mode)">
        <div className="um-steps">
          <StepCard step={1} title="Open the Quiz Workspace" desc='Navigate to My Quizzes → click a quiz card → go to the "Teams & Codes" tab.' />
          <StepCard step={2} title="Enter Team Name" desc="Type the team name (minimum 2 characters, must contain at least one letter or number)." />
          <StepCard step={3} title="Add Members (Optional)" desc="Type each member's name and press Enter or Tab to add them as tags. Members are stored with the team." />
          <StepCard step={4} title='Click "Register Team"' desc="The team is created and a unique access code is automatically generated." />
          <StepCard step={5} title="Share the Access Code" desc="Copy the code using the copy icon and share it with the team. They use it to join the quiz." />
        </div>
      </SubSection>

      <SubSection title="Access Codes Explained">
        <div className="um-option-grid um-option-grid-3">
          <OptionCard icon={<Key size={20} />} title="Team Access Code" desc="Unique per team. Used by participants to join a Restricted quiz. Shown on the Teams & Codes tab. Copy and share before the session." />
          <OptionCard icon={<ClipboardList size={20} />} title="Quiz Code (Public Mode)" desc="A single code for the entire quiz. Shown on the quiz card in My Quizzes. Anyone with this code can join by entering their team name." />
          <OptionCard icon={<ShieldCheck size={20} />} title="Proctor PIN" desc="A special PIN that gives access to the Host Lobby and Proctor Dashboard. Shown on every quiz card. Share only with trusted co-hosts or proctors." />
        </div>
      </SubSection>

      <SubSection title="Deleting a Team">
        <p className="um-body">Click the trash icon next to a team in the Teams & Codes tab. A confirmation modal will appear. Deleting a team removes their access code and all associated score data.</p>
        <Callout type="warning">You cannot delete a team while the quiz is LIVE. End the session first.</Callout>
      </SubSection>

      <SubSection title="Team Name Rules">
        <div className="um-rules-grid">
          <div className="um-rule-item um-rule-ok"><CheckCircle2 size={15} /><span>Minimum 2 characters</span></div>
          <div className="um-rule-item um-rule-ok"><CheckCircle2 size={15} /><span>Must contain at least one letter or number</span></div>
          <div className="um-rule-item um-rule-no"><XCircle size={15} /><span>Cannot be all symbols or spaces</span></div>
          <div className="um-rule-item um-rule-no"><XCircle size={15} /><span>Duplicate team names are not allowed in the same quiz</span></div>
        </div>
      </SubSection>
    </div>
  );
}

// ─── SECTION: Hosting ────────────────────────────────────────────────────────
function HostingSection() {
  const checklist = [
    'Quiz has at least one question',
    'Quiz is in READY status',
    'Teams are registered (Restricted) or quiz code is shared (Public)',
    'Proctor PIN is noted and ready to share with co-hosts',
    'Participants are ready on their devices',
  ];
  return (
    <div className="um-section">
      <SectionHeader icon={<Gamepad2 size={24} />} title="Hosting a Game" subtitle="How to launch and manage a live quiz session" />

      <div className="um-intro-block">
        <p className="um-body">Hosting a game is where everything comes together. Before launching, make sure your quiz is ready and your teams are prepared. This section covers the pre-launch checklist, how to open the host lobby, and the controls available during a live session.</p>
      </div>

      <SubSection title="Pre-Launch Checklist">
        <div className="um-checklist">
          {checklist.map(item => (
            <div key={item} className="um-checklist-item">
              <CheckCircle2 size={16} className="um-checklist-icon" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </SubSection>

      <SubSection title="Launching the Host Lobby">
        <div className="um-steps">
          <StepCard step={1} title="Go to the Portal Login" desc='Navigate to the main login page. Click "Enter as Host / Proctor".' />
          <StepCard step={2} title="Enter Your Proctor PIN" desc="Type the Proctor PIN shown on your quiz card. This authenticates you as the host." />
          <StepCard step={3} title="Host Lobby Opens" desc="You see the waiting room. Teams joining will appear here in real time as they connect." />
          <StepCard step={4} title="Customize the Lobby (Optional)" desc="Use the palette icon to change the lobby background theme. Use the mute button to toggle lobby music." />
          <StepCard step={5} title="Launch the Session" desc='Click "Quick Actions" → "Launch Game Session" once enough teams have joined.' />
        </div>
        <Callout type="tip">You can open the Proctor Dashboard in a separate tab from the lobby for monitoring while the game runs.</Callout>
      </SubSection>

      <SubSection title="Host Controls During the Session">
        <DataTable
          headers={['Button', 'What it does', 'When available']}
          rows={[
            [<span className="um-ctrl-btn"><PauseCircle size={14} /> Pause Quiz</span>, 'Freezes the timer for all participants', 'During a question'],
            [<span className="um-ctrl-btn"><PlayCircle size={14} /> Resume Quiz</span>, 'Resumes the timer from where it paused', 'While paused'],
            [<span className="um-ctrl-btn"><Eye size={14} /> View Leaderboard</span>, 'Shows current rankings to all participants', 'After answer reveal'],
            [<span className="um-ctrl-btn"><SkipForward size={14} /> Next Question</span>, 'Advances to the next question', 'After leaderboard / scoreboard'],
            [<span className="um-ctrl-btn"><Trophy size={14} /> View Result</span>, 'Shows final results (last question only)', 'After last answer reveal'],
            [<span className="um-ctrl-btn"><XCircle size={14} /> End Quiz</span>, 'Ends the session and shows final scoreboard', 'During scoreboard phase'],
          ]}
        />
      </SubSection>

      <SubSection title="Ending the Session">
        <p className="um-body">After the last question's answer is revealed, click <strong>View Result</strong> to show the final scoreboard. The quiz automatically moves to ARCHIVED status. Click <strong>Go Home</strong> to return to the portal.</p>
        <Callout type="info">Archived quizzes retain all scores and violation logs. View them in the Quiz Workspace → Reports tab.</Callout>
      </SubSection>
    </div>
  );
}

// ─── SECTION: Game Flow ──────────────────────────────────────────────────────
function GameFlowSection() {
  const phases = [
    { phase: 'LOBBY',         icon: <LogIn size={16} />,       color: '#64748b', title: 'Lobby / Waiting Room',    desc: 'Teams join using their access codes. The host sees them appear in real time. Music plays. Host launches when ready.' },
    { phase: 'BUFFER',        icon: <Clock size={16} />,       color: '#8b5cf6', title: 'Buffer Countdown',         desc: 'A short countdown before each question. A round announcement modal appears if rounds are configured. Automatically transitions.' },
    { phase: 'QUESTION',      icon: <HelpCircle size={16} />,  color: '#2563eb', title: 'Question Active',          desc: 'The question is displayed to all participants simultaneously. The per-question timer counts down. Participants submit answers.' },
    { phase: 'GRADING',       icon: <Cpu size={16} />,         color: '#d97706', title: 'Grading',                  desc: 'Timer has expired. The system grades all submitted answers. Brief automatic phase.' },
    { phase: 'ANSWER_REVEAL', icon: <CheckCircle2 size={16} />,color: '#059669', title: 'Answer Reveal',            desc: 'The correct answer is shown. Participants see if they were right. Host chooses to view leaderboard or go to next question.' },
    { phase: 'SCOREBOARD',    icon: <BarChart3 size={16} />,   color: '#0891b2', title: 'Scoreboard / Leaderboard', desc: 'Current rankings are shown to all. Host advances to the next question or ends the quiz.' },
    { phase: 'FINAL_RESULTS', icon: <Trophy size={16} />,      color: '#ca8a04', title: 'Final Results',            desc: 'All questions answered. Final scoreboard displayed. Quiz moves to ARCHIVED. Host clicks Go Home.' },
  ];
  return (
    <div className="um-section">
      <SectionHeader icon={<Zap size={24} />} title="Live Game Flow" subtitle="Every phase of a Tournament mode session" />

      <div className="um-intro-block">
        <p className="um-body">In <strong>Tournament Mode</strong>, the host controls transitions between phases. Understanding this flow helps you manage pacing and keep participants engaged throughout the session.</p>
      </div>

      <SubSection title="Session Phases">
        <div className="um-timeline">
          {phases.map(({ phase, icon, color, title, desc }, i) => (
            <div key={phase} className="um-timeline-item">
              <div className="um-timeline-left">
                <div className="um-timeline-dot" style={{ background: color, boxShadow: `0 0 0 4px ${color}20` }}>{icon}</div>
                {i < phases.length - 1 && <div className="um-timeline-line" />}
              </div>
              <div className="um-timeline-content">
                <span className="um-timeline-phase" style={{ color }}>{phase}</span>
                <div className="um-timeline-title">{title}</div>
                <div className="um-timeline-desc">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </SubSection>

      <SubSection title="What Participants See at Each Phase">
        <DataTable
          headers={['Phase', 'Participant Screen']}
          rows={[
            ['Lobby',         'Waiting room with team name and avatar. Sees other teams joining.'],
            ['Buffer',        '"Get Ready!" countdown screen.'],
            ['Question',      'Question text, answer options, and a countdown timer.'],
            ['Grading',       '"Waiting for results..." screen.'],
            ['Answer Reveal', 'Their answer highlighted (correct / incorrect) with the correct answer shown.'],
            ['Scoreboard',    'Live rankings with their position highlighted.'],
            ['Final Results', 'Final scoreboard with winner celebration.'],
          ]}
        />
      </SubSection>
    </div>
  );
}

// ─── SECTION: Proctor ────────────────────────────────────────────────────────
function ProctorSection() {
  return (
    <div className="um-section">
      <SectionHeader icon={<ShieldCheck size={24} />} title="Proctor Dashboard" subtitle="Real-time monitoring and participant control during a live session" />

      <div className="um-intro-block">
        <p className="um-body">The Proctor Dashboard is a separate monitoring panel that runs alongside the Host Game screen. Open it by clicking <strong>Monitor</strong> in the Host Game header, or by navigating to <code>/proctor/dashboard</code> with the Proctor PIN. It gives you full visibility into team behavior and security controls.</p>
      </div>

      <SubSection title="Dashboard Panels">
        <div className="um-option-grid">
          <OptionCard icon={<BarChart3 size={20} />} title="Quick Stats" desc="Shows Teams Connected, Submissions received for the current question, and Kicked Teams count — all updated in real time." />
          <OptionCard icon={<Users size={20} />} title="Active Teams" desc="List of all currently connected teams. Shows violation count per team. Includes a Kick button for each team." />
          <OptionCard icon={<Lock size={20} />} title="Security & Access" desc="Auto-Kick Threshold slider and Lock / Unlock Entry toggle. Controls who can join or rejoin the session." />
          <OptionCard icon={<ShieldAlert size={20} />} title="Violation Log" desc="Real-time log of all detected violations (tab switches, focus loss, etc.) with team name, violation type, and timestamp." />
        </div>
      </SubSection>

      <SubSection title="Kicking a Team">
        <div className="um-steps">
          <StepCard step={1} title="Find the team" desc="In the Active Teams panel, locate the team you want to remove." />
          <StepCard step={2} title='Click "Kick"' desc="A confirmation modal appears with a list of kick reasons." />
          <StepCard step={3} title="Select reason(s)" desc="Check one or more reasons: Tab Switch, Copy Attempt, Right Click, Print Screen, or Misconduct." />
          <StepCard step={4} title='Click "Kick Team"' desc="The team is immediately removed from the session. They see a kick notification with the reason." />
        </div>
        <Callout type="tip">Kicked teams can request re-entry. You will see them in the "Kicked Teams Pending Re-entry" panel. Click Approve to let them back in.</Callout>
      </SubSection>

      <SubSection title="Auto-Kick Threshold">
        <p className="um-body">The slider (1–20) sets how many violations a team can accumulate before being automatically kicked. For example, setting it to 3 means a team is auto-kicked after their 3rd tab switch or focus loss.</p>
        <Callout type="warning">Set the threshold before the quiz starts. Changes take effect immediately — teams already at the threshold may be kicked instantly.</Callout>
      </SubSection>

      <SubSection title="Lock / Unlock Entry">
        <p className="um-body">Use <strong>Lock Entry</strong> to prevent any new devices from joining the session. Previously recognized devices (by device ID) can still reconnect if they drop out. Use <strong>Unlock Entry</strong> to allow new joins again.</p>
      </SubSection>
    </div>
  );
}

// ─── SECTION: Class Mode ─────────────────────────────────────────────────────
function ClassModeSection() {
  return (
    <div className="um-section">
      <SectionHeader icon={<GraduationCap size={24} />} title="Class Mode" subtitle="Self-paced quiz sessions for exams and assessments" />

      <div className="um-intro-block">
        <p className="um-body">Class Mode is designed for exam-style sessions where participants work at their own pace. Unlike Tournament Mode, the host does not control question pacing — participants navigate freely within a global time limit. This mode is ideal for tests, homework quizzes, and self-paced learning.</p>
      </div>

      <SubSection title="Key Differences from Tournament Mode">
        <DataTable
          headers={['Feature', 'Tournament Mode', 'Class Mode']}
          rows={[
            ['Question pacing',  'Host controls',          'Participant controls'],
            ['Timer',            'Per-question countdown', 'Global session clock'],
            ['Question order',   'Fixed for all',          'Can be randomized per participant'],
            ['Answer reveal',    'After each question',    'After session ends'],
            ['Scoreboard',       'After each question',    'At session end'],
            ['Host controls',    'Full (pause, next, reveal)', 'Timer display only'],
          ]}
        />
      </SubSection>

      <SubSection title="Setting Up Class Mode">
        <div className="um-steps">
          <StepCard step={1} title="Select Class Mode" desc='When creating or editing a quiz, choose "Class" from the Quiz Mode dropdown.' />
          <StepCard step={2} title="Set a Time Limit" desc="Enter the total session duration in minutes (minimum 1 minute). This is the global clock for all participants." />
          <StepCard step={3} title="Enable Randomization (Optional)" desc='Check "Randomize question order per participant" to shuffle questions differently for each team — reduces copying.' />
          <StepCard step={4} title="Register Teams and Go Ready" desc="Same as Tournament Mode. Register teams, mark Ready, then launch via Proctor PIN." />
        </div>
      </SubSection>

      <SubSection title="During a Class Session">
        <ul className="um-list">
          <li>The global timer is shown to all participants and the host simultaneously.</li>
          <li>Participants can navigate forward and backward through questions freely.</li>
          <li>When the timer reaches zero, all answers are automatically submitted.</li>
          <li>The host sees the timer on the Host Game screen but cannot advance questions manually.</li>
          <li>The Proctor Dashboard still works for monitoring violations and managing teams.</li>
        </ul>
        <Callout type="tip">For exams, combine Class Mode with Lock Entry (in Proctor Dashboard) to prevent late joiners after the session starts.</Callout>
      </SubSection>
    </div>
  );
}

// ─── SECTION: Scoreboard ─────────────────────────────────────────────────────
function ScoreboardSection() {
  return (
    <div className="um-section">
      <SectionHeader icon={<Trophy size={24} />} title="Scoreboard & Results" subtitle="Understanding scores, rankings, and post-game reports" />

      <div className="um-intro-block">
        <p className="um-body">IntelliQuiz tracks scores automatically during every session. This section explains how scoring works, where to find the scoreboard, and how to access post-game reports for archived quizzes.</p>
      </div>

      <SubSection title="How Scoring Works">
        <div className="um-option-grid">
          <OptionCard icon={<CheckCircle2 size={20} />} title="Correct Answer" desc="Team earns the full points value set for that question (default: 10 points). Speed bonuses may apply in Tournament mode." />
          <OptionCard icon={<XCircle size={20} />} title="Wrong / No Answer" desc="Team earns 0 points for that question. There is no score deduction for wrong answers." />
        </div>
      </SubSection>

      <SubSection title="Viewing the Scoreboard">
        <ul className="um-list">
          <li><strong>During a live session:</strong> The scoreboard is shown automatically after each question's answer reveal (Tournament mode).</li>
          <li><strong>From the Quiz Workspace:</strong> Go to the Overview tab → click "View Scoreboard" to see current standings at any time.</li>
          <li><strong>After the session:</strong> Go to the Quiz Workspace → Reports tab for the final scoreboard and violation log.</li>
        </ul>
      </SubSection>

      <SubSection title="Reports Tab (Archived Quizzes)">
        <div className="um-option-grid">
          <OptionCard icon={<BarChart3 size={20} />} title="Final Scoreboard" desc="Complete ranked list of all teams with their total scores. Sorted from highest to lowest." />
          <OptionCard icon={<ShieldAlert size={20} />} title="Violation Log" desc="Full history of all detected violations during the session: team name, violation type, and exact timestamp." />
        </div>
      </SubSection>

      <SubSection title="Resetting Scores">
        <p className="um-body">You can reset all team scores for a quiz from the Teams & Codes tab. This is useful if you want to run the same quiz again with the same teams without re-registering them.</p>
        <Callout type="warning">Score reset is permanent and cannot be undone. All team scores for that quiz will be set to zero.</Callout>
      </SubSection>
    </div>
  );
}

// ─── SECTION: Security ───────────────────────────────────────────────────────
function SecuritySection() {
  return (
    <div className="um-section">
      <SectionHeader icon={<Lock size={24} />} title="Security & Rules" subtitle="How IntelliQuiz protects quiz integrity" />

      <div className="um-intro-block">
        <p className="um-body">IntelliQuiz includes built-in security features to protect quiz integrity. From secure authentication to an anti-cheat detection system, this section covers all the safeguards that keep your sessions fair and reliable.</p>
      </div>

      <SubSection title="Authentication">
        <div className="um-rules-grid">
          <div className="um-rule-item um-rule-ok"><CheckCircle2 size={15} /><span>Login uses secure HttpOnly cookies — no tokens stored in the browser.</span></div>
          <div className="um-rule-item um-rule-ok"><CheckCircle2 size={15} /><span>Sessions are verified on every page load. Expired sessions redirect to login.</span></div>
          <div className="um-rule-item um-rule-ok"><CheckCircle2 size={15} /><span>Logging out immediately invalidates your session on the server.</span></div>
          <div className="um-rule-item um-rule-ok"><CheckCircle2 size={15} /><span>Each admin only sees and manages their own quizzes.</span></div>
        </div>
      </SubSection>

      <SubSection title="Participant Anti-Cheat System">
        <DataTable
          headers={['Violation Type', 'What triggers it']}
          rows={[
            ['Tab Switch',    'Participant switches to another browser tab or window'],
            ['Focus Loss',    'Browser window loses focus (alt-tab, clicking outside)'],
            ['Copy Attempt',  'Participant tries to copy text from the quiz page'],
            ['Right Click',   'Participant right-clicks on the quiz page'],
            ['Print Screen',  'Participant presses the Print Screen key'],
          ]}
        />
        <Callout type="info">Violations are logged and visible in the Proctor Dashboard in real time. They are also saved to the Reports tab after the session ends.</Callout>
      </SubSection>

      <SubSection title="Auto-Kick Rules">
        <ul className="um-list">
          <li>The proctor sets a violation threshold (1–20) in the Proctor Dashboard.</li>
          <li>When a team's violation count reaches the threshold, they are automatically kicked.</li>
          <li>Kicked teams see a notification with the reason and can request re-entry.</li>
          <li>The proctor must manually approve re-entry requests.</li>
        </ul>
      </SubSection>

      <SubSection title="Device Identity">
        <p className="um-body">Each participant device is assigned a unique Device ID stored in the browser. This allows the system to:</p>
        <ul className="um-list">
          <li>Recognize returning devices after a disconnect or page refresh.</li>
          <li>Prevent the same device from joining as multiple teams.</li>
          <li>Allow kicked teams to reconnect only after proctor approval.</li>
          <li>Enforce Lock Entry — locked sessions block new device IDs but allow known ones to reconnect.</li>
        </ul>
      </SubSection>

      <SubSection title="Permission Levels">
        <DataTable
          headers={['Role', 'Can Do']}
          rows={[
            [<strong>Super Admin</strong>, 'Everything — manage all users, all quizzes, system backups'],
            [<strong>Admin</strong>,       'Create and manage own quizzes, register teams, host sessions'],
            [<strong>Proctor</strong>,     'Monitor live sessions, manage violations, kick / approve teams'],
            [<strong>Participant</strong>, 'Join and answer questions in a live session only'],
          ]}
        />
      </SubSection>
    </div>
  );
}

// ─── SECTION: Troubleshoot ───────────────────────────────────────────────────
function TroubleshootSection() {
  const faqs = [
    { q: 'I cannot mark my quiz as Ready.', a: 'If your quiz is in Restricted mode, you must register at least one team before it can be marked Ready. Go to the Teams & Codes tab and add a team first.' },
    { q: 'The "Mark as Ready" button is missing.', a: 'Only the quiz owner or a user with CAN_EDIT_CONTENT permission can change quiz status. Check that you are logged in with the correct account.' },
    { q: 'I cannot edit questions.', a: 'Questions can only be edited while the quiz is in DRAFT status. If the quiz is Ready or Live, revert it to Draft first using the status toggle in the workspace header.' },
    { q: 'Teams are not appearing in the Host Lobby.', a: 'Make sure: (1) The quiz is in READY or LIVE status. (2) Teams are using the correct access code. (3) The quiz code or team code has been shared correctly. (4) Check your internet connection — the lobby uses a live connection.' },
    { q: 'The connection shows OFFLINE in the Host Game screen.', a: 'Click the Reconnect button in the error banner. If the issue persists, refresh the page — your session will be restored automatically using the stored Proctor PIN.' },
    { q: 'A team was kicked by mistake.', a: "Go to the Proctor Dashboard → \"Kicked Teams Pending Re-entry\" panel → click Approve next to the team's name. They will be allowed back into the session." },
    { q: 'The scoreboard shows 0 for all teams after the session.', a: 'This can happen if the session ended before any answers were graded. Check the Reports tab — if team scores are there, the scoreboard will update. Try refreshing the page.' },
    { q: 'I accidentally deleted a quiz.', a: 'Deleted quizzes cannot be recovered from the admin panel. Contact your Super Admin — they may be able to restore from a system backup.' },
    { q: "Participants say they cannot join with their access code.", a: 'Verify: (1) The quiz is in READY or LIVE status (not Draft). (2) The access code was copied correctly — codes are case-sensitive. (3) The quiz is not locked (check Proctor Dashboard → Lock Entry status).' },
    { q: 'The quiz is stuck in LIVE status and I cannot end it.', a: 'Go to the Host Game screen using your Proctor PIN. If the game is in a final state, click "Go Home". If you cannot access the host screen, contact your Super Admin to force-deactivate the quiz.' },
  ];
  return (
    <div className="um-section">
      <SectionHeader icon={<Wrench size={24} />} title="Troubleshooting" subtitle="Common issues and how to fix them" />

      <div className="um-intro-block">
        <p className="um-body">Running into a problem? Browse the frequently asked questions below. Click any question to reveal the answer. If you don't find what you're looking for, contact your Super Admin for further assistance.</p>
      </div>

      <SubSection title="Frequently Asked Questions">
        <div className="um-faq-list">
          {faqs.map(({ q, a }) => <FaqItem key={q} question={q} answer={a} />)}
        </div>
      </SubSection>

      <div className="um-help-card">
        <div className="um-help-card-icon"><MonitorCheck size={28} /></div>
        <div>
          <div className="um-help-card-title">Still need help?</div>
          <div className="um-help-card-desc">For account issues, permission problems, or data recovery, reach out to your Super Admin. They have access to system-level tools and backups.</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────
const SIDEBAR_KEY = 'um_sidebar_collapsed';

export default function UserManualPage() {
  const [activeId, setActiveId] = useState('overview');
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem(SIDEBAR_KEY) === 'true'; } catch (e) { void e; return false; }
  });

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem(SIDEBAR_KEY, String(next)); } catch (e) { void e; }
      return next;
    });
  };

  const filtered = SECTIONS.filter(s =>
    s.label.toLowerCase().includes(search.toLowerCase())
  );

  const currentIdx  = SECTIONS.findIndex(s => s.id === activeId);
  const currentSec  = SECTIONS[currentIdx];
  const prevSec     = currentIdx > 0 ? SECTIONS[currentIdx - 1] : null;
  const nextSec     = currentIdx < SECTIONS.length - 1 ? SECTIONS[currentIdx + 1] : null;

  const navigate = (id: string) => {
    setActiveId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = () => {
    switch (activeId) {
      case 'overview':        return <OverviewSection onNavigate={navigate} />;
      case 'getting-started': return <GettingStartedSection />;
      case 'quiz-lifecycle':  return <QuizLifecycleSection />;
      case 'create-quiz':     return <CreateQuizSection />;
      case 'questions':       return <QuestionsSection />;
      case 'teams':           return <TeamsSection />;
      case 'hosting':         return <HostingSection />;
      case 'game-flow':       return <GameFlowSection />;
      case 'proctor':         return <ProctorSection />;
      case 'class-mode':      return <ClassModeSection />;
      case 'scoreboard':      return <ScoreboardSection />;
      case 'security':        return <SecuritySection />;
      case 'troubleshoot':    return <TroubleshootSection />;
      default:                return <OverviewSection onNavigate={navigate} />;
    }
  };

  return (
    <div className="um-page">
      {/* ── Hero ── */}
      <section className="admin-clean-hero">
        <div className="admin-clean-hero-content">
          <div className="admin-clean-hero-left">
            <span className="admin-clean-chip">Help Center</span>
            <h1 className="admin-clean-title">User Manual</h1>
            <p className="admin-clean-subtitle">Your guide to creating quizzes, managing teams, and hosting live games.</p>
          </div>
          <div className="admin-clean-hero-right">
            <span className="um-version-badge">v1.0</span>
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <div className={`um-layout ${collapsed ? 'um-layout-collapsed' : ''}`}>

        {/* ── Sidebar ── */}
        <aside className={`um-sidebar ${collapsed ? 'um-sidebar-collapsed' : ''}`}>

          {/* Toggle button */}
          <button
            className="um-sidebar-toggle"
            onClick={toggleCollapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={15} /> : <ArrowLeft size={15} />}
          </button>

          {/* Expanded: search + labels */}
          {!collapsed && (
            <>
              <div className="um-search-wrap">
                <Search size={14} className="um-search-icon" />
                <input
                  className="um-search-input"
                  placeholder="Search topics…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <nav className="um-nav">
                {filtered.map(sec => (
                  <button
                    key={sec.id}
                    className={`um-nav-item ${activeId === sec.id ? 'active' : ''}`}
                    style={activeId === sec.id ? { background: sec.color } : {}}
                    onClick={() => navigate(sec.id)}
                  >
                    <span className="um-nav-label">{sec.label}</span>
                    {activeId === sec.id && <ChevronRight size={13} style={{ color: 'rgba(255,255,255,0.7)', marginLeft: 'auto', flexShrink: 0 }} />}
                  </button>
                ))}
                {filtered.length === 0 && <p className="um-nav-empty">No topics match "{search}"</p>}
              </nav>
            </>
          )}

          {/* Collapsed: icon-only with tooltip */}
          {collapsed && (
            <nav className="um-nav-icons">
              {SECTIONS.map(sec => (
                <button
                  key={sec.id}
                  className={`um-nav-icon-btn ${activeId === sec.id ? 'active' : ''}`}
                  style={activeId === sec.id ? { background: sec.color, color: '#fff' } : {}}
                  onClick={() => navigate(sec.id)}
                  title={sec.label}
                >
                  <span className="um-nav-icon-glyph">{sec.icon}</span>
                  <span className="um-nav-icon-tooltip">{sec.label}</span>
                </button>
              ))}
            </nav>
          )}
        </aside>

        {/* ── Main ── */}
        <main className="um-main">
          {/* Breadcrumb */}
          <div className="um-breadcrumb">
            <button className="um-bc-home" onClick={() => navigate('overview')}>User Manual</button>
            <ChevronRight size={13} className="um-bc-sep" />
            <span className="um-bc-current">{currentSec?.label}</span>
          </div>

          {/* Content card */}
          <div className="um-content-card">
            {renderContent()}
          </div>

          {/* ── Pager: simple arrow pills ── */}
          <div className="um-pager">
            {prevSec ? (
              <button className="um-pager-btn" onClick={() => navigate(prevSec.id)}>
                <ArrowLeft size={15} />
                <span>{prevSec.label}</span>
              </button>
            ) : <div />}
            {nextSec ? (
              <button className="um-pager-btn um-pager-next" onClick={() => navigate(nextSec.id)}>
                <span>{nextSec.label}</span>
                <ArrowRight size={15} />
              </button>
            ) : <div />}
          </div>
        </main>
      </div>
    </div>
  );
}
