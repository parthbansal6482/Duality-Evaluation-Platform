import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Clock, Zap, Shield as ShieldIcon, Maximize, AlertTriangle, Coins, Trophy, CheckCircle } from 'lucide-react';
import { QuestionList } from './round-page/QuestionList';
import { ProblemView } from './round-page/ProblemView';
import { TacticalPanel } from './round-page/TacticalPanel';
import { SabotageEffects } from './round-page/SabotageEffects';
import { getRoundQuestions, exitRound, completeRound } from '../services/round.service';
import { getTeamStats, purchaseToken, getLeaderboard, LeaderboardTeam, launchSabotage, activateShield } from '../services/team.service';
import { socketService, TeamStatsUpdate, SubmissionUpdate, DisqualificationUpdate, RoundUpdate } from '../services/socket.service';

interface Question {
  _id: string;
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  points: number;
  status: 'unsolved' | 'attempted' | 'solved';
  category: string;
  description?: string;
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string;
  examples?: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  boilerplateCode?: {
    python?: string;
    c?: string;
    cpp?: string;
    java?: string;
  };
}

interface Round {
  _id: string;
  name: string;
  duration: number;
  status: string;
  startTime: string;
  endTime: string;
}

interface SabotageEffect {
  type: 'blackout' | 'typing-delay' | 'format-chaos' | 'ui-glitch';
  endTime: number;
  fromTeam?: string;
}

interface RoundPageProps {
  roundId: string;
  onExitRound: () => void;
}

interface TeamTarget {
  id: string;
  name: string;
  rank: number;
  hasShield: boolean;
}

export function RoundPage({ roundId, onExitRound }: RoundPageProps) {
  const [round, setRound] = useState<Round | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [sabotageTokens, setSabotageTokens] = useState(0);
  const [shieldTokens, setShieldTokens] = useState(0);
  const [isShieldActive, setIsShieldActive] = useState(false);
  const [activeEffects, setActiveEffects] = useState<SabotageEffect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('Your Team');
  const [teamPoints, setTeamPoints] = useState(0);
  const [teamScore, setTeamScore] = useState(0);
  const [allTeams, setAllTeams] = useState<TeamTarget[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [sabotageCooldown, setSabotageCooldown] = useState<number | null>(null);
  const [shieldCooldown, setShieldCooldown] = useState<number | null>(null);
  const [tacticalMessage, setTacticalMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [isCheatingWarningOpen, setIsCheatingWarningOpen] = useState(false);
  const violationRef = useRef<{ startTime: number | null }>({ startTime: null });

  // Fetch round data and team stats
  useEffect(() => {
    const fetchRoundData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch round questions
        const roundResponse = await getRoundQuestions(roundId);
        setRound(roundResponse.data.round);
        console.log('Round data loaded:', roundResponse.data.round);
        console.log('Round endTime:', roundResponse.data.round.endTime);
        console.log('Current time:', new Date().toISOString());

        // Map backend question structure to frontend
        const mappedQuestions: Question[] = roundResponse.data.questions.map((q: any) => ({
          _id: q._id,
          id: q._id,
          title: q.title,
          difficulty: q.difficulty,
          points: q.points || (q.difficulty === 'Easy' ? 100 : q.difficulty === 'Medium' ? 150 : 200),
          status: q.submissionStatus || 'unsolved',
          category: q.category,
          description: q.description,
          inputFormat: q.inputFormat,
          outputFormat: q.outputFormat,
          constraints: q.constraints,
          examples: q.examples,
          boilerplateCode: q.boilerplateCode,
        }));

        // Initialize questions
        setQuestions(mappedQuestions);
        if (mappedQuestions.length > 0 && !selectedQuestion) {
          setSelectedQuestion(mappedQuestions[0]._id);
        }

        // Fetch team stats to get points, tokens, and current tactical state
        const teamStats = await getTeamStats();
        setTeamName(teamStats.teamName);
        setTeamPoints(teamStats.points);
        setTeamScore(teamStats.score);
        setSabotageTokens(teamStats.tokens.sabotage);
        setShieldTokens(teamStats.tokens.shield);
        setIsShieldActive(teamStats.shieldActive || false);

        // Load active sabotages from DB
        if (teamStats.activeSabotages && teamStats.activeSabotages.length > 0) {
          const now = Date.now();
          const effects: SabotageEffect[] = teamStats.activeSabotages
            .map((s: any) => ({
              type: s.type,
              endTime: new Date(s.endTime).getTime(),
              fromTeam: s.fromTeamName
            }))
            .filter((s: any) => s.endTime > now);
          setActiveEffects(effects);
        }

        // Cooldowns
        if (teamStats.sabotageCooldownUntil) {
          setSabotageCooldown(new Date(teamStats.sabotageCooldownUntil).getTime());
        }
        if (teamStats.shieldCooldownUntil) {
          setShieldCooldown(new Date(teamStats.shieldCooldownUntil).getTime());
        }

        // Check if team is disqualified from this round
        if (teamStats.disqualifiedRounds?.includes(roundId)) {
          setIsDisqualified(true);
        }

        // Fetch all teams for tactical panel
        const leaderboard = await getLeaderboard();
        const mappedTeams: TeamTarget[] = leaderboard
          .filter(t => t.teamName !== (teamStats.teamName || 'Your Team')) // Don't target yourself
          .map((t) => ({
            id: t._id,
            name: t.teamName,
            rank: t.rank,
            hasShield: false, // Hidden as requested
          }));
        setAllTeams(mappedTeams);
      } catch (err: any) {
        console.error('Error fetching round data:', err);
        setError(err.response?.data?.message || 'Failed to load round data');
      } finally {
        setLoading(false);
      }
    };

    fetchRoundData();
  }, [roundId]);

  // WebSocket subscriptions (separate effect to avoid re-running when teamName changes)
  useEffect(() => {
    if (!teamName || teamName === 'Your Team') {
      return; // Wait until we have the actual team name
    }

    // Connect to WebSocket
    socketService.connect();

    // Subscribe to team stats updates
    const unsubscribeStats = socketService.onTeamStatsUpdate((data: TeamStatsUpdate) => {
      if (data.teamName.toLowerCase().trim() === teamName.toLowerCase().trim()) {
        console.log('Real-time team stats update in RoundPage:', data);
        setSabotageTokens(data.tokens.sabotage);
        setShieldTokens(data.tokens.shield);
        setTeamPoints(data.points);
        setTeamScore(data.score);
        setIsShieldActive(data.shieldActive || false);

        if (data.activeSabotages) {
          const now = Date.now();
          const effects: SabotageEffect[] = data.activeSabotages
            .map((s: any) => ({
              type: s.type,
              endTime: new Date(s.endTime).getTime(),
              fromTeam: s.fromTeamName
            }))
            .filter((s: any) => s.endTime > now);
          setActiveEffects(effects);
        }
      }
    });

    // Subscribe to submission updates
    const unsubscribeSubmission = socketService.onSubmissionUpdate((data: SubmissionUpdate) => {
      if (data.teamName.toLowerCase().trim() === teamName.toLowerCase().trim()) {
        console.log('Real-time submission update:', data.questionId, data.status);
        // Update question status based on submission
        setQuestions((prev) => prev.map((q) =>
          q._id === data.questionId
            ? { ...q, status: data.status === 'accepted' ? 'solved' : 'attempted' }
            : q
        ));
      }
    });

    // Subscribe to disqualification updates
    const unsubscribeDisqualification = socketService.onDisqualificationUpdate((data: DisqualificationUpdate) => {
      if (data.teamName.toLowerCase().trim() === teamName.toLowerCase().trim() && data.roundId === roundId) {
        setIsDisqualified(data.isDisqualified);
        if (data.isDisqualified) {
          // Exit full screen if disqualified
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => console.error(err));
          }
        }
      }
    });

    // Subscribe to sabotage attacks
    const unsubscribeSabotage = socketService.onSabotageAttack((data: any) => {
      if (data.targetTeamName.toLowerCase().trim() === teamName.toLowerCase().trim()) {
        console.log('You are being sabotaged!', data.type, 'from', data.attackerTeamName);

        // Use the endTime from the server if available, otherwise fallback to 1 minute
        const endTime = data.endTime ? new Date(data.endTime).getTime() : Date.now() + 60000;
        
        setActiveEffects((prev) => [
          ...prev,
          {
            type: data.type as SabotageEffect['type'],
            endTime: endTime,
            fromTeam: data.attackerTeamName
          },
        ]);
      }
    });

    // Subscribe to round updates
    const unsubscribeRound = socketService.onRoundUpdate((data: RoundUpdate) => {
      if (data._id === roundId) {
        console.log('Real-time round update received in RoundPage:', data);
        setRound((prev) => prev ? { ...prev, ...data } : (data as any));
      }
    });

    // Subscribe to leaderboard updates (for Tactical Panel)
    const unsubscribeLeaderboard = socketService.onLeaderboardUpdate((data: LeaderboardTeam[]) => {
      console.log('Leaderboard update received for Tactical Panel');
      setAllTeams((prevTeams) => {
        return data
          .filter(t => t.teamName.toLowerCase().trim() !== teamName.toLowerCase().trim()) // Don't target yourself
          .map(t => ({
            id: t._id,
            name: t.teamName,
            rank: t.rank,
            hasShield: false, // Hidden as requested
          }));
      });
    });

    // Cleanup on unmount
    return () => {
      unsubscribeStats();
      unsubscribeSubmission();
      unsubscribeDisqualification();
      unsubscribeSabotage();
      unsubscribeRound();
      unsubscribeLeaderboard();
    };
  }, [teamName, roundId]);

  // Real-time timer countdown
  useEffect(() => {
    if (!round?.endTime) {
      console.log('Timer not starting - no endTime:', round);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const end = new Date(round.endTime).getTime();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));

      console.log('Timer update:', {
        now: new Date(now).toISOString(),
        endTime: round.endTime,
        end: new Date(end).toISOString(),
        remaining,
        remainingFormatted: formatTime(remaining)
      });

      setTimeRemaining(remaining);

      if (remaining === 0) {
        alert('Round has ended!');
        onExitRound();
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [round?.endTime, onExitRound]);

  // Handle browser back/refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const message = "Are you sure you want to leave? All your progress in this round will be lost. Progress is only permanently saved after clicking 'Complete Round'.";
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Full screen and Visibility detection
  useEffect(() => {
    if (loading || isDisqualified) return;

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleViolationStart = (type: string) => {
      if (!isDisqualified && !violationRef.current.startTime) {
        console.warn(`${type} detected!`);
        const now = Date.now();
        violationRef.current = { startTime: now };
        setIsCheatingWarningOpen(true);
        socketService.reportViolation(teamName, round?.name || 'Unknown Round', 'tab-switch', 'start');
      }
    };

    const handleViolationEnd = (type: string) => {
      if (violationRef.current.startTime) {
        const duration = Math.round((Date.now() - violationRef.current.startTime) / 1000);
        console.log(`${type} ended. Duration: ${duration}s`);
        // We keep the warning overlay open so the user MUST read and dismiss it
        socketService.reportViolation(teamName, round?.name || 'Unknown Round', 'tab-switch', 'end', duration);
        violationRef.current = { startTime: null };
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleViolationStart('Tab switch');
      } else if (document.visibilityState === 'visible') {
        handleViolationEnd('Tab switch');
      }
    };

    const handleWindowBlur = () => {
      handleViolationStart('Window blur');
    };

    const handleWindowFocus = () => {
      handleViolationEnd('Window focus');
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    // Initial check
    setIsFullscreen(!!document.fullscreenElement);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [loading, isDisqualified, teamName, round?.name]);

  const enterFullscreen = () => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    }
  };

  const handleExitRound = async () => {
    const confirmed = window.confirm(
      "⚠️ EXIT ROUND?\n\n" +
      "All your progress will be PERMANENTLY DELETED:\n" +
      "• All active code submissions for this round will be removed\n" +
      "• Question statuses (Solved/Attempted) will be reset\n" +
      "• Points earned specifically in THIS round will be deducted\n\n" +
      "Progress is ONLY saved if you click 'Complete Round' instead.\n\n" +
      "Are you sure you want to exit and LOSE all progress?"
    );

    if (confirmed) {
      try {
        // Clear all saved code for this round from localStorage
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`code_${roundId}_`)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`Cleared ${keysToRemove.length} saved code entries from localStorage`);

        // Call API to delete submissions and reset progress
        await exitRound(roundId);
        // Navigate back to dashboard
        onExitRound();
      } catch (error: any) {
        console.error('Error exiting round:', error);
        alert(error.response?.data?.message || 'Failed to exit round. Please try again.');
      }
    }
  };

  const handleCompleteRound = async () => {
    const totalPointsEarned = questions.reduce((sum, q) => sum + (q.status === 'solved' ? q.points : 0), 0);
    const confirmed = window.confirm(
      "✅ MARK ROUND AS COMPLETE?\n\n" +
      "By completing this round:\n" +
      "• Your current progress and points will be PERMANENTLY SAVED\n" +
      "• You will NOT be able to re-enter this round again\n" +
      "• All other teams will see your final score on the leaderboard\n\n" +
      "Are you sure you want to submit your final results?"
    );

    if (confirmed) {
      try {
        // Call API to mark round as completed
        await completeRound(roundId);
        // Exit to dashboard
        onExitRound();
      } catch (error: any) {
        console.error('Error completing round:', error);
        alert(error.response?.data?.message || 'Failed to complete round. Please try again.');
      }
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleQuestionSelect = (questionId: string) => {
    setSelectedQuestion(questionId);
  };

  const handleQuestionStatusChange = (questionId: string, status: Question['status']) => {
    setQuestions((prev) =>
      prev.map((q) => (q._id === questionId ? { ...q, status } : q))
    );
  };

  const solvedCount = questions.filter((q) => q.status === 'solved').length;
  const totalPoints = questions
    .filter((q) => q.status === 'solved')
    .reduce((sum, q) => sum + q.points, 0);

  const handleUseSabotage = async (targetTeamId: string, sabotageType: string) => {
    if (sabotageTokens > 0) {
      try {
        const response = await launchSabotage(targetTeamId, sabotageType);
        if (response.success) {
          setSabotageTokens((prev) => prev - 1);
          setTacticalMessage({ text: `Launched ${sabotageType} attack!`, type: 'success' });
          if (response.data?.cooldownUntil) {
            setSabotageCooldown(new Date(response.data.cooldownUntil).getTime());
          }
          setTimeout(() => setTacticalMessage(null), 3000);
        }
      } catch (err: any) {
        console.error('Failed to launch sabotage:', err);
        const message = err.response?.data?.message || 'Failed to launch sabotage';
        setTacticalMessage({ text: message, type: 'error' });
        if (err.response?.data?.cooldownUntil) {
          setSabotageCooldown(new Date(err.response.data.cooldownUntil).getTime());
        }
        setTimeout(() => setTacticalMessage(null), 5000);
      }
    }
  };

  const handleActivateShield = async () => {
    if (shieldTokens > 0 && !isShieldActive) {
      try {
        const response = await activateShield();
        if (response.success) {
          setShieldTokens((prev) => prev - 1);
          setIsShieldActive(true);
          setTacticalMessage({ text: 'Shield activated!', type: 'success' });

          if (response.data?.shieldCooldownUntil) {
            setShieldCooldown(new Date(response.data.shieldCooldownUntil).getTime());
          }

          // Shield duration from response or default to 10 mins (backend default)
          const duration = response.data?.shieldExpiresAt
            ? new Date(response.data.shieldExpiresAt).getTime() - Date.now()
            : 600000;

          setTimeout(() => {
            setIsShieldActive(false);
          }, duration);
          setTimeout(() => setTacticalMessage(null), 3000);
        }
      } catch (err: any) {
        console.error('Failed to activate shield:', err);
        const message = err.response?.data?.message || 'Failed to activate shield';
        setTacticalMessage({ text: message, type: 'error' });
        if (err.response?.data?.cooldownUntil) {
          setShieldCooldown(new Date(err.response.data.cooldownUntil).getTime());
        }
        setTimeout(() => setTacticalMessage(null), 5000);
      }
    }
  };

  const handleEffectEnd = (effect: SabotageEffect) => {
    setActiveEffects((prev) => prev.filter((e) => e !== effect));
  };


  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading round...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !round) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Round not found'}</p>
          <button
            onClick={onExitRound}
            className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const selectedQuestionData = questions.find((q) => q._id === selectedQuestion);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Sabotage Effects Overlay */}
      <SabotageEffects
        activeEffects={activeEffects}
        isShieldActive={isShieldActive}
        onEffectEnd={handleEffectEnd}
      />

      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleExitRound}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">{round.name}</h1>
              <p className="text-sm text-gray-400">{teamName}</p>
            </div>
            <button
              onClick={handleCompleteRound}
              className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Complete Round
            </button>
          </div>

          <div className="flex items-center gap-6">
            {/* Timer */}
            <div className="flex items-center gap-2 bg-black border border-zinc-800 rounded-lg px-4 py-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-xs text-gray-400">Time Left</p>
                <p className="text-lg font-bold text-white font-mono">{formatTime(timeRemaining)}</p>
              </div>
            </div>


            {/* Stats Overview */}
            <div className="flex items-center gap-2 bg-black border border-zinc-800 rounded-lg px-4 py-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-xs text-gray-400">Currency</p>
                <p className="text-lg font-bold text-white font-mono">{teamPoints}</p>
              </div>
            </div>



            {/* Current Round Score */}
            <div className="bg-black border border-zinc-800 rounded-lg px-4 py-2">
              <p className="text-xs text-gray-400 uppercase font-bold">Round Progress</p>
              <p className="text-lg font-bold text-white">
                {totalPoints} pts <span className="text-sm text-gray-500 font-normal">({solvedCount}/{questions.length})</span>
              </p>
            </div>

            {/* Tokens Display */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-black border border-zinc-800 rounded-lg px-3 py-2">
                <Zap className="w-4 h-4 text-red-500" />
                <span className="text-white font-medium">{sabotageTokens}</span>
              </div>
              <div className="flex items-center gap-2 bg-black border border-zinc-800 rounded-lg px-3 py-2">
                <ShieldIcon className="w-4 h-4 text-blue-500" />
                <span className="text-white font-medium">{shieldTokens}</span>
              </div>
            </div>

            {/* Tactical Panel Button */}
            <TacticalPanel
              sabotageTokens={sabotageTokens}
              shieldTokens={shieldTokens}
              currentPoints={teamPoints}
              isShieldActive={isShieldActive}
              onUseSabotage={handleUseSabotage}
              onActivateShield={handleActivateShield}
              onPurchaseToken={async (type, cost) => {
                try {
                  const updatedStats = await purchaseToken(type, cost);
                  setTeamPoints(updatedStats.points);
                  setTeamScore(updatedStats.score);
                  setSabotageTokens(updatedStats.tokens.sabotage);
                  setShieldTokens(updatedStats.tokens.shield);
                } catch (err: any) {
                  console.error('Error purchasing token:', err);
                  setTacticalMessage({ text: err.response?.data?.message || 'Failed to purchase token', type: 'error' });
                  setTimeout(() => setTacticalMessage(null), 3000);
                }
              }}
              targets={allTeams}
              sabotageCooldown={sabotageCooldown}
              shieldCooldown={shieldCooldown}
              message={tacticalMessage}
            />
          </div>
        </div>
      </header>

      {/* Tactical Message Notification */}
      {tacticalMessage && (
        <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl border shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${tacticalMessage.type === 'success'
          ? 'bg-green-500/10 border-green-500/50 text-green-500'
          : 'bg-red-500/10 border-red-500/50 text-red-500'
          }`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-5 h-5 ${tacticalMessage.type === 'success' ? 'hidden' : ''}`} />
            <Zap className={`w-5 h-5 ${tacticalMessage.type === 'error' ? 'hidden' : ''}`} />
            <span className="font-bold">{tacticalMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Question List - Left Sidebar Panel */}
        <div className="w-80 border-r border-zinc-800 flex-shrink-0 overflow-hidden">
          <QuestionList
            questions={questions}
            selectedQuestionId={selectedQuestion}
            onSelectQuestion={handleQuestionSelect}
          />
        </div>

        {/* Main Content Area - Code Editor and Problem Description */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedQuestionData ? (
            <ProblemView
              roundId={roundId}
              question={selectedQuestionData}
              activeEffects={activeEffects}
              isShieldActive={isShieldActive}
              onStatusChange={(status) => handleQuestionStatusChange(selectedQuestionData._id, status)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-400">Select a question to start coding</p>
            </div>
          )}
        </div>
      </div>

      {/* Disqualified Overlay */}
      {isDisqualified && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6 text-center backdrop-blur-sm">
          <div className="max-w-md w-full bg-zinc-900 border border-red-900/50 rounded-2xl p-8 shadow-2xl shadow-red-900/20">
            <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Disqualified</h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Your team has been disqualified from this round due to a rules violation.
              You can no longer participate in this competition.
            </p>
            <button
              onClick={onExitRound}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Cheating Warning Overlay - Highest Priority */}
      {isCheatingWarningOpen && !isDisqualified && (
        <div className="fixed inset-0 z-[110] bg-red-600/20 flex items-center justify-center p-6 text-center backdrop-blur-sm transition-all duration-300">
          <div className="max-w-md w-full bg-zinc-900 border-2 border-red-500 rounded-2xl p-8 shadow-2xl shadow-red-500/20 animate-in fade-in zoom-in">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-500 animate-pulse" />
            </div>
            <h2 className="text-3xl font-bold text-red-500 mb-4 uppercase tracking-tighter italic">Warning</h2>
            <p className="text-white text-lg font-bold mb-4">
              RULES VIOLATION DETECTED
            </p>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Switching tabs, closing full screen, or losing focus is strictly prohibited during the round. 
              This event has been logged and reported to the administrators.
            </p>
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-sm text-red-400 font-mono mb-6">
              CONTINUED VIOLATIONS WILL LEAD TO DISQUALIFICATION
            </div>
            <button
               onClick={() => setIsCheatingWarningOpen(false)}
               className="w-full py-4 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Warning Overlay */}
      {!isFullscreen && !isDisqualified && !loading && !isCheatingWarningOpen && (
        <div className="fixed inset-0 z-[90] bg-black/90 flex items-center justify-center p-6 text-center backdrop-blur-md">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Maximize className="w-8 h-8 text-white animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Full Screen Required</h2>
            <p className="text-gray-400 mb-8">
              To ensure a fair competition, this round must be completed in full screen mode.
              Switching out of full screen or changing tabs may lead to disqualification.
            </p>
            <button
              onClick={enterFullscreen}
              className="w-full bg-white hover:bg-gray-200 text-black py-3 rounded-xl font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Enter Full Screen
            </button>
          </div>
        </div>
      )}

    </div>
  );
}