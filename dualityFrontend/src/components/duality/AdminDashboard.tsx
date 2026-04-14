import { useState, useEffect } from 'react';
import { Code2, Plus, Edit2, Trash2, User, LogOut, Settings, BookOpen, Users, Trophy, TrendingUp, Eye, Play, Square, ClipboardList, Clock, Shield } from 'lucide-react';
import { getQuizzes, createQuiz, updateQuiz, deleteQuiz, activateQuiz, endQuiz } from '../../services/quiz.service';
import { DateTimePicker } from '../ui/DateTimePicker';

interface TestCase {
  input: string;
  output: string;
}

interface Example {
  input: string;
  output: string;
  explanation: string;
}

interface BoilerplateCode {
  python: string;
  c: string;
  cpp: string;
  java: string;
}

import {
  getDualityQuestions,
  createDualityQuestion,
  updateDualityQuestion,
  deleteDualityQuestion,
  getDualityUsers,
  getDualitySettings,
  updateDualitySettings
} from '../../services/duality.service';
import dualitySocketService from '../../services/dualitySocket.service';

interface Question {
  _id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  description: string;
  constraints: string[];
  examples: Example[];
  testCases: TestCase[];
  boilerplate: BoilerplateCode;
  driverCode?: BoilerplateCode;
  isPractice?: boolean;
}

interface Student {
  id: string;
  name: string;
  email: string;
  role?: 'admin' | 'student';
  joinDate: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalPoints: number;
  streak: number;
  lastActiveDate?: string | null;
  rank: number;
}



type ActiveTab = 'questions' | 'students' | 'leaderboard' | 'settings' | 'assignments';

const defaultQuestionJSON = `{
  "title": "Two Sum",
  "difficulty": "Easy",
  "category": "Arrays",
  "description": "Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
  "constraints": [
    "2 <= nums.length <= 10^4",
    "-10^9 <= nums[i] <= 10^9",
    "-10^9 <= target <= 10^9",
    "Only one valid answer exists"
  ],
  "examples": [
    {
      "input": "nums = [2,7,11,15], target = 9",
      "output": "[0,1]",
      "explanation": "nums[0] + nums[1] == 2 + 7 == 9, so we return [0, 1]."
    }
  ],
  "testCases": [
    { "input": "[2,7,11,15]\\n9", "output": "[0,1]" },
    { "input": "[3,3]\\n6", "output": "[0,1]" }
  ],
  "boilerplate": {
    "python": "def twoSum(nums, target):\\n    # write your solution here\\n    pass\\n",
    "c": "int* twoSum(int* nums, int numsSize, int target, int* returnSize) {\\n    // write your solution here\\n}\\n",
    "cpp": "#include <vector>\\nusing namespace std;\\nvector<int> twoSum(vector<int>& nums, int target) {\\n    // write your solution here\\n}\\n",
    "java": "class Solution {\\n    public int[] twoSum(int[] nums, int target) {\\n        // write your solution here\\n    }\\n}\\n"
  },
  "driverCode": {
    "python": "import sys\\nimport ast\\nimport json\\n\\n{{USER_CODE}}\\n\\nif __name__ == '__main__':\\n    inputs = sys.stdin.read().strip().split('\\\\n')\\n    nums = ast.literal_eval(inputs[0])\\n    target = int(inputs[1])\\n    print(json.dumps(sorted(twoSum(nums, target))).replace(' ', ''))\\n",
    "c": "",
    "cpp": "",
    "java": ""
  }
}`;


const getQuestionPoints = (difficulty: 'Easy' | 'Medium' | 'Hard') => {
  if (difficulty === 'Easy') return 100;
  if (difficulty === 'Medium') return 200;
  return 300;
};

export function AdminDashboard({
  userName,
  onLogout
}: {
  userName: string;
  onLogout: () => void;
}) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('questions');
  const [isOpenRegistration, setIsOpenRegistration] = useState(false);
  const [isPasteEnabled, setIsPasteEnabled] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [editorMode, setEditorMode] = useState<'form' | 'json'>('form');
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');

  // Assignments State
  const [assignments, setAssignments] = useState<any[]>([]);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentFormData, setAssignmentFormData] = useState({
    _id: '',
    title: '',
    description: '',
    durationMinutes: 60,
    startTime: '',
    endTime: '',
    questions: [] as string[],
    assignedTo: [] as string[],
    isLockdown: false
  });

  const [formData, setFormData] = useState({
    title: '',
    difficulty: 'Easy' as 'Easy' | 'Medium' | 'Hard',
    category: '',
    description: '',
    constraints: [''],
    examples: [{ input: '', output: '', explanation: '' }],
    testCases: [{ input: '', output: '' }],
    boilerplate: {
      python: '',
      c: '',
      cpp: '',
      java: ''
    },
    driverCode: {
      python: '',
      c: '',
      cpp: '',
      java: ''
    },
    isPractice: true
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [questionsRes, studentsRes, settingsRes, quizzesRes] = await Promise.all([
        getDualityQuestions(),
        getDualityUsers(),
        getDualitySettings(),
        getQuizzes()
      ]);

      if (questionsRes.success) setQuestions(questionsRes.data);
      if (studentsRes.success) {
        const studentOnly = studentsRes.data.filter((u: any) => (u.role || 'student') === 'student');
        const studentsWithRank = studentOnly.map((s: any, index: number) => ({
          ...s,
          rank: index + 1
        }));
        setStudents(studentsWithRank);
      }
      if (settingsRes.success) {
        setIsOpenRegistration(settingsRes.data.isOpenRegistration);
        setIsPasteEnabled(settingsRes.data.isPasteEnabled);
      }
      if (quizzesRes.success) setAssignments(quizzesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    dualitySocketService.connect();

    const unsubscribeSubmission = dualitySocketService.onSubmissionUpdate(() => {
      fetchData();
    });

    const unsubscribeQuestion = dualitySocketService.onQuestionUpdate(() => {
      fetchData();
    });

    return () => {
      unsubscribeSubmission?.();
      unsubscribeQuestion?.();
    };
  }, []);

  const toggleOpenRegistration = async () => {
    try {
        const newValue = !isOpenRegistration;
        setIsOpenRegistration(newValue);
        const result = await updateDualitySettings({ isOpenRegistration: newValue });
        if (!result.success) {
            setIsOpenRegistration(!newValue);
            alert('Failed to update registration settings');
        }
    } catch (error) {
        console.error('Error toggling registration:', error);
        setIsOpenRegistration(!isOpenRegistration);
        alert('Error updating setting');
    }
  };

  const togglePasteEnabled = async () => {
    try {
        const newValue = !isPasteEnabled;
        setIsPasteEnabled(newValue);
        const result = await updateDualitySettings({ isPasteEnabled: newValue });
        if (!result.success) {
            setIsPasteEnabled(!newValue);
            alert('Failed to update pasting settings');
        }
    } catch (error) {
        console.error('Error toggling pasting:', error);
        setIsPasteEnabled(!isPasteEnabled);
        alert('Error updating setting');
    }
  };

  const isSameLocalDate = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
  const today = new Date();
  const activeTodayCount = students.filter((s) => {
    if (!s.lastActiveDate) return false;
    return isSameLocalDate(new Date(s.lastActiveDate), today);
  }).length;
  const averageSolved = students.length > 0
    ? Math.round(students.reduce((acc, s) => acc + (s.totalSolved || 0), 0) / students.length)
    : 0;
  const averagePoints = students.length > 0
    ? Math.round(students.reduce((acc, s) => acc + (s.totalPoints || 0), 0) / students.length)
    : 0;
  const topStreak = students.length > 0 ? Math.max(...students.map((s) => s.streak || 0)) : 0;

  const getDifficultyProgress = (solved: number, total: number) => {
    if (!total || total <= 0) return 0;
    return Math.min(100, (solved / total) * 100);
  };

  const handleUpdateSettings = async (updates: any) => {
    try {
      await updateDualitySettings(updates);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAssignment = async () => {
    try {
      if (assignmentFormData._id) {
        await updateQuiz(assignmentFormData._id, assignmentFormData);
      } else {
        await createQuiz(assignmentFormData);
      }
      setShowAssignmentModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to save assignment');
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (confirm('Are you sure you want to delete this assignment?')) {
      try {
        await deleteQuiz(id);
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };



  const resetAssignmentForm = (quiz?: any) => {
    if (quiz) {
      const formatToLocalISO = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setAssignmentFormData({
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description || '',
        durationMinutes: quiz.durationMinutes || 60,
        startTime: formatToLocalISO(quiz.startTime),
        endTime: formatToLocalISO(quiz.endTime),
        questions: quiz.questions?.map((q: any) => q._id || q) || [],
        assignedTo: quiz.assignedTo?.map((u: any) => u._id || u) || [],
        isLockdown: quiz.isLockdown || false
      });
    } else {
      setAssignmentFormData({
        _id: '',
        title: '',
        description: '',
        durationMinutes: 60,
        startTime: '',
        endTime: '',
        questions: [],
        assignedTo: [],
        isLockdown: false
      });
    }
  };

  const handleAddQuestion = async () => {
    try {
      let data = formData;
      if (editorMode === 'json') {
        try { data = JSON.parse(jsonInput); } catch (err: any) { setJsonError('Invalid JSON: ' + err.message); return; }
      }
      const result = await createDualityQuestion(data);
      if (result.success) {
        fetchData();
        closeModal();
      }
    } catch (error) {
      console.error('Error adding question:', error);
      alert('Failed to add question');
    }
  };

  const handleEditQuestion = async () => {
    if (editingQuestion) {
      try {
        let data = formData;
        if (editorMode === 'json') {
          try { data = JSON.parse(jsonInput); } catch (err: any) { setJsonError('Invalid JSON: ' + err.message); return; }
        }
        const result = await updateDualityQuestion(editingQuestion._id, data);
        if (result.success) {
          fetchData();
          closeModal();
        }
      } catch (error) {
        console.error('Error editing question:', error);
        alert('Failed to update question');
      }
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      try {
        const result = await deleteDualityQuestion(id);
        if (result.success) {
          fetchData();
        }
      } catch (error) {
        console.error('Error deleting question:', error);
        alert('Failed to delete question');
      }
    }
  };

  const openEditModal = (question: Question) => {
    setEditingQuestion(question);
    const data = {
      title: question.title,
      difficulty: question.difficulty,
      category: question.category,
      description: question.description,
      constraints: question.constraints,
      examples: question.examples,
      testCases: question.testCases,
      boilerplate: question.boilerplate,
      driverCode: question.driverCode || { python: '', c: '', cpp: '', java: '' },
      isPractice: question.isPractice ?? true,
    };
    setFormData(data);
    setJsonInput(JSON.stringify(data, null, 2));
    setEditorMode('form');
    setJsonError('');
  };

  const resetForm = () => {
    setFormData({
      title: '',
      difficulty: 'Easy',
      category: '',
      description: '',
      constraints: [''],
      examples: [{ input: '', output: '', explanation: '' }],
      testCases: [{ input: '', output: '' }],
      boilerplate: {
        python: '',
        c: '',
        cpp: '',
        java: ''
      },
      driverCode: {
        python: '',
        c: '',
        cpp: '',
        java: ''
      },
      isPractice: true
    });
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingQuestion(null);
    setEditorMode('form');
    setJsonError('');
    resetForm();
  };

  const handleModeChange = (mode: 'form' | 'json') => {
    if (mode === 'form' && editorMode === 'json') {
      try {
        const parsed = JSON.parse(jsonInput);
        setFormData((prev) => ({ ...prev, ...parsed }));
        setJsonError('');
        setEditorMode('form');
      } catch (err: any) {
        setJsonError('Invalid JSON: ' + err.message);
      }
    } else if (mode === 'json' && editorMode === 'form') {
      setJsonInput(JSON.stringify(formData, null, 2));
      setJsonError('');
      setEditorMode('json');
    }
  };

  const addConstraint = () => {
    setFormData({ ...formData, constraints: [...formData.constraints, ''] });
  };

  const updateConstraint = (index: number, value: string) => {
    const newConstraints = [...formData.constraints];
    newConstraints[index] = value;
    setFormData({ ...formData, constraints: newConstraints });
  };

  const removeConstraint = (index: number) => {
    setFormData({ ...formData, constraints: formData.constraints.filter((_, i) => i !== index) });
  };

  const addExample = () => {
    setFormData({ ...formData, examples: [...formData.examples, { input: '', output: '', explanation: '' }] });
  };

  const updateExample = (index: number, field: keyof Example, value: string) => {
    const newExamples = [...formData.examples];
    newExamples[index] = { ...newExamples[index], [field]: value };
    setFormData({ ...formData, examples: newExamples });
  };

  const removeExample = (index: number) => {
    setFormData({ ...formData, examples: formData.examples.filter((_, i) => i !== index) });
  };

  const addTestCase = () => {
    setFormData({ ...formData, testCases: [...formData.testCases, { input: '', output: '' }] });
  };

  const updateTestCase = (index: number, field: keyof TestCase, value: string) => {
    const newTestCases = [...formData.testCases];
    newTestCases[index] = { ...newTestCases[index], [field]: value };
    setFormData({ ...formData, testCases: newTestCases });
  };

  const removeTestCase = (index: number) => {
    setFormData({ ...formData, testCases: formData.testCases.filter((_, i) => i !== index) });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500/10 text-green-500';
      case 'Medium': return 'bg-yellow-500/10 text-yellow-500';
      case 'Hard': return 'bg-red-500/10 text-red-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const questionCategories = ['All', ...Array.from(new Set(questions.map((q) => q.category)))];

  const filteredQuestions = questions.filter((question) => {
    const matchesDifficulty = selectedDifficulty === 'All' || question.difficulty === selectedDifficulty;
    const matchesCategory = selectedCategory === 'All' || question.category === selectedCategory;
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const matchesSearch = normalizedSearch.length === 0
      || question.title.toLowerCase().includes(normalizedSearch)
      || question.category.toLowerCase().includes(normalizedSearch)
      || question.description.toLowerCase().includes(normalizedSearch);
    return matchesDifficulty && matchesCategory && matchesSearch;
  });

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
                  <h1 className="text-xl font-bold text-white">Professor Dashboard</h1>
                  <p className="text-xs text-gray-500">Assignments Management</p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('questions')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'questions'
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  <BookOpen className="w-4 h-4" />
                  Question Bank
                </button>
                <button
                  onClick={() => setActiveTab('assignments')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'assignments'
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  Assignments
                </button>
                <button
                  onClick={() => setActiveTab('students')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'students'
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  <Users className="w-4 h-4" />
                  Students
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
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings'
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
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
        {activeTab === 'questions' ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Questions</p>
                    <p className="text-2xl font-bold text-white">{questions.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Easy</p>
                    <p className="text-2xl font-bold text-green-500">
                      {questions.filter(q => q.difficulty === 'Easy').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Medium</p>
                    <p className="text-2xl font-bold text-yellow-500">
                      {questions.filter(q => q.difficulty === 'Medium').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Hard</p>
                    <p className="text-2xl font-bold text-red-500">
                      {questions.filter(q => q.difficulty === 'Hard').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Question Bank</h2>
              <button
                onClick={() => { setShowAddModal(true); setJsonInput(defaultQuestionJSON); setEditorMode('form'); setJsonError(''); }}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Question
              </button>
            </div>

            {/* Filters */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-3 lg:grid-cols-3 gap-4 items-end">
                {/* Difficulty Filter */}
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Difficulty</label>
                  <div className="flex flex-wrap gap-2 w-full">
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
                    {questionCategories.map((cat) => (
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
                    placeholder="Search by title, category, or description..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>
            </div>

            {/* Questions Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black border-b border-zinc-800">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Title</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Difficulty</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Points</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Category</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Test Cases</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuestions.map((question) => (
                      <tr key={question._id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-white font-medium">{question.title}</p>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-1">{question.description}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-yellow-500 font-medium">{getQuestionPoints(question.difficulty)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-400">{question.category}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-400">{question.testCases?.length || 0}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal(question)}
                              className="p-2 bg-zinc-800 text-gray-400 hover:text-white rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(question._id)}
                              className="p-2 bg-zinc-800 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredQuestions.length === 0 && (
                <div className="py-12 text-center text-gray-500">
                  <p>No questions found with the selected filters.</p>
                </div>
              )}
            </div>
          </>
        ) : activeTab === 'assignments' ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Genuine Assignments</h2>
              <button
                onClick={() => { resetAssignmentForm(); setShowAssignmentModal(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create New Assignment
              </button>
            </div>

            <div className="grid gap-4">
              {assignments.map((q: any) => (
                <div key={q._id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{q.title}</h3>
                    <p className="text-gray-400 text-xs mt-1 flex flex-col gap-1">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-blue-400"/>
                        {q.startTime ? new Date(q.startTime).toLocaleString() : 'No start time'} — {q.endTime ? new Date(q.endTime).toLocaleString() : 'No deadline'}
                      </span>
                      <span className="block opacity-60">
                        {q.questions?.length || 0} questions • Assigned to {q.assignedTo?.length || 0} students
                      </span>
                    </p>
                    {(() => {
                      const now = new Date();
                      const start = q.startTime ? new Date(q.startTime) : null;
                      const end = q.endTime ? new Date(q.endTime) : null;
                      if (start && now < start) return <span className="inline-block mt-2 px-2 py-1 rounded text-[10px] font-bold tracking-wider bg-blue-500/20 text-blue-400">SCHEDULED</span>;
                      if (end && now > end) return <span className="inline-block mt-2 px-2 py-1 rounded text-[10px] font-bold tracking-wider bg-zinc-800 text-gray-500">ENDED</span>;
                      return <span className="inline-block mt-2 px-2 py-1 rounded text-[10px] font-bold tracking-wider bg-green-500/20 text-green-500">LIVE NOW</span>;
                    })()}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { resetAssignmentForm(q); setShowAssignmentModal(true); }} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDeleteAssignment(q._id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
              {assignments.length === 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center text-gray-500">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No targeted assignments created yet.</p>
                </div>
              )}
            </div>
          </>
        ) : activeTab === 'students' ? (
          <>
            {/* Students Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Students</p>
                    <p className="text-2xl font-bold text-white">{students.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Active Today</p>
                    <p className="text-2xl font-bold text-green-500">
                      {activeTodayCount}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Avg Problems Solved</p>
                    <p className="text-2xl font-bold text-yellow-500">
                      {averageSolved}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Top Streak</p>
                    <p className="text-2xl font-bold text-purple-500">
                      {topStreak}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Students List */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-6">All Students</h2>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black border-b border-zinc-800">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Student</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Rank</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Points</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Total Solved</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Easy/Med/Hard</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Streak</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Last Active</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-white font-medium">{student.name}</p>
                            <p className="text-sm text-gray-500">{student.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-400">#{student.rank}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-lg font-bold text-yellow-500">{student.totalPoints}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-lg font-bold text-white">{student.totalSolved}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <span className="text-sm text-green-500">{student.easySolved}</span>
                            <span className="text-gray-600">/</span>
                            <span className="text-sm text-yellow-500">{student.mediumSolved}</span>
                            <span className="text-gray-600">/</span>
                            <span className="text-sm text-red-500">{student.hardSolved}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-500">{student.streak}</span>
                            <span className="text-xs text-gray-500">days</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-400">
                            {student.lastActiveDate
                              ? `Active ${new Date(student.lastActiveDate).toLocaleString()}`
                              : 'Never active'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setViewingStudent(student)}
                            className="p-2 bg-zinc-800 text-gray-400 hover:text-white rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : activeTab === 'settings' ? (
          <div className="space-y-6 max-w-3xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-2">Platform Settings</h2>
              <p className="text-sm text-gray-400">Configure global behaviors and restrictions for the evaluation and assignments environment.</p>
            </div>
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
              {/* Registration Toggle Setting */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-12">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Open Registration</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    When enabled, any user with a verified <span className="text-gray-300 font-semibold">@bmu.edu.in</span> email address can instantly log in and access the platform. 
                    When disabled, the platform enters restricted mode—only users explicitly added to the Allowlist below can authenticate.
                  </p>
                </div>
                <div className="flex-shrink-0 mt-2 md:mt-0">
                 <button
                    onClick={toggleOpenRegistration}
                    className={`flex items-center gap-3 px-6 py-3 rounded-xl text-sm transition-all focus:outline-none whitespace-nowrap ${
                      isOpenRegistration 
                        ? 'bg-white text-black font-semibold shadow-[0_0_20px_rgba(255,255,255,0.15)] ring-2 ring-white/50 ring-offset-2 ring-offset-zinc-900' 
                        : 'bg-zinc-800 text-gray-400 hover:text-white hover:bg-zinc-700 font-medium border border-zinc-700 hover:border-zinc-500'
                    }`}
                  >
                    <Settings className={`w-4 h-4 ${isOpenRegistration ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
                    {isOpenRegistration ? 'Status: OPEN' : 'Status: LOCKED'}
                 </button>
                </div>
              </div>
            </div>
              
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
              {/* Code Paste Setting */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-12">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Editor Pasting</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Controls whether students can paste code straight into the editor. When disabled, standard clipboard actions and keyboard shortcuts (<span className="text-gray-300 font-semibold">Ctrl+V</span> / <span className="text-gray-300 font-semibold">Cmd+V</span>) are intercepted and blocked in the coding environment.
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
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <p className="text-xs text-gray-500 mb-1">Students Ranked</p>
                <p className="text-2xl font-bold text-white">{students.length}</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <p className="text-xs text-gray-500 mb-1">Avg Points</p>
                <p className="text-2xl font-bold text-yellow-500">{averagePoints}</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <p className="text-xs text-gray-500 mb-1">Top Points</p>
                <p className="text-2xl font-bold text-yellow-500">{students[0]?.totalPoints || 0}</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <p className="text-xs text-gray-500 mb-1">Top Rank</p>
                <p className="text-2xl font-bold text-white">#{students[0]?.rank || '-'}</p>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black border-b border-zinc-800">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Rank</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Student</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Points</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Solved</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Streak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={`leaderboard-${student.id}`} className="border-b border-zinc-800 hover:bg-zinc-800/30">
                        <td className="px-6 py-4 text-white font-semibold">#{student.rank}</td>
                        <td className="px-6 py-4 text-white">{student.name}</td>
                        <td className="px-6 py-4 text-yellow-500 font-semibold">{student.totalPoints}</td>
                        <td className="px-6 py-4 text-gray-300">{student.totalSolved}</td>
                        <td className="px-6 py-4 text-gray-400">{student.streak} days</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Question Modal */}
      {(showAddModal || editingQuestion) && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
              <h2 className="text-2xl font-bold text-white">
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </h2>
              <div className="flex bg-black rounded-lg p-1 border border-zinc-800">
                <button
                  type="button"
                  onClick={() => handleModeChange('form')}
                  className={'px-4 py-1.5 rounded-md text-sm font-medium transition-colors ' + (editorMode === 'form' ? 'bg-zinc-800 text-white' : 'text-gray-400 hover:text-white')}
                >
                  Form
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('json')}
                  className={'px-4 py-1.5 rounded-md text-sm font-medium transition-colors ' + (editorMode === 'json' ? 'bg-zinc-800 text-white' : 'text-gray-400 hover:text-white')}
                >
                  JSON
                </button>
              </div>
            </div>

            <div className="space-y-6 overflow-y-auto pr-2 flex-1">
              {jsonError && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-500 text-sm">
                  {jsonError}
                </div>
              )}

              {editorMode === 'json' ? (
                <div className="flex flex-col">
                  <p className="text-gray-400 text-sm mb-2">Edit the raw JSON data for this question. Use the Two Sum example as reference for new questions.</p>
                  <textarea
                    value={jsonInput}
                    onChange={(e) => { setJsonInput(e.target.value); setJsonError(''); }}
                    className="w-full bg-black border border-zinc-800 rounded-lg p-4 text-green-400 font-mono text-sm focus:outline-none focus:border-zinc-500"
                    style={{ minHeight: '420px', whiteSpace: 'pre-wrap' }}
                  />
                </div>
              ) : (
              <>
              {/* Basic Info */}
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Question Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-black border border-zinc-800 rounded-lg py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-zinc-600"
                      placeholder="e.g., Two Sum"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Category *</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-black border border-zinc-800 rounded-lg py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-zinc-600"
                      placeholder="e.g., Array, String, Tree"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Difficulty *</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard' })}
                    className="w-full bg-black border border-zinc-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-zinc-600"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 bg-black/40 border border-zinc-800 p-4 rounded-xl">
                  <input
                    type="checkbox"
                    id="isPractice"
                    checked={formData.isPractice}
                    onChange={(e) => setFormData({ ...formData, isPractice: e.target.checked })}
                    className="w-5 h-5 rounded border-zinc-800 bg-black text-white focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <label htmlFor="isPractice" className="text-sm font-medium text-gray-300 cursor-pointer select-none">
                    Visible in Student Practice Bank
                  </label>
                  <span className="text-[10px] text-gray-500 ml-auto uppercase tracking-tighter">
                    {formData.isPractice ? 'Public' : 'Hidden'}
                  </span>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full bg-black border border-zinc-800 rounded-lg py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-zinc-600"
                    placeholder="Enter question description..."
                  ></textarea>
                </div>
              </div>

              {/* Constraints */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm text-gray-300">Constraints</label>
                  <button
                    type="button"
                    onClick={addConstraint}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    + Add Constraint
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.constraints.map((constraint, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={constraint}
                        onChange={(e) => updateConstraint(index, e.target.value)}
                        className="flex-1 bg-black border border-zinc-800 rounded-lg py-2 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-zinc-600 text-sm"
                        placeholder="e.g., 1 <= n <= 10^5"
                      />
                      {formData.constraints.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeConstraint(index)}
                          className="px-3 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Examples */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm text-gray-300">Examples</label>
                  <button
                    type="button"
                    onClick={addExample}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    + Add Example
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.examples.map((example, index) => (
                    <div key={index} className="bg-black border border-zinc-800 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs text-gray-500">Example {index + 1}</span>
                        {formData.examples.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeExample(index)}
                            className="text-xs text-red-500 hover:text-red-400"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={example.input}
                          onChange={(e) => updateExample(index, 'input', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-zinc-600"
                          placeholder="Input: nums = [2,7,11,15], target = 9"
                        />
                        <input
                          type="text"
                          value={example.output}
                          onChange={(e) => updateExample(index, 'output', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-zinc-600"
                          placeholder="Output: [0,1]"
                        />
                        <input
                          type="text"
                          value={example.explanation}
                          onChange={(e) => updateExample(index, 'explanation', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-zinc-600"
                          placeholder="Explanation: nums[0] + nums[1] == 9"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Test Cases */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm text-gray-300">Test Cases</label>
                  <button
                    type="button"
                    onClick={addTestCase}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    + Add Test Case
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.testCases.map((testCase, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={testCase.input}
                        onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                        className="flex-1 bg-black border border-zinc-800 rounded-lg py-2 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-zinc-600 text-sm font-mono"
                        placeholder="Input: [2,7,11,15], 9"
                      />
                      <input
                        type="text"
                        value={testCase.output}
                        onChange={(e) => updateTestCase(index, 'output', e.target.value)}
                        className="flex-1 bg-black border border-zinc-800 rounded-lg py-2 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-zinc-600 text-sm font-mono"
                        placeholder="Output: [0,1]"
                      />
                      {formData.testCases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTestCase(index)}
                          className="px-3 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 text-sm"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Boilerplate Code */}
              <div>
                <label className="block text-sm text-gray-300 mb-3">Boilerplate Code</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">Python</label>
                    <textarea
                      value={formData.boilerplate.python}
                      onChange={(e) => setFormData({ ...formData, boilerplate: { ...formData.boilerplate, python: e.target.value } })}
                      rows={4}
                      className="w-full bg-black border border-zinc-800 rounded-lg py-2 px-3 text-white text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-zinc-600"
                      placeholder="def twoSum(nums, target):&#10;    pass"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">C</label>
                    <textarea
                      value={formData.boilerplate.c}
                      onChange={(e) => setFormData({ ...formData, boilerplate: { ...formData.boilerplate, c: e.target.value } })}
                      rows={4}
                      className="w-full bg-black border border-zinc-800 rounded-lg py-2 px-3 text-white text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-zinc-600"
                      placeholder="int* twoSum(int* nums, int size) {&#10;    &#10;}"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">C++</label>
                    <textarea
                      value={formData.boilerplate.cpp}
                      onChange={(e) => setFormData({ ...formData, boilerplate: { ...formData.boilerplate, cpp: e.target.value } })}
                      rows={4}
                      className="w-full bg-black border border-zinc-800 rounded-lg py-2 px-3 text-white text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-zinc-600"
                      placeholder="vector<int> twoSum(vector<int>& nums, int target) {&#10;    &#10;}"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">Java</label>
                    <textarea
                      value={formData.boilerplate.java}
                      onChange={(e) => setFormData({ ...formData, boilerplate: { ...formData.boilerplate, java: e.target.value } })}
                      rows={4}
                      className="w-full bg-black border border-zinc-800 rounded-lg py-2 px-3 text-white text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-zinc-600"
                      placeholder="public int[] twoSum(int[] nums, int target) {&#10;    &#10;}"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Driver Code */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm text-gray-300">Driver Code (Hidden Wrapper)</label>
                  <span className="text-xs text-gray-500">Inject user\'s code using {'{{USER_CODE}}'} placeholder</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-amber-500 mb-2">Python Driver</label>
                    <textarea
                      value={formData.driverCode?.python || ''}
                      onChange={(e) => setFormData({ ...formData, driverCode: { ...formData.driverCode!, python: e.target.value } })}
                      rows={6}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-yellow-500 text-sm font-mono focus:outline-none focus:border-zinc-600"
                      placeholder="import sys\n\n{{USER_CODE}}\n\nif __name__ == '__main__':\n    print('Output')"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs text-amber-500 mb-2">C Driver</label>
                    <textarea
                      value={formData.driverCode?.c || ''}
                      onChange={(e) => setFormData({ ...formData, driverCode: { ...formData.driverCode!, c: e.target.value } })}
                      rows={6}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-yellow-500 text-sm font-mono focus:outline-none focus:border-zinc-600"
                      placeholder="#include <stdio.h>\n\n{{USER_CODE}}\n\nint main() {\n    return 0;\n}"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs text-amber-500 mb-2">C++ Driver</label>
                    <textarea
                      value={formData.driverCode?.cpp || ''}
                      onChange={(e) => setFormData({ ...formData, driverCode: { ...formData.driverCode!, cpp: e.target.value } })}
                      rows={6}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-yellow-500 text-sm font-mono focus:outline-none focus:border-zinc-600"
                      placeholder="#include <iostream>\n\n{{USER_CODE}}\n\nint main() {\n    return 0;\n}"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs text-amber-500 mb-2">Java Driver</label>
                    <textarea
                      value={formData.driverCode?.java || ''}
                      onChange={(e) => setFormData({ ...formData, driverCode: { ...formData.driverCode!, java: e.target.value } })}
                      rows={6}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-yellow-500 text-sm font-mono focus:outline-none focus:border-zinc-600"
                      placeholder="import java.util.*;\n\n{{USER_CODE}}\n\npublic class Main {\n    public static void main(String[] args) {\n    }\n}"
                    ></textarea>
                  </div>
                </div>
              </div>
              </>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-8 flex-shrink-0">
              <button
                onClick={editingQuestion ? handleEditQuestion : handleAddQuestion}
                className="flex-1 bg-white text-black py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                {editingQuestion ? 'Save Changes' : 'Add Question'}
              </button>
              <button
                onClick={closeModal}
                className="flex-1 bg-zinc-800 text-gray-400 py-3 rounded-lg font-medium hover:text-white hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {viewingStudent && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{viewingStudent.name}</h2>
                <p className="text-gray-400">{viewingStudent.email}</p>
              </div>
              <button
                onClick={() => setViewingStudent(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-black border border-zinc-800 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Rank</p>
                  <p className="text-2xl font-bold text-white">#{viewingStudent.rank}</p>
                </div>
                <div className="bg-black border border-zinc-800 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Total Solved</p>
                  <p className="text-2xl font-bold text-white">{viewingStudent.totalSolved}</p>
                </div>
                <div className="bg-black border border-zinc-800 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Streak</p>
                  <p className="text-2xl font-bold text-white">{viewingStudent.streak} days</p>
                </div>
                <div className="bg-black border border-zinc-800 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Join Date</p>
                  <p className="text-sm font-medium text-white">{new Date(viewingStudent.joinDate).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Difficulty Breakdown */}
              <div className="bg-black border border-zinc-800 rounded-lg p-6">
                <h3 className="text-sm font-medium text-gray-300 mb-4">Problems by Difficulty</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-green-500">Easy</span>
                      <span className="text-white">{viewingStudent.easySolved}</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                      <div
                        className="bg-green-500 rounded-full h-2"
                        style={{ width: `${getDifficultyProgress(viewingStudent.easySolved, viewingStudent.totalSolved)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-yellow-500">Medium</span>
                      <span className="text-white">{viewingStudent.mediumSolved}</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                      <div
                        className="bg-yellow-500 rounded-full h-2"
                        style={{ width: `${getDifficultyProgress(viewingStudent.mediumSolved, viewingStudent.totalSolved)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-red-500">Hard</span>
                      <span className="text-white">{viewingStudent.hardSolved}</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                      <div
                        className="bg-red-500 rounded-full h-2"
                        style={{ width: `${getDifficultyProgress(viewingStudent.hardSolved, viewingStudent.totalSolved)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-black border border-zinc-800 rounded-lg p-6">
                <h3 className="text-sm font-medium text-gray-300 mb-4">Activity</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Last Active</span>
                    <span className="text-white">
                      {viewingStudent.lastActiveDate
                        ? `Active ${new Date(viewingStudent.lastActiveDate).toLocaleString()}`
                        : 'Never active'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Account Created</span>
                    <span className="text-white">{new Date(viewingStudent.joinDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Current Streak</span>
                    <span className="text-white font-medium">{viewingStudent.streak} days 🔥</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setViewingStudent(null)}
              className="w-full mt-6 bg-zinc-800 text-gray-400 py-3 rounded-lg font-medium hover:text-white hover:bg-zinc-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* Assignment Creation/Edit Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[60] backdrop-blur-sm overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-2xl my-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <ClipboardList className="w-6 h-6" />
                {assignmentFormData._id ? 'Edit Assignment' : 'Create Assignment'}
              </h2>
              <button 
                onClick={() => setShowAssignmentModal(false)} 
                className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-widest">Assignment Title</label>
                  <input
                    className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="e.g., Weekly Data Structures Assessment"
                    value={assignmentFormData.title}
                    onChange={e => setAssignmentFormData({ ...assignmentFormData, title: e.target.value })}
                  />
                </div>
                <DateTimePicker
                  label="Start Time"
                  date={assignmentFormData.startTime}
                  setDate={(date) => setAssignmentFormData({ ...assignmentFormData, startTime: date })}
                />
                <DateTimePicker
                  label="End Time (Deadline)"
                  date={assignmentFormData.endTime}
                  setDate={(date) => setAssignmentFormData({ ...assignmentFormData, endTime: date })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-widest">Select Questions from Bank ({assignmentFormData.questions.length} selected)</label>
                <div className="bg-black border border-zinc-800 rounded-xl h-48 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                  {questions.map(q => (
                    <label key={q._id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${assignmentFormData.questions.includes(q._id) ? 'bg-white/5 border-white/20' : 'border-transparent hover:bg-white/5'}`}>
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-white focus:ring-0 focus:ring-offset-0"
                        checked={assignmentFormData.questions.includes(q._id)}
                        onChange={e => {
                          const newQuestions = e.target.checked
                            ? [...assignmentFormData.questions, q._id]
                            : assignmentFormData.questions.filter(id => id !== q._id);
                          setAssignmentFormData({ ...assignmentFormData, questions: newQuestions });
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{q.title}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">{q.difficulty} • {q.category}</p>
                      </div>
                    </label>
                  ))}
                  {questions.length === 0 && <p className="text-center text-gray-500 py-4 text-sm">Question bank is empty.</p>}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Assign to Students ({assignmentFormData.assignedTo.length} selected)</label>
                  <button 
                    onClick={() => setAssignmentFormData({ 
                      ...assignmentFormData, 
                      assignedTo: assignmentFormData.assignedTo.length === students.length ? [] : students.map(s => s.id) 
                    })}
                    className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest"
                  >
                    {assignmentFormData.assignedTo.length === students.length ? 'Deselect All' : 'Select All Clients'}
                  </button>
                </div>
                <div className="bg-black border border-zinc-800 rounded-xl h-48 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                  {students.map(s => (
                    <label key={s.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${assignmentFormData.assignedTo.includes(s.id) ? 'bg-white/5 border-white/20' : 'border-transparent hover:bg-white/5'}`}>
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-white focus:ring-0 focus:ring-offset-0"
                        checked={assignmentFormData.assignedTo.includes(s.id)}
                        onChange={e => {
                          const newAssigned = e.target.checked
                            ? [...assignmentFormData.assignedTo, s.id]
                            : assignmentFormData.assignedTo.filter(id => id !== s.id);
                          setAssignmentFormData({ ...assignmentFormData, assignedTo: newAssigned });
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{s.name}</p>
                        <p className="text-[10px] text-gray-400">{s.email}</p>
                      </div>
                    </label>
                  ))}
                  {students.length === 0 && <p className="text-center text-gray-500 py-4 text-sm">No students registered.</p>}
                </div>
              </div>

              <div className="flex items-center justify-between bg-zinc-800/50 border border-zinc-800 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <Shield className={`w-5 h-5 ${assignmentFormData.isLockdown ? 'text-red-500' : 'text-gray-500'}`} />
                  <div>
                    <p className="text-sm font-bold text-white uppercase tracking-tighter">Complete Lockdown Mode</p>
                    <p className="text-[10px] text-gray-500">Block Copying, Pasting, and Right-Click</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAssignmentFormData({ ...assignmentFormData, isLockdown: !assignmentFormData.isLockdown })}
                  className={`w-12 h-6 rounded-full relative transition-colors ${assignmentFormData.isLockdown ? 'bg-red-600' : 'bg-zinc-700'}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${assignmentFormData.isLockdown ? 'translate-x-6' : ''}`} />
                </button>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSaveAssignment}
                  disabled={!assignmentFormData.title || assignmentFormData.questions.length === 0}
                  className="flex-1 bg-white text-black py-4 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs"
                >
                  {assignmentFormData._id ? 'Update Assignment' : 'Create Assignment'}
                </button>
                <button
                  onClick={() => setShowAssignmentModal(false)}
                  className="px-8 bg-zinc-800 text-gray-400 rounded-xl font-bold hover:text-white hover:bg-zinc-700 transition-all uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
