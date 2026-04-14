import { useState, useEffect, useRef } from 'react';
import { Play, Send, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { MonacoCodeEditor } from '../ui/MonacoCodeEditor';
import { runCode, submitSolution } from '../../services/round.service';
import { getSettings } from '../../services/settings.service';

interface Question {
  _id: string;  // MongoDB ID
  id: string;   // Keep for backward compatibility
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  points: number;
  status: 'unsolved' | 'attempted' | 'solved';
  category: string;
  boilerplateCode?: {
    python?: string;
    c?: string;
    cpp?: string;
    java?: string;
  };
}

interface SabotageEffect {
  type: 'blackout' | 'typing-delay' | 'format-chaos' | 'ui-glitch';
  endTime: number;
  fromTeam?: string;
}

interface CodeEditorProps {
  roundId: string;
  question: Question;
  activeEffects: SabotageEffect[];
  isShieldActive: boolean;
  onStatusChange: (status: Question['status']) => void;
}

type Language = 'python' | 'c' | 'cpp' | 'java';

interface TestResult {
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  error?: string;
  executionTime?: number;
  memoryUsed?: number;
}

// Default fallback boilerplate
const defaultBoilerplate: Record<Language, string> = {
  python: '# Write your solution here\n',
  c: '// Write your solution here\n',
  cpp: '// Write your solution here\n',
  java: '// Write your solution here\n',
};

// Storage key for code persistence
const getStorageKey = (roundId: string, questionId: string, language: string) =>
  `code_${roundId}_${questionId}_${language}`;

export function CodeEditor({ roundId, question, activeEffects, isShieldActive, onStatusChange }: CodeEditorProps) {
  const [language, setLanguage] = useState<Language>('python');

  // Track previous question ID to detect changes
  const prevQuestionIdRef = useRef(question._id);

  // Get boilerplate code for current language
  const getBoilerplate = (lang: Language): string => {
    return question.boilerplateCode?.[lang] || defaultBoilerplate[lang];
  };

  // Get saved code from localStorage or use boilerplate
  const getSavedCode = (questionId: string, lang: Language): string => {
    const key = getStorageKey(roundId, questionId, lang);
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      return saved;
    }
    // Return boilerplate for the specific question
    return question.boilerplateCode?.[lang] || defaultBoilerplate[lang];
  };

  const [code, setCode] = useState(() => getSavedCode(question._id, language));
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isPasteEnabled, setIsPasteEnabled] = useState(true);

  // Fetch settings on mount
  useEffect(() => {
    getSettings().then(res => {
      if (res.success && res.data) {
        setIsPasteEnabled(res.data.isPasteEnabled !== false);
      }
    }).catch(console.error);
  }, []);

  // Handle question change - load saved code for new question
  useEffect(() => {
    if (prevQuestionIdRef.current !== question._id) {
      // Question changed - load saved code for new question
      const savedCode = getSavedCode(question._id, language);
      setCode(savedCode);
      setTestResults(null);
      setSubmissionError(null);
      prevQuestionIdRef.current = question._id;
    }
  }, [question._id, language]);

  // Save code to localStorage when it changes (debounced to avoid saving during question switch)
  useEffect(() => {
    // Only save if we're on the current question (ref matches current)
    if (prevQuestionIdRef.current === question._id) {
      const key = getStorageKey(roundId, question._id, language);
      localStorage.setItem(key, code);
    }
  }, [code, roundId, question._id, language]);

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setCode(getSavedCode(question._id, newLanguage));
    setTestResults(null);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setSubmissionError(null);

    try {
      // Call the run endpoint (sample tests only, no submission)
      const response = await runCode(roundId, question._id, code, language);

      if (response.success) {
        // Map results to TestResult format
        const results: TestResult[] = response.data.results.map((result: any) => ({
          passed: result.passed,
          input: result.input,
          expectedOutput: result.expectedOutput,
          actualOutput: result.actualOutput,
          error: result.error,
          executionTime: result.executionTime,
          memoryUsed: result.memoryUsed,
        }));

        setTestResults(results);
      } else {
        setSubmissionError(response.message || 'Failed to run code');
      }
    } catch (error: any) {
      console.error('Error running code:', error);
      setSubmissionError(error.response?.data?.message || 'Failed to run code');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmissionError(null);
    setTestResults(null);

    try {
      // Submit to real API
      const response = await submitSolution(roundId, question._id, code, language);

      if (response.success && response.data.results) {
        // Map backend response to test results format
        const results: TestResult[] = response.data.results.map((result: any) => ({
          passed: result.passed,
          input: result.input,
          expectedOutput: result.expectedOutput,
          actualOutput: result.actualOutput,
          error: result.error,
          executionTime: result.executionTime,
          memoryUsed: result.memoryUsed,
        }));

        setTestResults(results);

        // Update question status
        if (response.data.status === 'accepted') {
          onStatusChange('solved');
        } else {
          onStatusChange('attempted');
        }
      } else {
        setSubmissionError(response.message || 'Failed to submit solution');
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      setSubmissionError(error.response?.data?.message || 'Failed to submit solution');
    } finally {
      setIsSubmitting(false);
    }
  };

  const allTestsPassed = testResults?.every((result) => result.passed) ?? false;
  const passedCount = testResults?.filter((result) => result.passed).length ?? 0;
  const totalCount = testResults?.length ?? 0;

  return (
    <div className="h-full flex flex-col">
      {/* Editor Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="text-sm text-gray-400">Language:</label>
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            className="bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-zinc-600 transition-colors"
          >
            <option value="python">Python</option>
            <option value="c">C</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRun}
            disabled={isRunning || isSubmitting}
            className="bg-zinc-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Code
              </>
            )}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting}
            className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Code Editor */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <MonacoCodeEditor
            language={language}
            value={code}
            onChange={setCode}
            readOnly={activeEffects.some((e) => e.type === 'blackout')}
            typingDelay={activeEffects.find((e) => e.type === 'typing-delay') ? 2000 : 0}
            onRun={handleRun}
            onSubmit={handleSubmit}
            disablePaste={!isPasteEnabled}
          />
        </div>

        {/* Results Panel - Always visible */}
        <div className="w-96 flex-shrink-0 border-l border-zinc-800 bg-zinc-900 overflow-y-auto">
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Execution Results</h3>

            {/* Loading State - Running */}
            {isRunning && (
              <div className="p-4 rounded-lg border bg-blue-500/10 border-blue-500/30">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  <div>
                    <h4 className="font-bold text-blue-500">Running Code...</h4>
                    <p className="text-sm text-blue-400">Testing against sample test cases</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State - Submitting */}
            {isSubmitting && (
              <div className="p-4 rounded-lg border bg-yellow-500/10 border-yellow-500/30">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
                  <div>
                    <h4 className="font-bold text-yellow-500">Submitting...</h4>
                    <p className="text-sm text-yellow-400">Evaluating against all test cases</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {submissionError && !isRunning && !isSubmitting && (
              <div className="p-4 rounded-lg border bg-red-500/10 border-red-500/30">
                <div className="flex items-center gap-3 mb-2">
                  <XCircle className="w-6 h-6 text-red-500" />
                  <h4 className="text-lg font-bold text-red-500">Error</h4>
                </div>
                <p className="text-sm text-red-400">{submissionError}</p>
              </div>
            )}

            {/* Overall Status */}
            {testResults && !isRunning && !isSubmitting && (
              <div className={`p-4 rounded-lg border ${allTestsPassed
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-red-500/10 border-red-500/30'
                }`}>
                <div className="flex items-center gap-3 mb-2">
                  {allTestsPassed ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                  <h4 className={`text-lg font-bold ${allTestsPassed ? 'text-green-500' : 'text-red-500'
                    }`}>
                    {allTestsPassed ? 'All Tests Passed!' : 'Some Tests Failed'}
                  </h4>
                </div>
                <p className={`text-sm ${allTestsPassed ? 'text-green-400' : 'text-red-400'
                  }`}>
                  {passedCount} / {totalCount} test cases passed
                </p>
              </div>
            )}

            {/* Test Results */}
            {testResults && !isRunning && !isSubmitting && (
              <div className="space-y-3">
                <h4 className="text-white font-medium">Test Cases</h4>
                {testResults.map((result: TestResult, index: number) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${result.passed
                      ? 'bg-green-500/5 border-green-500/20'
                      : 'bg-red-500/5 border-red-500/20'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {result.passed ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`font-medium ${result.passed ? 'text-green-500' : 'text-red-500'
                        }`}>
                        Test Case {index + 1}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-gray-400 mb-1">Input:</p>
                        <pre className="bg-black p-2 rounded text-gray-300 font-mono text-xs overflow-x-auto">
                          {result.input}
                        </pre>
                      </div>

                      <div>
                        <p className="text-gray-400 mb-1">Expected:</p>
                        <pre className="bg-black p-2 rounded text-gray-300 font-mono text-xs overflow-x-auto">
                          {result.expectedOutput}
                        </pre>
                      </div>

                      {result.actualOutput && (
                        <div>
                          <p className="text-gray-400 mb-1">Your Output:</p>
                          <pre className={`bg-black p-2 rounded font-mono text-xs overflow-x-auto ${result.passed ? 'text-green-400' : 'text-red-400'
                            }`}>
                            {result.actualOutput}
                          </pre>
                        </div>
                      )}

                      {result.error && (
                        <div>
                          <p className="text-red-400 mb-1">Error:</p>
                          <pre className="bg-black p-2 rounded text-red-400 font-mono text-xs overflow-x-auto">
                            {result.error}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!testResults && !submissionError && !isRunning && !isSubmitting && (
              <div className="p-6 text-center text-gray-500">
                <p className="mb-2">No results yet</p>
                <p className="text-sm">Click "Run Code" to test with sample cases or "Submit" to submit your solution</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}