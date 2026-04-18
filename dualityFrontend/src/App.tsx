import { useState, useEffect } from 'react';

// ── Assignments & Practice (Duality) ─────────────────────────────────────────
import { DualityAuth } from './components/duality/DualityAuth';
import { StudentDashboard } from './components/duality/StudentDashboard';
import { AdminDashboard as AssignmentsAdminDashboard } from './components/duality/AdminDashboard';
import { ProblemSolve } from './components/duality/ProblemSolve';
import { Landing } from './components/duality/Landing';

// ── Quiz mode ─────────────────────────────────────────────────────────────────
import { QuizAuth } from './components/quiz/QuizAuth';
import { QuizStudentDashboard } from './components/quiz/QuizStudentDashboard';
import { QuizAdminDashboard } from './components/quiz/QuizAdminDashboard';

// ── Extended Competition mode ─────────────────────────────────────────────────
import { AdminAuth } from './components/AdminAuth';
import { AdminDashboard as ExtendedAdminDashboard } from './components/AdminDashboard';
import { TeamAuth } from './components/TeamAuth';
import { TeamDashboard } from './components/TeamDashboard';
import { RoundPage } from './components/RoundPage';

type AppMode = 'platform-select' | 'assignments' | 'quiz' | 'extended';
type AssignmentsView = 'auth' | 'student' | 'admin' | 'problem';
type ExtendedView = 'select-role' | 'admin-auth' | 'admin-dashboard' | 'team-auth' | 'team-dashboard' | 'round';

const DUALITY_VIEW_KEY = 'dualityView';
const DUALITY_SELECTED_PROBLEM_KEY = 'dualitySelectedProblemId';

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('platform-select');

  // ── Assignments state ───────────────────────────────────────────────────────
  const [assignmentsView, setAssignmentsView] = useState<AssignmentsView>('auth');
  const [assignmentsUserType, setAssignmentsUserType] = useState<'admin' | 'student'>('student');
  const [assignmentsUserName, setAssignmentsUserName] = useState('');
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);

  // ── Quiz state ──────────────────────────────────────────────────────────────
  const [quizUserType, setQuizUserType] = useState<'admin' | 'student'>('student');
  const [quizUserName, setQuizUserName] = useState('');
  const [isQuizLoggedIn, setIsQuizLoggedIn] = useState(false);

  // ── Extended Competition state ──────────────────────────────────────────────
  const [extendedView, setExtendedView] = useState<ExtendedView>('select-role');
  const [extendedRoundId, setExtendedRoundId] = useState<string | null>(null);

  // ── Session restore ─────────────────────────────────────────────────────────
  useEffect(() => {
    const dualityToken = localStorage.getItem('dualityToken');
    const dualityUserStr = localStorage.getItem('dualityUser');

    if (dualityToken && dualityUserStr) {
      try {
        const user = JSON.parse(dualityUserStr);
        const savedMode = localStorage.getItem('appMode') as AppMode | null;
        const savedView = localStorage.getItem(DUALITY_VIEW_KEY) as AssignmentsView | null;
        const savedProblemId = localStorage.getItem(DUALITY_SELECTED_PROBLEM_KEY);

        setAssignmentsUserName(user.name);
        setAssignmentsUserType(user.role);
        setQuizUserName(user.name);
        setQuizUserType(user.role);
        setIsQuizLoggedIn(true);

        if (savedMode === 'quiz') {
          setAppMode('quiz');
        } else {
          setAppMode('assignments');
          if (user.role === 'admin') {
            setAssignmentsView('admin');
          } else if (savedView === 'problem' && savedProblemId) {
            setSelectedProblemId(savedProblemId);
            setAssignmentsView('problem');
          } else {
            setAssignmentsView('student');
          }
        }
      } catch (e) {
        console.error('Error restoring session', e);
      }
    }

    // Restore Extended session (uses localStorage 'token' / 'user' / 'userType')
    const extToken = localStorage.getItem('token');
    const extUserType = localStorage.getItem('userType') as 'admin' | 'team' | null;
    const savedMode = localStorage.getItem('appMode') as AppMode | null;
    if (extToken && extUserType && savedMode === 'extended') {
      setAppMode('extended');
      setExtendedView(extUserType === 'admin' ? 'admin-dashboard' : 'team-dashboard');
    }
  }, []);

  useEffect(() => { localStorage.setItem('appMode', appMode); }, [appMode]);
  useEffect(() => { localStorage.setItem(DUALITY_VIEW_KEY, assignmentsView); }, [assignmentsView]);
  useEffect(() => {
    if (selectedProblemId) localStorage.setItem(DUALITY_SELECTED_PROBLEM_KEY, selectedProblemId);
    else localStorage.removeItem(DUALITY_SELECTED_PROBLEM_KEY);
  }, [selectedProblemId]);

  // ── Assignments handlers ────────────────────────────────────────────────────
  const handleAssignmentsLogin = (userType: 'admin' | 'student', userName: string) => {
    setAssignmentsUserType(userType);
    setAssignmentsUserName(userName);
    setAssignmentsView(userType === 'admin' ? 'admin' : 'student');
  };

  const handleAssignmentsLogout = () => {
    setAssignmentsView('auth');
    setAssignmentsUserName('');
    localStorage.removeItem('dualityToken');
    localStorage.removeItem('dualityUser');
    localStorage.removeItem(DUALITY_VIEW_KEY);
    localStorage.removeItem(DUALITY_SELECTED_PROBLEM_KEY);
    localStorage.removeItem('appMode');
    setAppMode('platform-select');
  };

  const handleSolveProblem = (problemId: string) => {
    setSelectedProblemId(problemId);
    setAssignmentsView('problem');
  };

  const handleBackFromProblem = () => {
    setSelectedProblemId(null);
    setAssignmentsView('student');
  };

  // ── Quiz handlers ───────────────────────────────────────────────────────────
  const handleQuizLogin = (userType: 'admin' | 'student', userName: string) => {
    setQuizUserType(userType);
    setQuizUserName(userName);
    setIsQuizLoggedIn(true);
  };

  const handleQuizLogout = () => {
    setIsQuizLoggedIn(false);
    setQuizUserName('');
    localStorage.removeItem('dualityToken');
    localStorage.removeItem('dualityUser');
    localStorage.removeItem('appMode');
    setAppMode('platform-select');
  };

  // ── Extended handlers ───────────────────────────────────────────────────────
  const handleExtendedAdminLogin = () => setExtendedView('admin-dashboard');
  const handleExtendedTeamLogin = () => setExtendedView('team-dashboard');

  const handleExtendedLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    localStorage.removeItem('appMode');
    setExtendedView('select-role');
    setExtendedRoundId(null);
    setAppMode('platform-select');
  };

  const handleEnterRound = (roundId: string) => {
    setExtendedRoundId(roundId);
    setExtendedView('round');
  };

  const handleExitRound = () => {
    setExtendedRoundId(null);
    setExtendedView('team-dashboard');
  };

  // ── Render: Assignments ────────────────────────────────────────────────────
  if (appMode === 'assignments') {
    if (assignmentsView === 'auth') {
      return <DualityAuth onLogin={handleAssignmentsLogin} onBack={() => setAppMode('platform-select')} />;
    }
    if (assignmentsView === 'problem' && selectedProblemId) {
      return <ProblemSolve problemId={selectedProblemId} onBack={handleBackFromProblem} />;
    }
    if (assignmentsView === 'admin') {
      return <AssignmentsAdminDashboard userName={assignmentsUserName} onLogout={handleAssignmentsLogout} />;
    }
    if (assignmentsView === 'student') {
      return (
        <StudentDashboard
          userName={assignmentsUserName}
          onLogout={handleAssignmentsLogout}
          onSolveProblem={handleSolveProblem}
        />
      );
    }
  }

  // ── Render: Quiz ──────────────────────────────────────────────────────────
  if (appMode === 'quiz') {
    if (!isQuizLoggedIn) {
      return <QuizAuth onLogin={handleQuizLogin} onBack={() => setAppMode('platform-select')} />;
    }
    if (quizUserType === 'admin') {
      return <QuizAdminDashboard userName={quizUserName} onLogout={handleQuizLogout} />;
    }
    return <QuizStudentDashboard userName={quizUserName} onLogout={handleQuizLogout} />;
  }

  // ── Render: Extended Competition ──────────────────────────────────────────
  if (appMode === 'extended') {
    if (extendedView === 'select-role') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#000', gap: '16px' }}>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>Competition Mode</h2>
          <p style={{ color: '#888', marginBottom: '24px' }}>Select your role to continue</p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              id="extended-admin-btn"
              onClick={() => setExtendedView('admin-auth')}
              style={{ padding: '12px 32px', background: '#18181b', border: '1px solid #3f3f46', borderRadius: '10px', color: '#fff', fontSize: '1rem', cursor: 'pointer' }}
            >
              Admin
            </button>
            <button
              id="extended-team-btn"
              onClick={() => setExtendedView('team-auth')}
              style={{ padding: '12px 32px', background: '#18181b', border: '1px solid #3f3f46', borderRadius: '10px', color: '#fff', fontSize: '1rem', cursor: 'pointer' }}
            >
              Team
            </button>
          </div>
          <button
            onClick={() => { setAppMode('platform-select'); setExtendedView('select-role'); }}
            style={{ marginTop: '24px', background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            ← Back
          </button>
        </div>
      );
    }

    if (extendedView === 'admin-auth') {
      return <AdminAuth onLogin={handleExtendedAdminLogin} onBack={() => setExtendedView('select-role')} />;
    }

    if (extendedView === 'admin-dashboard') {
      return <ExtendedAdminDashboard onLogout={handleExtendedLogout} />;
    }

    if (extendedView === 'team-auth') {
      return <TeamAuth onLogin={handleExtendedTeamLogin} onBack={() => setExtendedView('select-role')} />;
    }

    if (extendedView === 'team-dashboard') {
      return <TeamDashboard onLogout={handleExtendedLogout} onEnterRound={handleEnterRound} />;
    }

    if (extendedView === 'round' && extendedRoundId) {
      return <RoundPage roundId={extendedRoundId} onExitRound={handleExitRound} />;
    }
  }

  // ── Platform Selection ─────────────────────────────────────────────────────
  return (
    <Landing
      onSelectDuality={() => setAppMode('assignments')}
      onSelectDualityExtended={() => setAppMode('quiz')}
      onSelectExtended={() => setAppMode('extended')}
    />
  );
}
