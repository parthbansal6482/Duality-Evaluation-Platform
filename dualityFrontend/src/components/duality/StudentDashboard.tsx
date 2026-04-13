import { useState, useEffect } from 'react';
import { Code2, CheckCircle2, Clock, Trophy, User, LogOut, TrendingUp, Target, BarChart3, FileText } from 'lucide-react';
import { Profile } from './Profile';
import { SubmissionsHistory } from './SubmissionsHistory';
import { getDualityQuestions, dualityGetMe, getDualityUserSubmissions, getDualityLeaderboard } from '../../services/duality.service';
import dualitySocketService from '../../services/dualitySocket.service';

interface Problem {
  _id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  solved?: boolean;
}

interface SubmissionRecord {
  status: string;
  question: string | { _id?: string; id?: string };
}

interface LeaderboardEntry {
  id: string;
  name: string;
  totalPoints: number;
  totalSolved: number;
  rank: number;
}

const getQuestionPoints = (difficulty: 'Easy' | 'Medium' | 'Hard') => {
  if (difficulty === 'Easy') return 100;
  if (difficulty === 'Medium') return 200;
  return 300;
};

export function StudentDashboard({
  userName,
  onLogout,
  onSolveProblem
}: {
  userName: string;
  onLogout: () => void;
  onSolveProblem: (problemId: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<'problems' | 'profile' | 'history' | 'leaderboard'>('problems');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Get user stats from DualityUser stored in localStorage
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('dualityUser') || '{}'));
  const [submissions, setSubmissions] = useState<any[]>([]);

  const solvedCount = user.totalSolved || 0;
  const easyCount = user.easySolved || 0;
  const mediumCount = user.mediumSolved || 0;
  const hardCount = user.hardSolved || 0;
  const totalPoints = user.totalPoints || 0;
  const userRank = user.rank || null;

  const getCurrentUserId = () => {
    try {
      const dualityUser = JSON.parse(localStorage.getItem('dualityUser') || '{}');
      return dualityUser.id || dualityUser._id || null;
    } catch {
      return null;
    }
  };

  const withSolvedFlags = (questions: Problem[], submissionList: SubmissionRecord[]) => {
    const solvedQuestionIds = new Set(
      submissionList
        .filter((s) => s.status?.toLowerCase() === 'accepted')
        .map((s) => (typeof s.question === 'string' ? s.question : (s.question?._id || s.question?.id)))
        .filter(Boolean) as string[]
    );

    return questions.map((problem) => ({
      ...problem,
      solved: solvedQuestionIds.has(problem._id),
    }));
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [questionsRes, userRes, submissionsRes] = await Promise.all([
        getDualityQuestions(),
        dualityGetMe(),
        getDualityUserSubmissions(),
      ]);
      const leaderboardRes = await getDualityLeaderboard();

      const submissionsData: SubmissionRecord[] = submissionsRes.success ? submissionsRes.data : [];

      if (questionsRes.success) {
        setProblems(withSolvedFlags(questionsRes.data, submissionsData));
      }
      if (userRes.success) {
        setUser(userRes.data);
        localStorage.setItem('dualityUser', JSON.stringify(userRes.data));
      }
      if (submissionsRes.success) setSubmissions(submissionsData);
      if (leaderboardRes.success) setLeaderboard(leaderboardRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    dualitySocketService.connect();

    // Socket listeners
    const unsubscribeSubmission = dualitySocketService.onSubmissionUpdate((data: any) => {
      // If it's my submission, refresh
      const eventUserId = data?.user?.id || data?.user?._id || null;
      const currentUserId = getCurrentUserId();

      if (!eventUserId || !currentUserId || eventUserId === currentUserId) {
        // Optimistic solved-state update for accepted submissions.
        if (data?.status?.toLowerCase() === 'accepted') {
          const questionId = typeof data?.question === 'string'
            ? data.question
            : (data?.question?.id || data?.question?._id);
          if (questionId) {
            setProblems((prev) => prev.map((p) => (p._id === questionId ? { ...p, solved: true } : p)));
          }
        }
        fetchData();
      }
    });

    const unsubscribeQuestion = dualitySocketService.onQuestionUpdate(() => {
      fetchData();
    });

    return () => {
      unsubscribeSubmission?.();
      unsubscribeQuestion?.();
    };
  }, []);

  const categories = ['All', ...Array.from(new Set(problems.map(p => p.category)))];

  const filteredProblems = problems.filter(problem => {
    const matchesDifficulty = selectedDifficulty === 'All' || problem.difficulty === selectedDifficulty;
    const matchesCategory = selectedCategory === 'All' || problem.category === selectedCategory;
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const matchesSearch = normalizedSearch.length === 0
      || problem.title.toLowerCase().includes(normalizedSearch)
      || problem.category.toLowerCase().includes(normalizedSearch);
    return matchesDifficulty && matchesCategory && matchesSearch;
  });

  const totalCount = problems.length;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-500';
      case 'Medium': return 'text-yellow-500';
      case 'Hard': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                  <Code2 className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Assignments</h1>
                  <p className="text-xs text-gray-500">Evaluation Platform</p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('problems')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'problems'
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  <Code2 className="w-4 h-4" />
                  Assignments
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile'
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'history'
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  <FileText className="w-4 h-4" />
                  History
                </button>
                <button
                  onClick={() => setActiveTab('leaderboard')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'leaderboard'
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  <Trophy className="w-4 h-4" />
                  Rankings
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-400">
                <User className="w-4 h-4" />
                <span className="text-sm">{userName}</span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-gray-400 hover:text-white hover:bg-zinc-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'profile' ? (
          <Profile user={user} submissions={submissions} problems={problems} totalProblems={problems.length} />
        ) : activeTab === 'history' ? (
          <SubmissionsHistory />
        ) : activeTab === 'leaderboard' ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 bg-black/30 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Leaderboard</h2>
              <div className="text-sm text-gray-400">
                Your Rank: <span className="text-white font-semibold">{userRank ? `#${userRank}` : '-'}</span> •
                Points: <span className="text-yellow-500 font-semibold ml-1">{totalPoints}</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black border-b border-zinc-800">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Rank</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Student</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Points</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Solved</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry) => (
                    <tr key={entry.id} className={`border-b border-zinc-800 ${entry.id === user.id ? 'bg-zinc-800/40' : 'hover:bg-zinc-800/20'}`}>
                      <td className="px-6 py-4 text-white font-semibold">#{entry.rank}</td>
                      <td className="px-6 py-4 text-white">{entry.name}</td>
                      <td className="px-6 py-4 text-yellow-500 font-semibold">{entry.totalPoints}</td>
                      <td className="px-6 py-4 text-gray-300">{entry.totalSolved}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {/* Total Solved */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Assignments Done • Points</p>
                    <p className="text-2xl font-bold text-white">{solvedCount}/{totalCount}</p>
                    <p className="text-sm text-yellow-500 font-semibold">{totalPoints} pts</p>
                  </div>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2">
                  <div
                    className="bg-white rounded-full h-2 transition-all"
                    style={{ width: `${(solvedCount / totalCount) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Easy */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Easy</p>
                    <p className="text-2xl font-bold text-green-500">{easyCount}</p>
                  </div>
                </div>
              </div>

              {/* Medium */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Medium</p>
                    <p className="text-2xl font-bold text-yellow-500">{mediumCount}</p>
                  </div>
                </div>
              </div>

              {/* Hard */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Hard</p>
                    <p className="text-2xl font-bold text-red-500">{hardCount}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-3 lg:grid-cols-3 gap-4 items-end">
                {/* Difficulty Filter */}
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Difficulty</label>
                  <div className="flex flex-wrap gap-3 w-full">
                    {(['All', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
                      <button
                        key={diff}
                        onClick={() => setSelectedDifficulty(diff)}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${selectedDifficulty === diff
                          ? 'bg-white text-black'
                          : 'bg-zinc-800 text-gray-400 hover:text-white'
                          }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-zinc-600"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Search */}
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Search Problems</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title or category..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>
            </div>

            {/* Problems List */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black border-b border-zinc-800">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Status</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Title</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Difficulty</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Points</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Category</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProblems.map((problem) => (
                      <tr key={problem._id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-4">
                          {problem.solved ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-zinc-700"></div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white font-medium">{problem.title}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-medium ${getDifficultyColor(problem.difficulty)}`}>
                            {problem.difficulty}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-yellow-500 font-medium">{getQuestionPoints(problem.difficulty)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-400">{problem.category}</span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => onSolveProblem(problem._id)}
                            className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                          >
                            {problem.solved ? 'Redo' : 'Solve'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredProblems.length === 0 && (
                <div className="py-12 text-center text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No assignments found with the selected filters.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div >
  );
}
