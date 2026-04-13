import { useState, useEffect } from 'react';
import { GraduationCap, ClipboardList } from 'lucide-react';

// Individual Assignments & Evaluation (Duality) imports
import { DualityAuth } from './components/duality/DualityAuth';
import { StudentDashboard } from './components/duality/StudentDashboard';
import { AdminDashboard as AssignmentsAdminDashboard } from './components/duality/AdminDashboard';
import { ProblemSolve } from './components/duality/ProblemSolve';
import { Landing } from './components/duality/Landing';

// Quiz mode imports
import { QuizAuth } from './components/quiz/QuizAuth';
import { QuizStudentDashboard } from './components/quiz/QuizStudentDashboard';
import { QuizAdminDashboard } from './components/quiz/QuizAdminDashboard';

type AppMode = 'platform-select' | 'assignments' | 'quiz';
type AssignmentsView = 'auth' | 'student' | 'admin' | 'problem';

const DUALITY_VIEW_KEY = 'dualityView';
const DUALITY_SELECTED_PROBLEM_KEY = 'dualitySelectedProblemId';

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('platform-select');

  // Assignments mode state
  const [assignmentsView, setAssignmentsView] = useState<AssignmentsView>('auth');
  const [assignmentsUserType, setAssignmentsUserType] = useState<'admin' | 'student'>('student');
  const [assignmentsUserName, setAssignmentsUserName] = useState('');
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);

  // Quiz mode state
  const [quizUserType, setQuizUserType] = useState<'admin' | 'student'>('student');
  const [quizUserName, setQuizUserName] = useState('');
  const [isQuizLoggedIn, setIsQuizLoggedIn] = useState(false);

  // Restore session on mount
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
  }, []);

  useEffect(() => {
    localStorage.setItem('appMode', appMode);
  }, [appMode]);

  useEffect(() => {
    localStorage.setItem(DUALITY_VIEW_KEY, assignmentsView);
  }, [assignmentsView]);

  useEffect(() => {
    if (selectedProblemId) {
      localStorage.setItem(DUALITY_SELECTED_PROBLEM_KEY, selectedProblemId);
    } else {
      localStorage.removeItem(DUALITY_SELECTED_PROBLEM_KEY);
    }
  }, [selectedProblemId]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

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

  // ─── Render: Assignments mode ────────────────────────────────────────────────
  if (appMode === 'assignments') {
    if (assignmentsView === 'auth') {
      return (
        <DualityAuth
          onLogin={handleAssignmentsLogin}
          onBack={() => { setAppMode('platform-select'); }}
        />
      );
    }

    if (assignmentsView === 'problem' && selectedProblemId) {
      return (
        <ProblemSolve
          problemId={selectedProblemId}
          onBack={handleBackFromProblem}
        />
      );
    }

    if (assignmentsView === 'admin') {
      return (
        <AssignmentsAdminDashboard
          userName={assignmentsUserName}
          onLogout={handleAssignmentsLogout}
        />
      );
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

  // ─── Render: Quiz mode ───────────────────────────────────────────────────────
  if (appMode === 'quiz') {
    if (!isQuizLoggedIn) {
      return (
        <QuizAuth
          onLogin={handleQuizLogin}
          onBack={() => setAppMode('platform-select')}
        />
      );
    }

    if (quizUserType === 'admin') {
      return (
        <QuizAdminDashboard
          userName={quizUserName}
          onLogout={handleQuizLogout}
        />
      );
    }

    return (
      <QuizStudentDashboard
        userName={quizUserName}
        onLogout={handleQuizLogout}
      />
    );
  }

  // ─── Platform Selection ───────────────────────────────────────────────────────
  return (
    <Landing
      onSelectDuality={() => setAppMode('assignments')}
      onSelectDualityExtended={() => setAppMode('quiz')}
    />
  );
}
