import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Code2, ChevronLeft, ChevronRight, Play, CheckCircle2, XCircle } from 'lucide-react';
import { getQuiz, submitQuizAnswer } from '../../services/quiz.service';
import { getDualitySettings } from '../../services/duality.service';
import { MonacoCodeEditor } from '../ui/MonacoCodeEditor';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

interface TestCaseResult {
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  error?: string;
  executionTime?: number;
}

export function QuizSolve({
  quizId,
  onBack
}: {
  quizId: string;
  onBack: () => void;
}) {
  const [quiz, setQuiz] = useState<any>(null);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<'python' | 'c' | 'cpp' | 'java'>('python');
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<TestCaseResult[] | null>(null);
  const [settings, setSettings] = useState<{ isPasteEnabled?: boolean }>({ isPasteEnabled: true });
  
  useEffect(() => {
    fetchQuiz();
    getDualitySettings().then(res => { if(res.success) setSettings(res.data) }).catch(console.error);
  }, []);

  const fetchQuiz = async () => {
    try {
      const data = await getQuiz(quizId);
      if (data.success) {
          setQuiz(data.data);
          if (data.data.questions?.length > 0) {
              setCode(data.data.questions[0].boilerplate?.python || '');
          }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (lang: 'python' | 'c' | 'cpp' | 'java') => {
      setLanguage(lang);
      const q = quiz.questions[currentQIdx];
      setCode(q.boilerplate?.[lang] || '');
      setTestResults(null);
  };

  const handleNext = () => {
      if (currentQIdx < quiz.questions.length - 1) {
          const nextIdx = currentQIdx + 1;
          setCurrentQIdx(nextIdx);
          setCode(quiz.questions[nextIdx].boilerplate?.[language] || '');
          setTestResults(null);
      }
  };

  const handlePrev = () => {
      if (currentQIdx > 0) {
          const prevIdx = currentQIdx - 1;
          setCurrentQIdx(prevIdx);
          setCode(quiz.questions[prevIdx].boilerplate?.[language] || '');
          setTestResults(null);
      }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setTestResults(null);
    try {
      const qId = quiz.questions[currentQIdx]._id;
      const res = await submitQuizAnswer(quizId, { 
        questionId: qId, 
        code, 
        language, 
        isRunOnly: true 
      });
      if (res.success && res.data) {
        setTestResults(res.data.results);
      } else {
        alert('Failed to run code: ' + (res.message || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Error running code.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setTestResults(null);
    try {
        const qId = quiz.questions[currentQIdx]._id;
        const res = await submitQuizAnswer(quizId, { 
          questionId: qId, 
          code, 
          language,
          isRunOnly: false
        });
        if (res.success && res.data) {
            setTestResults(res.data.results);
            if (res.data.status === 'accepted') {
              alert('Perfect! Answer accepted and saved.');
            } else {
              alert(`Attempt saved. Status: ${res.data.status.replace(/_/g, ' ')}`);
            }
        } else {
            alert('Failed to submit answer.');
        }
    } catch (err) {
        console.error(err);
        alert('Error submitting answer.');
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
  if (!quiz || !quiz.questions?.length) return <div className="min-h-screen bg-black text-white p-6">Quiz not found or has no questions.<br/><button onClick={onBack} className="mt-4 text-blue-500">Go Back</button></div>;

  const q = quiz.questions[currentQIdx];
  const passedTests = testResults?.filter(t => t.passed).length || 0;
  const totalTests = testResults?.length || 0;

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
       <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
           <div className="flex gap-4 items-center">
               <button onClick={onBack} className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5"/></button>
               <div>
                <h1 className="text-white font-bold">{quiz.title}</h1>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Assignment Mode</div>
               </div>
           </div>
           <div className="text-white flex gap-2 items-center text-sm bg-zinc-800 px-4 py-1.5 rounded-full border border-zinc-700">
            <Clock className="w-4 h-4 text-blue-400"/> 
            Question {currentQIdx + 1} of {quiz.questions.length}
           </div>
       </header>

       <div className="flex-1 flex overflow-hidden">
           <div className="w-1/3 border-r border-zinc-800 p-6 overflow-y-auto bg-zinc-950">
               <h2 className="text-2xl font-bold text-white mb-2">{q.title}</h2>
               <div className="flex gap-2 mb-6">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${q.difficulty === 'Easy' ? 'bg-green-500/10 text-green-500' : q.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}`}>{q.difficulty}</span>
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-gray-400 text-[10px] font-bold uppercase">{q.category}</span>
               </div>
               <div className="text-gray-300 whitespace-pre-line mb-8 text-sm leading-relaxed">{q.description}</div>
               
               <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Examples</h3>
                {q.examples?.map((ex: any, i: number) => (
                    <div key={i} className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 font-mono text-xs">
                        <span className="text-gray-500 block mb-1 uppercase text-[10px]">Input</span>
                        <div className="text-white mb-3 bg-black/50 p-2 rounded">{ex.input}</div>
                        <span className="text-gray-500 block mb-1 uppercase text-[10px]">Expected Output</span>
                        <div className="text-green-400 bg-black/50 p-2 rounded">{ex.output}</div>
                    </div>
                ))}
               </div>
           </div>

           <div className="flex-1 flex flex-col bg-black">
               <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-3 flex items-center justify-between">
                   <div className="flex gap-2">
                       {(['python', 'c', 'cpp', 'java'] as const).map(lang => (
                           <button 
                            key={lang} 
                            onClick={() => handleLanguageChange(lang)} 
                            className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${language === lang ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-zinc-800'}`}
                           >
                            {lang.toUpperCase()}
                           </button>
                       ))}
                   </div>
                   <div className="flex gap-2">
                    <button 
                      onClick={handleRunCode} 
                      disabled={isRunning || isSubmitting} 
                      className="bg-zinc-800 text-gray-300 px-4 py-1.5 rounded text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isRunning ? <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"/> : <Play className="w-4 h-4"/>}
                      Run Code
                    </button>
                    <button 
                      onClick={handleSubmit} 
                      disabled={isRunning || isSubmitting} 
                      className="bg-blue-600 text-white px-6 py-1.5 rounded text-sm font-bold hover:bg-blue-500 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                    </button>
                   </div>
               </div>

               <div className="flex-1 flex flex-col min-h-0">
                <PanelGroup direction="vertical">
                  <Panel defaultSize={70} minSize={20} className="relative">
                    <MonacoCodeEditor 
                      language={language} 
                      value={code} 
                      onChange={setCode} 
                      onRun={handleRunCode} 
                      onSubmit={handleSubmit} 
                      disablePaste={!settings.isPasteEnabled} 
                    />
                  </Panel>

                  {(testResults || isRunning || isSubmitting) && (
                    <>
                      <PanelResizeHandle className="h-1 bg-zinc-800 hover:bg-blue-500 transition-colors cursor-row-resize" />
                      <Panel defaultSize={30} minSize={15} className="bg-zinc-950 flex flex-col overflow-hidden">
                        <div className="px-6 py-2 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Test Results</span>
                          {testResults && (
                            <span className={`text-[10px] font-bold uppercase ${passedTests === totalTests ? 'text-green-500' : 'text-yellow-500'}`}>
                              {passedTests} / {totalTests} Passed
                            </span>
                          )}
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                          {(isRunning || isSubmitting) ? (
                            <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-500">
                              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
                              <span className="text-xs font-medium uppercase tracking-tighter">Executing logic...</span>
                            </div>
                          ) : (
                            testResults?.map((res, i) => (
                              <div key={i} className={`p-3 rounded border ${res.passed ? 'border-green-500/10 bg-green-500/5' : 'border-red-500/10 bg-red-500/5'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                  {res.passed ? <CheckCircle2 className="w-3 h-3 text-green-500"/> : <XCircle className="w-3 h-3 text-red-500"/>}
                                  <span className={`text-[10px] font-bold uppercase ${res.passed ? 'text-green-500' : 'text-red-500'}`}>
                                    Test Case {i + 1} {i < q.examples?.length ? '(Example)' : '(Hidden)'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-[11px] font-mono">
                                  <div>
                                    <div className="text-gray-600 mb-1">Input</div>
                                    <div className="bg-black/40 p-1.5 rounded text-gray-400 break-all">{res.input || 'N/A'}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-600 mb-1">Expected</div>
                                    <div className="bg-black/40 p-1.5 rounded text-gray-400 break-all">{res.expectedOutput}</div>
                                  </div>
                                  <div className="col-span-2">
                                    <div className="text-gray-600 mb-1">Actual Output</div>
                                    <div className={`p-1.5 rounded break-all ${res.passed ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                      {res.actualOutput || (res.error ? 'ERROR' : 'NO OUTPUT')}
                                    </div>
                                  </div>
                                  {res.error && (
                                    <div className="col-span-2">
                                      <div className="text-red-500/70 mb-1">Error Logs</div>
                                      <pre className="bg-red-500/5 p-2 rounded text-red-400/80 whitespace-pre-wrap">{res.error}</pre>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </Panel>
                    </>
                  )}
                </PanelGroup>
               </div>

               <div className="bg-zinc-900 border-t border-zinc-800 px-6 py-3 flex justify-between">
                   <button onClick={handlePrev} disabled={currentQIdx===0} className="px-4 py-1.5 bg-zinc-800 text-gray-400 hover:text-white rounded text-sm border border-zinc-700 flex items-center gap-2 disabled:opacity-30 transition-colors uppercase font-bold text-[10px] tracking-widest"><ChevronLeft className="w-4 h-4"/> Previous</button>
                   <button onClick={handleNext} disabled={currentQIdx===quiz.questions.length-1} className="px-4 py-1.5 bg-zinc-800 text-gray-400 hover:text-white rounded text-sm border border-zinc-700 flex items-center gap-2 disabled:opacity-30 transition-colors uppercase font-bold text-[10px] tracking-widest">Next <ChevronRight className="w-4 h-4"/></button>
               </div>
           </div>
       </div>
    </div>
  );
}

