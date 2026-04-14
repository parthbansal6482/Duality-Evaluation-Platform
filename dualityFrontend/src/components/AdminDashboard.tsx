import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileQuestion,
  Layers,
  Users,
  PlayCircle,
  LogOut,
  Menu,
  X,
  Settings,
  Code2
} from 'lucide-react';
import { QuestionsSection } from './dashboard/QuestionsSection';
import { RoundsSection } from './dashboard/RoundsSection';
import { TeamsSection } from './dashboard/TeamsSection';
import { RoundControlSection } from './dashboard/RoundControlSection';
import { CheatingAlertsList } from './dashboard/CheatingAlertsList';
import { socketService } from '../services/extended.socket.service';

type Section = 'overview' | 'questions' | 'rounds' | 'teams' | 'control' | 'settings';

interface AdminDashboardProps {
  onLogout?: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    socketService.connect();
  }, []);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      // Fallback for standalone use
      localStorage.removeItem('token');
      window.location.href = '/admin-auth';
    }
  };

  const navItems = [
    { id: 'overview' as Section, label: 'Overview', icon: LayoutDashboard },
    { id: 'questions' as Section, label: 'Questions', icon: FileQuestion },
    { id: 'rounds' as Section, label: 'Rounds', icon: Layers },
    { id: 'teams' as Section, label: 'Teams', icon: Users },
    { id: 'control' as Section, label: 'Round Control', icon: PlayCircle },
    { id: 'settings' as Section, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-black flex">
      {/* Sidebar */}
      <aside
        className={`${isSidebarOpen ? 'w-64' : 'w-0'
          } bg-zinc-900 border-r border-zinc-800 transition-all duration-300 overflow-hidden flex flex-col`}
      >
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">Admin Panel</h2>
          <p className="text-sm text-gray-400 mt-1">DSA Contest</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeSection === item.id
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:bg-zinc-800 hover:text-white'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-zinc-800 hover:text-white transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h1 className="text-2xl font-bold text-white">
              {navItems.find((item) => item.id === activeSection)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-white font-medium">Admin User</p>
              <p className="text-xs text-gray-400">admin@contest.com</p>
            </div>
            <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">A</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          {activeSection === 'overview' && <OverviewSection onNavigate={setActiveSection} />}
          {activeSection === 'questions' && <QuestionsSection />}
          {activeSection === 'rounds' && <RoundsSection />}
          {activeSection === 'teams' && <TeamsSection />}
          {activeSection === 'control' && <RoundControlSection />}
          {activeSection === 'settings' && <SettingsSection />}
        </main>
      </div>
    </div>
  );
}

function OverviewSection({ onNavigate }: { onNavigate: (section: Section) => void }) {
  const [stats, setStats] = useState({
    totalTeams: 0,
    pendingApprovals: 0,
    totalQuestions: 0,
    activeRounds: 0,
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
    fetchActivities();
    // Refresh activities every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { getOverviewStats } = await import('../services/stats.service');
      const data = await getOverviewStats();
      setStats({
        totalTeams: data.totalTeams,
        pendingApprovals: data.pendingApprovals,
        totalQuestions: data.totalQuestions,
        activeRounds: data.activeRounds,
      });
      setError('');
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const { getRecentActivity } = await import('../services/stats.service');
      const data = await getRecentActivity(5);
      setActivities(data);
    } catch (err) {
      console.error('Error fetching activities:', err);
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const statsDisplay = [
    { label: 'Total Teams', value: stats.totalTeams.toString(), color: 'bg-blue-500' },
    { label: 'Pending Approvals', value: stats.pendingApprovals.toString(), color: 'bg-yellow-500' },
    { label: 'Total Questions', value: stats.totalQuestions.toString(), color: 'bg-green-500' },
    { label: 'Active Rounds', value: stats.activeRounds.toString(), color: 'bg-purple-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6">
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-red-500/20 rounded-lg text-red-500 hover:bg-red-500/30 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsDisplay.map((stat, index) => (
          <div
            key={index}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{stat.label}</p>
                <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg opacity-20`}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions and Live Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => onNavigate('questions')}
              className="bg-black border border-zinc-800 rounded-lg p-4 text-left hover:border-zinc-600 transition-colors"
            >
              <FileQuestion className="w-6 h-6 text-gray-400 mb-2" />
              <p className="text-white font-medium">Add Question</p>
              <p className="text-xs text-gray-400 mt-1">Create new DSA problem</p>
            </button>
            <button
              onClick={() => onNavigate('rounds')}
              className="bg-black border border-zinc-800 rounded-lg p-4 text-left hover:border-zinc-600 transition-colors"
            >
              <Layers className="w-6 h-6 text-gray-400 mb-2" />
              <p className="text-white font-medium">Create Round</p>
              <p className="text-xs text-gray-400 mt-1">Setup new contest round</p>
            </button>
            <button
              onClick={() => onNavigate('teams')}
              className="bg-black border border-zinc-800 rounded-lg p-4 text-left hover:border-zinc-600 transition-colors"
            >
              <Users className="w-6 h-6 text-gray-400 mb-2" />
              <p className="text-white font-medium">Review Teams</p>
              <p className="text-xs text-gray-400 mt-1">Approve pending teams</p>
            </button>
            <button
              onClick={() => onNavigate('control')}
              className="bg-black border border-zinc-800 rounded-lg p-4 text-left hover:border-zinc-600 transition-colors"
            >
              <PlayCircle className="w-6 h-6 text-gray-400 mb-2" />
              <p className="text-white font-medium">Start Round</p>
              <p className="text-xs text-gray-400 mt-1">Begin contest round</p>
            </button>
          </div>
        </div>

        {/* Live Cheating Alerts */}
        <CheatingAlertsList />
      </div>

      {/* Recent Activity */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No recent activity</p>
          ) : (
            activities.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0"
              >
                <p className="text-gray-300">{activity.action}</p>
                <p className="text-sm text-gray-500">{getTimeAgo(activity.timestamp)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsSection() {
  const [isPasteEnabled, setIsPasteEnabled] = useState(true);

  useEffect(() => {
    import('../services/settings.service').then(({ getSettings }) => {
      getSettings().then(res => {
        if (res.success && res.data) {
          setIsPasteEnabled(res.data.isPasteEnabled !== false);
        }
      }).catch(console.error);
    });
  }, []);

  const togglePasteEnabled = async () => {
    try {
      const newValue = !isPasteEnabled;
      setIsPasteEnabled(newValue);
      
      const { updateSettings } = await import('../services/settings.service');
      const res = await updateSettings({ isPasteEnabled: newValue });
      
      if (!res.success) {
        setIsPasteEnabled(!newValue);
        alert('Failed to update settings');
      }
    } catch (err) {
      console.error(err);
      setIsPasteEnabled(!isPasteEnabled);
      alert('Error updating setting');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="border-b border-zinc-800 pb-4 mb-4">
          <h2 className="text-xl font-bold text-white">Global Platform Settings</h2>
          <p className="text-sm text-gray-400 mt-1">Configure competition-wide behaviors and restrictions.</p>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-12 py-4">
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Editor Pasting</h3>
            <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
              Controls whether students can paste code straight into the Monaco editor during a round. When disabled, standard clipboard actions and keyboard shortcuts (<span className="text-gray-300 font-semibold">Ctrl+V</span> / <span className="text-gray-300 font-semibold">Cmd+V</span>) are intercepted and blocked in the coding environment.
            </p>
          </div>
          <div className="flex-shrink-0 mt-2 md:mt-0">
            <button
              onClick={togglePasteEnabled}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl text-sm transition-all focus:outline-none whitespace-nowrap ${
                isPasteEnabled 
                  ? 'bg-zinc-800 text-gray-400 hover:text-white hover:bg-zinc-700 font-medium border border-zinc-700 hover:border-zinc-500'
                  : 'bg-white text-black font-semibold shadow-[0_0_20px_rgba(255,255,255,0.15)] ring-2 ring-white/50 ring-offset-2 ring-offset-zinc-900' 
              }`}
            >
              <Code2 className={`w-4 h-4`} />
              {isPasteEnabled ? 'Status: ALLOWED' : 'Status: BLOCKED'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
