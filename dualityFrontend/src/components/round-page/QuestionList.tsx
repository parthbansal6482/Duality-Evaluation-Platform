import { CheckCircle, Circle, AlertCircle } from 'lucide-react';

interface Question {
  _id: string;
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  points: number;
  status: 'unsolved' | 'attempted' | 'solved';
  category: string;
}

interface QuestionListProps {
  questions: Question[];
  selectedQuestionId: string | null;
  onSelectQuestion: (questionId: string) => void;
}

export function QuestionList({ questions, selectedQuestionId, onSelectQuestion }: QuestionListProps) {
  const difficultyColors = {
    Easy: 'text-green-500',
    Medium: 'text-yellow-500',
    Hard: 'text-red-500',
  };

  const getStatusIcon = (status: Question['status']) => {
    switch (status) {
      case 'solved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'attempted':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'unsolved':
        return <Circle className="w-5 h-5 text-gray-600" />;
    }
  };

  const solvedCount = questions.filter((q) => q.status === 'solved').length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-lg font-bold text-white mb-1">Problems</h2>
        <p className="text-sm text-gray-400">
          {solvedCount} / {questions.length} solved
        </p>
        <div className="mt-3 w-full bg-zinc-800 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${(solvedCount / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {questions.map((question) => (
            <button
              key={question._id}
              onClick={() => onSelectQuestion(question._id)}
              className={`w-full text-left p-4 rounded-lg transition-all ${selectedQuestionId === question._id
                ? 'bg-white/5 border border-zinc-700'
                : 'border border-transparent hover:bg-zinc-800'
                }`}
            >
              <div className="flex items-start gap-3">
                <div className="pt-0.5">{getStatusIcon(question.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-white font-medium leading-tight">{question.title}</h3>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{question.points} pts</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs font-medium ${difficultyColors[question.difficulty]}`}>
                      {question.difficulty}
                    </span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">{question.category}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-zinc-800 bg-black">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span className="text-xs text-gray-400">Solved</span>
            </div>
            <p className="text-lg font-bold text-white">
              {questions.filter((q) => q.status === 'solved').length}
            </p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertCircle className="w-3 h-3 text-yellow-500" />
              <span className="text-xs text-gray-400">Tried</span>
            </div>
            <p className="text-lg font-bold text-white">
              {questions.filter((q) => q.status === 'attempted').length}
            </p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Circle className="w-3 h-3 text-gray-600" />
              <span className="text-xs text-gray-400">Todo</span>
            </div>
            <p className="text-lg font-bold text-white">
              {questions.filter((q) => q.status === 'unsolved').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
