import { useState } from 'react';
import { BookOpen, Code2 } from 'lucide-react';
import { ProblemDescription } from './ProblemDescription';
import { CodeEditor } from './CodeEditor';

interface Question {
  _id: string;
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  points: number;
  status: 'unsolved' | 'attempted' | 'solved';
  category: string;
}

interface SabotageEffect {
  type: 'blackout' | 'typing-delay' | 'format-chaos' | 'ui-glitch';
  endTime: number;
  fromTeam?: string;
}

interface ProblemViewProps {
  roundId: string;
  question: Question;
  activeEffects: SabotageEffect[];
  isShieldActive: boolean;
  onStatusChange: (status: Question['status']) => void;
}

export function ProblemView({ roundId, question, activeEffects, isShieldActive, onStatusChange }: ProblemViewProps) {
  const [activeTab, setActiveTab] = useState<'description' | 'editor'>('description');

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('description')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${activeTab === 'description'
              ? 'border-white text-white'
              : 'border-transparent text-gray-400 hover:text-white'
              }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="font-medium">Description</span>
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${activeTab === 'editor'
              ? 'border-white text-white'
              : 'border-transparent text-gray-400 hover:text-white'
              }`}
          >
            <Code2 className="w-4 h-4" />
            <span className="font-medium">Code Editor</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'description' ? (
          <ProblemDescription question={question} />
        ) : (
          <CodeEditor
            roundId={roundId}
            question={question}
            activeEffects={activeEffects}
            isShieldActive={isShieldActive}
            onStatusChange={onStatusChange}
          />
        )}
      </div>
    </div>
  );
}