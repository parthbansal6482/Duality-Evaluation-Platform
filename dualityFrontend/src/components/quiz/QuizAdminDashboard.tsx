import { useState, useEffect } from 'react';
import { ClipboardList, Plus, Play, Square, Users, Trophy, Trash2, Edit2, LogOut, User } from 'lucide-react';
import { getQuizzes, createQuiz, updateQuiz, deleteQuiz, activateQuiz, endQuiz, getQuizResults } from '../../services/quiz.service';
import { getDualityQuestions, getDualityUsers } from '../../services/duality.service';

export function QuizAdminDashboard({
  userName,
  onLogout
}: {
  userName: string;
  onLogout: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'quizzes' | 'results'>('quizzes');
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', durationMinutes: 30, questions: [] as string[], assignedTo: [] as string[] });
  const [selectedQuizForResults, setSelectedQuizForResults] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    fetchQuizzes();
    fetchQuestions();
    fetchStudents();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const data = await getQuizzes();
      if (data.success) setQuizzes(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQuestions = async () => {
    try {
      const data = await getDualityQuestions();
      if (data.success) setQuestions(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    try {
      const data = await getDualityUsers();
      if (data.success) {
        // Filter out admins so we only assign to students
        const studentOnly = data.data.filter((u: any) => (u.role || 'student') === 'student');
        setStudents(studentOnly);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async () => {
    try {
      await createQuiz(formData);
      setShowModal(false);
      fetchQuizzes();
    } catch (err) {
      console.error(err);
      alert('Failed to create quiz');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this quiz?')) {
      await deleteQuiz(id);
      fetchQuizzes();
    }
  };

  const handleToggleStatus = async (quiz: any) => {
    if (quiz.status === 'draft') await activateQuiz(quiz._id);
    else if (quiz.status === 'active') await endQuiz(quiz._id);
    fetchQuizzes();
  };

  const viewResults = async (quizId: string) => {
    setSelectedQuizForResults(quizId);
    setActiveTab('results');
    try {
      const data = await getQuizResults(quizId);
      if (data.success) setResults(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex gap-6 items-center">
            <h1 className="text-xl font-bold text-white flex gap-2 items-center"><ClipboardList /> Quiz Admin</h1>
            <div className="flex gap-2">
                <button onClick={() => setActiveTab('quizzes')} className={`px-4 py-2 rounded ${activeTab === 'quizzes' ? 'bg-white text-black' : 'text-gray-400'}`}>Quizzes</button>
            </div>
        </div>
        <div className="flex items-center gap-4 text-gray-400">
            <User className="w-4 h-4"/> {userName}
            <button onClick={onLogout} className="flex gap-2 items-center hover:text-white"><LogOut className="w-4 h-4" /> Logout</button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        {activeTab === 'quizzes' && (
            <div>
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold text-white">All Quizzes</h2>
                 <button onClick={() => setShowModal(true)} className="bg-white text-black px-4 py-2 rounded-lg flex items-center gap-2"><Plus className="w-4 h-4"/> Create Quiz</button>
               </div>
               
               <div className="grid gap-4">
                 {quizzes.map((q: any) => (
                    <div key={q._id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-semibold text-white">{q.title}</h3>
                            <p className="text-gray-400 text-sm mt-1">{q.durationMinutes} mins • {q.questions?.length || 0} questions • Assigned to {q.assignedTo?.length || 0} students</p>
                            <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${q.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-zinc-800 text-gray-400'}`}>
                                {q.status.toUpperCase()}
                            </span>
                        </div>
                        <div className="flex gap-3">
                            {q.status === 'draft' && <button onClick={() => handleToggleStatus(q)} className="text-green-500 hover:bg-green-500/10 p-2 rounded"><Play className="w-5 h-5"/></button>}
                            {q.status === 'active' && <button onClick={() => handleToggleStatus(q)} className="text-red-500 hover:bg-red-500/10 p-2 rounded"><Square fill="currentColor" className="w-5 h-5"/></button>}
                            <button onClick={() => viewResults(q._id)} className="text-blue-500 hover:bg-blue-500/10 p-2 rounded"><Users className="w-5 h-5"/></button>
                            <button onClick={() => handleDelete(q._id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded"><Trash2 className="w-5 h-5"/></button>
                        </div>
                    </div>
                 ))}
                 {quizzes.length === 0 && <p className="text-gray-500">No quizzes created yet.</p>}
               </div>
            </div>
        )}

        {activeTab === 'results' && (
            <div>
                 <h2 className="text-2xl font-bold text-white mb-6">Quiz Results</h2>
                 <table className="w-full text-left text-gray-300 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden block">
                    <thead className="bg-black/50 w-full table table-fixed">
                        <tr><th className="p-4 w-1/3">Student</th><th className="p-4 w-1/3">Score</th><th className="p-4 w-1/3">Submitted At</th></tr>
                    </thead>
                    <tbody className="w-full table table-fixed">
                        {results.map((r: any) => (
                            <tr key={r._id} className="border-t border-zinc-800">
                                <td className="p-4 flex gap-2 items-center"><User className="w-5 h-5"/> {r.student?.name || 'Unknown'}</td>
                                <td className="p-4 text-yellow-500 font-bold">{r.totalScore}</td>
                                <td className="p-4 text-sm text-gray-500">{new Date(r.startedAt).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
                 {results.length === 0 && <p className="text-gray-500 mt-4">No submissions yet.</p>}
            </div>
        )}
      </main>

      {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-lg">
                  <h3 className="text-xl font-bold text-white mb-4">Create Quiz</h3>
                  <input className="w-full bg-black border border-zinc-800 p-2 text-white rounded mb-4" placeholder="Quiz Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                  <input type="number" className="w-full bg-black border border-zinc-800 p-2 text-white rounded mb-4" placeholder="Duration (mins)" value={formData.durationMinutes} onChange={e => setFormData({...formData, durationMinutes: parseInt(e.target.value)})} />
                  <div className="h-48 overflow-y-auto bg-black p-2 rounded mb-4 border border-zinc-800">
                      <p className="text-xs text-gray-500 mb-2 uppercase font-bold px-2">Select Questions</p>
                      {questions.map(q => (
                          <label key={q._id} className="flex gap-2 items-center p-2 text-gray-300">
                              <input type="checkbox" checked={formData.questions.includes(q._id)} onChange={(e) => {
                                  if(e.target.checked) setFormData({...formData, questions: [...formData.questions, q._id]});
                                  else setFormData({...formData, questions: formData.questions.filter(id => id !== q._id)});
                              }}/>
                              {q.title}
                          </label>
                      ))}
                  </div>
                  <div className="h-48 overflow-y-auto bg-black p-2 rounded mb-4 border border-zinc-800">
                      <div className="flex justify-between items-center mb-2 px-2">
                          <p className="text-xs text-gray-500 uppercase font-bold">Assign to Students</p>
                          <button onClick={() => setFormData({...formData, assignedTo: formData.assignedTo.length === students.length ? [] : students.map(s => s._id)})} className="text-xs text-blue-500 hover:text-blue-400">
                              {formData.assignedTo.length === students.length ? 'Deselect All' : 'Select All'}
                          </button>
                      </div>
                      {students.map(s => (
                          <label key={s._id} className="flex gap-2 items-center p-2 text-gray-300">
                              <input type="checkbox" checked={formData.assignedTo.includes(s._id)} onChange={(e) => {
                                  if(e.target.checked) setFormData({...formData, assignedTo: [...formData.assignedTo, s._id]});
                                  else setFormData({...formData, assignedTo: formData.assignedTo.filter(id => id !== s._id)});
                              }}/>
                              {s.name} ({s.email})
                          </label>
                      ))}
                  </div>
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                      <button onClick={handleCreate} className="px-4 py-2 bg-white text-black rounded font-medium">Create</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
