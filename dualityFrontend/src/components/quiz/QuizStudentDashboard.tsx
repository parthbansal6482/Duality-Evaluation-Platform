import { useState, useEffect } from 'react';
import { ClipboardList, Play, CheckCircle2, User, LogOut } from 'lucide-react';
import { getQuizzes } from '../../services/quiz.service';
import { QuizSolve } from './QuizSolve';

export function QuizStudentDashboard({
  userName,
  onLogout
}: {
  userName: string;
  onLogout: () => void;
}) {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const data = await getQuizzes(); // Will return active quizzes for students
      if (data.success) setQuizzes(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (activeQuizId) {
      return <QuizSolve quizId={activeQuizId} onBack={() => setActiveQuizId(null)} />;
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-white"/>
            <div>
               <h1 className="text-xl font-bold text-white">Quizzes</h1>
               <p className="text-xs text-gray-500">Evaluation Platform</p>
            </div>
        </div>
        <div className="flex items-center gap-4 text-gray-400">
            <User className="w-4 h-4"/> {userName}
            <button onClick={onLogout} className="flex gap-2 items-center hover:text-white px-3 py-1.5 rounded-lg bg-zinc-800"><LogOut className="w-4 h-4" /> Logout</button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
         <h2 className="text-2xl font-bold text-white mb-6">Active Quizzes</h2>
         <div className="grid md:grid-cols-2 gap-4">
             {quizzes.map(quiz => (
                 <div key={quiz._id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                     <h3 className="text-xl font-bold text-white mb-2">{quiz.title}</h3>
                     <p className="text-gray-400 text-sm mb-6">{quiz.durationMinutes} Minutes • {quiz.questions?.length || 0} Questions</p>
                     <button onClick={() => setActiveQuizId(quiz._id)} className="w-full py-3 bg-white text-black rounded-lg font-medium flex justify-center items-center gap-2 hover:bg-gray-200">
                         <Play className="w-4 h-4" /> Start Quiz
                     </button>
                 </div>
             ))}
             {quizzes.length === 0 && <p className="text-gray-500">No active quizzes at the moment.</p>}
         </div>
      </main>
    </div>
  );
}
