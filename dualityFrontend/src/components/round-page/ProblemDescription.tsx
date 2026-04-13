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
  constraints?: string | string[];
  examples?: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
}

interface ProblemDescriptionProps {
  question: Question;
}

export function ProblemDescription({ question }: ProblemDescriptionProps) {
  // Parse constraints if it's a string
  const constraints = question.constraints
    ? (typeof question.constraints === 'string'
      ? question.constraints.split('\n').filter(c => c.trim())
      : question.constraints)
    : [];

  const difficultyColors = {
    Easy: 'text-green-500 bg-green-500/10',
    Medium: 'text-yellow-500 bg-yellow-500/10',
    Hard: 'text-red-500 bg-red-500/10',
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        {/* Title and Metadata */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-2xl font-bold text-white">{question.title}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${difficultyColors[question.difficulty]}`}>
              {question.difficulty}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>Category: {question.category}</span>
            <span>•</span>
            <span>Points: {question.points}</span>
          </div>
        </div>

        {/* Description */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-3">Problem Description</h2>
          <p className="text-gray-300 leading-relaxed">{question.description || 'No description available'}</p>
        </div>

        {/* Input Format */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-3">Input Format</h2>
          <pre className="text-gray-300 whitespace-pre-wrap font-mono text-sm bg-black p-4 rounded-lg border border-zinc-800">
            {question.inputFormat || 'No input format specified'}
          </pre>
        </div>

        {/* Output Format */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-3">Output Format</h2>
          <pre className="text-gray-300 whitespace-pre-wrap font-mono text-sm bg-black p-4 rounded-lg border border-zinc-800">
            {question.outputFormat || 'No output format specified'}
          </pre>
        </div>

        {/* Constraints */}
        {constraints.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Constraints</h2>
            <ul className="space-y-2">
              {constraints.map((constraint: string, index: number) => (
                <li key={index} className="text-gray-300 font-mono text-sm flex items-start gap-2">
                  <span className="text-gray-600">•</span>
                  <span>{constraint}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Examples */}
        {question.examples && question.examples.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Examples</h2>
            {question.examples.map((example: any, index: number) => (
              <div key={index} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-white font-medium mb-4">Example {index + 1}</h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Input:</p>
                    <pre className="bg-black border border-zinc-800 rounded-lg p-4 text-gray-300 font-mono text-sm overflow-x-auto">
                      {example.input}
                    </pre>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400 mb-2">Output:</p>
                    <pre className="bg-black border border-zinc-800 rounded-lg p-4 text-gray-300 font-mono text-sm overflow-x-auto">
                      {example.output}
                    </pre>
                  </div>

                  {example.explanation && (
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Explanation:</p>
                      <p className="text-gray-300 text-sm">{example.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hints/Notes */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-blue-400 mb-3">Note</h2>
          <p className="text-blue-300 text-sm">
            Make sure to handle all edge cases and test your solution against the sample inputs before submitting.
          </p>
        </div>
      </div>
    </div>
  );
}
