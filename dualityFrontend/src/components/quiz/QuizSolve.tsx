import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Code2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getQuiz, submitQuizAnswer } from '../../services/quiz.service';
import { getDualitySettings } from '../../services/duality.service';
import { MonacoCodeEditor } from '../ui/MonacoCodeEditor';

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
  const [submitting, setSubmitting] = useState(false);
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
  };

  const handleNext = () => {
      if (currentQIdx < quiz.questions.length - 1) {
          setCurrentQIdx(prev => prev + 1);
          setCode(quiz.questions[currentQIdx + 1].boilerplate?.[language] || '');
      }
  };

  const handlePrev = () => {
      if (currentQIdx > 0) {
          setCurrentQIdx(prev => prev - 1);
          setCode(quiz.questions[currentQIdx - 1].boilerplate?.[language] || '');
      }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
        const qId = quiz.questions[currentQIdx]._id;
        const res = await submitQuizAnswer(quizId, { questionId: qId, code, language });
        if (res.success && res.data) {
            alert(`Answer saved. Status: ${res.data.status}`);
        } else {
            alert('Failed to save answer.');
        }
    } catch (err) {
        console.error(err);
        alert('Error saving answer.');
    } finally {
        setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
  if (!quiz || !quiz.questions?.length) return <div className="min-h-screen bg-black text-white p-6">Quiz not found or has no questions.<br/><button onClick={onBack} className="mt-4 text-blue-500">Go Back</button></div>;

  const q = quiz.questions[currentQIdx];

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
       <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
           <div className="flex gap-4 items-center">
               <button onClick={onBack} className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5"/></button>
               <h1 className="text-white font-bold">{quiz.title}</h1>
           </div>
           <div className="text-white flex gap-2 items-center"><Clock className="w-4 h-4"/> Question {currentQIdx + 1} of {quiz.questions.length}</div>
       </header>

       <div className="flex-1 grid grid-cols-2 overflow-hidden">
           <div className="border-r border-zinc-800 p-6 overflow-y-auto">
               <h2 className="text-2xl font-bold text-white mb-2">{q.title}</h2>
               <div className="text-sm text-gray-500 mb-6">{q.difficulty} • {q.category}</div>
               <div className="text-gray-300 whitespace-pre-line mb-8">{q.description}</div>
               
               {q.examples?.map((ex: any, i: number) => (
                   <div key={i} className="mb-4 bg-zinc-900 p-4 rounded-lg border border-zinc-800 font-mono text-sm">
                       <span className="text-gray-500 block mb-1">Input:</span><div className="text-white mb-2">{ex.input}</div>
                       <span className="text-gray-500 block mb-1">Output:</span><div className="text-white">{ex.output}</div>
                   </div>
               ))}
           </div>
           <div className="flex flex-col bg-black">
               <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-3 flex items-center justify-between">
                   <div className="flex gap-2">
                       {(['python', 'c', 'cpp', 'java'] as const).map(lang => (
                           <button key={lang} onClick={() => handleLanguageChange(lang)} className={`px-4 py-1.5 rounded text-sm ${language === lang ? 'bg-white text-black' : 'text-gray-400'}`}>{lang.toUpperCase()}</button>
                       ))}
                   </div>
                   <button onClick={handleSubmit} disabled={submitting} className="bg-blue-600 text-white px-4 py-2 rounded font-medium disabled:opacity-50">Run & Save</button>
               </div>
               <div className="flex-1 relative">
                   <MonacoCodeEditor language={language} value={code} onChange={setCode} onRun={handleSubmit} onSubmit={handleSubmit} disablePaste={!settings.isPasteEnabled} />
               </div>
               <div className="bg-zinc-900 border-t border-zinc-800 px-6 py-3 flex justify-between">
                   <button onClick={handlePrev} disabled={currentQIdx===0} className="px-4 py-2 bg-zinc-800 text-white rounded flex items-center gap-2 disabled:opacity-50"><ChevronLeft className="w-4 h-4"/> Previous</button>
                   <button onClick={handleNext} disabled={currentQIdx===quiz.questions.length-1} className="px-4 py-2 bg-zinc-800 text-white rounded flex items-center gap-2 disabled:opacity-50">Next <ChevronRight className="w-4 h-4"/></button>
               </div>
           </div>
       </div>
    </div>
  );
}
