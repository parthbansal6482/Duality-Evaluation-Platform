import { useState, useEffect } from 'react';
import { ArrowLeft, Play, CheckCircle2, XCircle, Code2, FileText, Clock, RotateCcw } from 'lucide-react';
import { getDualityQuestion, submitDualityCode, runDualityCode, getDualitySettings } from '../../services/duality.service';
import { MonacoCodeEditor } from '../ui/MonacoCodeEditor';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { dualitySocket } from '../../services/dualitySocket.service';

interface TestCase {
  input: string;
  expectedOutput: string;
  passed?: boolean;
  actualOutput?: string;
  error?: string;
  executionTime?: number;
  memoryUsed?: number;
}

interface Problem {
  _id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  description: string;
  constraints: string[];
  examples: { input: string; output: string; explanation?: string }[];
  boilerplate: {
    python?: string;
    c?: string;
    cpp?: string;
    java?: string;
  };
}

type Language = 'python' | 'c' | 'cpp' | 'java';

const getDualityUserId = (): string => {
  try {
    const dualityUser = localStorage.getItem('dualityUser');
    if (!dualityUser) return 'guest';
    const parsed = JSON.parse(dualityUser);
    return parsed?.id || parsed?._id || 'guest';
  } catch {
    return 'guest';
  }
};

const getDraftStorageKey = (userId: string, problemId: string, language: Language) =>
  `duality_draft_${userId}_${problemId}_${language}`;

export function ProblemSolve({
  problemId,
  onBack
}: {
  problemId: string;
  onBack: () => void;
}) {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('python');
  const [code, setCode] = useState('');
  const [problem, setProblem] = useState<Problem | null>(null);
  const [testResults, setTestResults] = useState<TestCase[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<{ isPasteEnabled?: boolean }>({ isPasteEnabled: true });
  const dualityUserId = getDualityUserId();

  const getDraftOrBoilerplate = (lang: Language, currentProblem: Problem | null): string => {
    if (!currentProblem) return '';
    const key = getDraftStorageKey(dualityUserId, problemId, lang);
    const savedDraft = localStorage.getItem(key);
    if (savedDraft !== null) return savedDraft;
    return currentProblem.boilerplate?.[lang] || '';
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [problemResult, settingsResult] = await Promise.all([
           getDualityQuestion(problemId),
           getDualitySettings().catch(() => ({ success: false, data: {} }))
        ]);
        
        if (settingsResult.success) {
           setSettings(settingsResult.data);
        }

        if (problemResult.success) {
          setProblem(problemResult.data);
          setCode(getDraftOrBoilerplate(selectedLanguage, problemResult.data));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();

    // Listen for real-time submission updates
    dualitySocket.connect();
    
    const handleSubmissionUpdate = (data: any) => {
      // Only process if it's our active submission
      if (activeSubmissionId && data.submissionId === activeSubmissionId) {
        setTestResults(data.testResults || data.results);
        setIsSubmitting(false);
        setActiveSubmissionId(null);

        // Show success/failure alert
        if (data.status === 'accepted') {
          alert('Solution accepted! You passed all test cases.');
        } else {
          alert(`Solution failed. Status: ${data.status.replace(/_/g, ' ')}`);
        }
      }
    };

    dualitySocket.on('duality:submission:update', handleSubmissionUpdate);

    return () => {
      dualitySocket.off('duality:submission:update', handleSubmissionUpdate);
    };
  }, [problemId, activeSubmissionId]);

  const handleLanguageChange = (lang: Language) => {
    setSelectedLanguage(lang);
    setCode(getDraftOrBoilerplate(lang, problem));
    setTestResults(null);
  };

  useEffect(() => {
    if (!problem) return;
    const key = getDraftStorageKey(dualityUserId, problemId, selectedLanguage);
    localStorage.setItem(key, code);
  }, [code, problem, problemId, selectedLanguage, dualityUserId]);

  const handleRunCode = async () => {
    setIsRunning(true);
    setTestResults(null);

    try {
      const result = await runDualityCode(problemId, code, selectedLanguage);
      if (result.success && result.data) {
        setTestResults(result.data.results);
      } else {
        alert('Failed to run code: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Run error:', error);
      alert('Failed to run code. Ensure Docker is running or check server logs.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setTestResults(null);
    try {
      const result = await submitDualityCode(problemId, code, selectedLanguage);
      if (result.success && result.data) {
        setActiveSubmissionId(result.data.submissionId);
        // The results will be handled by the Socket event listener
      } else {
        setIsSubmitting(false);
        alert('Failed to submit code: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit code');
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (confirm('Reset code to starter template?') && problem?.boilerplate) {
      setCode(problem.boilerplate[selectedLanguage] || '');
      setTestResults(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Problem not found.
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-500';
      case 'Medium': return 'text-yellow-500';
      case 'Hard': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const passedTests = testResults?.filter(t => t.passed).length || 0;
  const totalTests = testResults?.length || 0;

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden z-50">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Problems</span>
            </button>
            <div className="h-6 w-px bg-zinc-800"></div>
            <div className="flex items-center gap-3">
              <Code2 className="w-5 h-5 text-white" />
              <div>
                <h1 className="text-lg font-bold text-white">{problem.title}</h1>
                <div className="flex items-center gap-2 text-xs">
                  <span className={getDifficultyColor(problem.difficulty)}>{problem.difficulty}</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-500">{problem.category}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-sm">Reset</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left Panel - Problem Description */}
          <Panel defaultSize={40} minSize={25} className="border-r border-zinc-800 overflow-y-auto bg-zinc-950/30">
            <div className="p-6 space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Description
              </h3>
              <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                {problem.description}
              </div>
            </div>

            {/* Examples */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Examples</h3>
              <div className="space-y-4">
                {problem.examples.map((example, index) => (
                  <div key={index} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                    <div className="text-xs font-medium text-gray-500 mb-2">Example {index + 1}</div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Input: </span>
                        <code className="text-white font-mono">{example.input}</code>
                      </div>
                      <div>
                        <span className="text-gray-500">Output: </span>
                        <code className="text-white font-mono">{example.output}</code>
                      </div>
                      {example.explanation && (
                        <div>
                          <span className="text-gray-500">Explanation: </span>
                          <span className="text-gray-400">{example.explanation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Constraints */}
            {problem.constraints && problem.constraints.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Constraints</h3>
                <ul className="space-y-2">
                  {problem.constraints.map((constraint, index) => (
                    <li key={index} className="text-sm text-gray-400 flex gap-2">
                      <span className="text-gray-600">•</span>
                      <code className="font-mono">{constraint}</code>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-zinc-800 hover:bg-blue-500 transition-colors cursor-col-resize" />

        {/* Right Panel - Code Editor */}
        <Panel defaultSize={60} minSize={30} className="flex flex-col bg-black">
          {/* Header & Controls */}
          <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-3 flex items-center justify-between">
            <div className="flex gap-2">
              {(['python', 'c', 'cpp', 'java'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedLanguage === lang
                    ? 'bg-white text-black'
                    : 'bg-zinc-800 text-gray-400 hover:text-white'
                    }`}
                >
                  {lang === 'cpp' ? 'C++' : lang === 'c' ? 'C' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRunCode}
                disabled={isRunning || isSubmitting}
                className="bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isRunning ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Run Code
              </button>
              <button
                onClick={handleSubmit}
                disabled={isRunning || isSubmitting}
                className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                Submit
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            <PanelGroup direction="vertical">
              {/* Monaco Code Editor */}
              <Panel defaultSize={(testResults || isRunning || isSubmitting) ? 60 : 100} minSize={20} className="relative min-h-0 flex flex-col w-full h-full">
                <div className="absolute inset-0">
                  <MonacoCodeEditor
                    language={selectedLanguage}
                    value={code}
                    onChange={(val) => setCode(val)}
                    onRun={handleRunCode}
                    onSubmit={handleSubmit}
                    disablePaste={!settings.isPasteEnabled}
                  />
                </div>
              </Panel>

              {/* Test Results */}
              {(testResults || isRunning || isSubmitting) && (
                <>
                  <PanelResizeHandle className="h-2 bg-zinc-900 hover:bg-blue-600/50 transition-colors flex items-center justify-center group cursor-row-resize z-10 w-full relative">
                    <div className="w-8 h-1 bg-zinc-700 group-hover:bg-blue-400 rounded-full" />
                  </PanelResizeHandle>

                  <Panel defaultSize={40} minSize={20} className="flex flex-col min-h-0 bg-zinc-900 overflow-hidden w-full h-full">
                    <div className="px-6 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                      <h3 className="text-sm font-medium text-white flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Test Results
                      </h3>
                      {testResults && (
                        <div className="text-sm">
                          <span className={passedTests === totalTests ? 'text-green-500' : 'text-yellow-500'}>
                            {passedTests}/{totalTests} Passed
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {(isRunning || isSubmitting) ? (
                        <div className="flex items-center justify-center h-full text-blue-400 gap-3">
                          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          {isSubmitting ? 'Evaluating Submission...' : 'Running Tests...'}
                        </div>
                      ) : testResults?.map((test, index) => (
                        <div
                          key={index}
                          className={`border rounded-lg p-4 ${test.passed
                            ? 'border-green-500/20 bg-green-500/5'
                            : 'border-red-500/20 bg-red-500/5'
                            }`}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            {test.passed ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className={`font-medium ${test.passed ? 'text-green-500' : 'text-red-500'}`}>
                              Test Case {index + 1} {index < (problem?.examples?.length || 0) ? '(Example)' : '(Hidden)'}
                            </span>
                          </div>
                          <div className="space-y-3 text-sm">
                            <div>
                              <span className="text-gray-500 block mb-1">Input:</span>
                              <pre className="bg-black/50 p-2 rounded text-gray-300 font-mono text-xs overflow-x-auto">{test.input}</pre>
                            </div>
                            <div>
                              <span className="text-gray-500 block mb-1">Expected Output:</span>
                              <pre className="bg-black/50 p-2 rounded text-gray-300 font-mono text-xs overflow-x-auto">{test.expectedOutput}</pre>
                            </div>
                            {test.actualOutput && (
                              <div>
                                <span className="text-gray-500 block mb-1">Your Output:</span>
                                <pre className={`bg-black/50 p-2 rounded font-mono text-xs overflow-x-auto ${test.passed ? 'text-green-400' : 'text-red-400'}`}>
                                  {test.actualOutput}
                                </pre>
                              </div>
                            )}
                            {test.error && (
                              <div>
                                <span className="text-gray-500 block mb-1">Error:</span>
                                <pre className="bg-red-500/10 p-2 rounded text-red-400 font-mono text-xs overflow-x-auto">
                                  {test.error}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Panel>
                </>
              )}
            </PanelGroup>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  </div>
  );
}
