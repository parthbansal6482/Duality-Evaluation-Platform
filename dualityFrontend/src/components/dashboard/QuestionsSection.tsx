import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import {
  getAllQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  Question as APIQuestion,
  CreateQuestionData,
} from '../../services/question.service';

interface Question {
  _id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  examples: { input: string; output: string; explanation?: string }[];
  hiddenTestCases?: { input: string; output: string; explanation?: string }[];
  testCases: number;
  boilerplateCode?: {
    python?: string;
    c?: string;
    cpp?: string;
    java?: string;
  };
  driverCode?: {
    python?: string;
    c?: string;
    cpp?: string;
    java?: string;
  };
}

const defaultQuestionJSON = `{
  "title": "Two Sum",
  "difficulty": "Easy",
  "category": "Arrays",
  "description": "Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers such that they add up to \`target\`. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.",
  "inputFormat": "An array of integers \`nums\`, and an integer \`target\`",
  "outputFormat": "An array of two integers representing the indices of the two numbers that add up to \`target\`",
  "constraints": "2 <= nums.length <= 10^4\\n-10^9 <= nums[i] <= 10^9\\n-10^9 <= target <= 10^9\\nOnly one valid answer exists",
  "examples": [
    {
      "input": "[2,7,11,15]\\n9",
      "output": "[0,1]",
      "explanation": "nums[0] + nums[1] == 2 + 7 == 9, so we return [0, 1]."
    }
  ],
  "hiddenTestCases": [
    {
      "input": "[3,3]\\n6",
      "output": "[0,1]"
    }
  ],
  "boilerplateCode": {
    "python": "def twoSum(nums, target):\\n    # write your solution here\\n    pass\\n",
    "c": "int* twoSum(int* nums, int numsSize, int target, int* returnSize) {\\n    // write your solution here\\n}\\n",
    "cpp": "#include <vector>\\nusing namespace std;\\n\\nvector<int> twoSum(vector<int>& nums, int target) {\\n    // write your solution here\\n}\\n",
    "java": "class Solution {\\n    public int[] twoSum(int[] nums, int target) {\\n        // write your solution here\\n    }\\n}\\n"
  },
  "driverCode": {
    "python": "import sys\\nimport ast\\nimport json\\n\\n{{USER_CODE}}\\n\\nif __name__ == '__main__':\\n    inputs = sys.stdin.read().strip().split('\\\\n')\\n    if len(inputs) >= 2:\\n        nums = ast.literal_eval(inputs[0])\\n        target = int(inputs[1])\\n        result = twoSum(nums, target)\\n        print(json.dumps(sorted(result)).replace(' ', ''))\\n",
    "c": "#include <stdio.h>\\n#include <stdlib.h>\\n#include <string.h>\\n\\n{{USER_CODE}}\\n\\nint main() {\\n    char line[100000];\\n    fgets(line, sizeof(line), stdin);\\n    int nums[10001], numsSize = 0;\\n    char *p = line + 1;\\n    while (*p && *p != ']') {\\n        nums[numsSize++] = strtol(p, &p, 10);\\n        if (*p == ',') p++;\\n    }\\n    int target;\\n    scanf(\\\"%d\\\", &target);\\n    int returnSize;\\n    int *result = twoSum(nums, numsSize, target, &returnSize);\\n    int a = result[0], b = result[1];\\n    if (a > b) { int tmp = a; a = b; b = tmp; }\\n    printf(\\\"[%d,%d]\\\\n\\\", a, b);\\n    free(result);\\n    return 0;\\n}\\n",
    "cpp": "#include <iostream>\\n#include <vector>\\n#include <sstream>\\n#include <algorithm>\\nusing namespace std;\\n\\n{{USER_CODE}}\\n\\nint main() {\\n    string line;\\n    getline(cin, line);\\n    vector<int> nums;\\n    // parse array from string like [2,7,11,15]\\n    line = line.substr(1, line.size() - 2);\\n    stringstream ss(line);\\n    string token;\\n    while (getline(ss, token, ',')) nums.push_back(stoi(token));\\n    int target;\\n    cin >> target;\\n    vector<int> result = twoSum(nums, target);\\n    sort(result.begin(), result.end());\\n    cout << \\\"[\\\" << result[0] << \\\",\\\" << result[1] << \\\"]\\\" << endl;\\n    return 0;\\n}\\n",
    "java": "import java.util.*;\\n\\n{{USER_CODE}}\\n\\npublic class Main {\\n    public static void main(String[] args) {\\n        Scanner sc = new Scanner(System.in);\\n        String line = sc.nextLine().trim();\\n        line = line.substring(1, line.length() - 1);\\n        String[] parts = line.split(\\\",\\\");\\n        int[] nums = new int[parts.length];\\n        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i].trim());\\n        int target = sc.nextInt();\\n        Solution sol = new Solution();\\n        int[] result = sol.twoSum(nums, target);\\n        Arrays.sort(result);\\n        System.out.println(\\\"[\\\" + result[0] + \\\",\\\" + result[1] + \\\"]\\\");\\n    }\\n}\\n"
  }
}`;

export function QuestionsSection() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editorMode, setEditorMode] = useState<'form' | 'json'>('form');
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [formData, setFormData] = useState<Partial<CreateQuestionData>>({
    title: '',
    difficulty: 'Easy',
    category: '',
    description: '',
    inputFormat: '',
    outputFormat: '',
    constraints: '',
    examples: [{ input: '', output: '', explanation: '' }],
    hiddenTestCases: [],
    boilerplateCode: {
      python: '# Write your solution here\n',
      c: '// Write your solution here\n',
      cpp: '// Write your solution here\n',
      java: '// Write your solution here\n',
    },
    driverCode: {
      python: '',
      c: '',
      cpp: '',
      java: '',
    },
  });

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const data = await getAllQuestions();
      setQuestions(data as Question[]);
      setError('');
    } catch (err: any) {
      console.error('Error fetching questions:', err);
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = questions.filter(
    (q) =>
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (question?: Question) => {
    if (question) {
      setEditingQuestion(question);
      const initialData = {
        title: question.title,
        difficulty: question.difficulty,
        category: question.category,
        description: question.description,
        inputFormat: question.inputFormat,
        outputFormat: question.outputFormat,
        constraints: question.constraints,
        examples: question.examples,
        hiddenTestCases: question.hiddenTestCases || [],
        boilerplateCode: question.boilerplateCode || {
          python: '# Write your solution here\n',
          c: '// Write your solution here\n',
          cpp: '// Write your solution here\n',
          java: '// Write your solution here\n',
        },
        driverCode: question.driverCode || {
          python: '',
          c: '',
          cpp: '',
          java: '',
        },
      };
      setFormData(initialData);
      setJsonInput(JSON.stringify(initialData, null, 2));
    } else {
      setEditingQuestion(null);
      setFormData({
        title: '',
        difficulty: 'Easy',
        category: '',
        description: '',
        inputFormat: '',
        outputFormat: '',
        constraints: '',
        examples: [{ input: '', output: '', explanation: '' }],
        hiddenTestCases: [],
        boilerplateCode: {
          python: '# Write your solution here\n',
          c: '// Write your solution here\n',
          cpp: '// Write your solution here\n',
          java: '// Write your solution here\n',
        },
        driverCode: {
          python: '',
          c: '',
          cpp: '',
          java: '',
        },
      });
      setJsonInput(defaultQuestionJSON);
    }
    setEditorMode('form');
    setJsonError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingQuestion(null);
    setError('');
  };

  const handleModeChange = (mode: 'form' | 'json') => {
    if (mode === 'form' && editorMode === 'json') {
      try {
        const parsed = JSON.parse(jsonInput);
        setFormData((prev) => ({ ...prev, ...parsed }));
        setJsonError('');
        setEditorMode('form');
      } catch (err: any) {
        setJsonError('Invalid JSON format: ' + err.message);
      }
    } else if (mode === 'json' && editorMode === 'form') {
      setJsonInput(JSON.stringify(formData, null, 2));
      setJsonError('');
      setEditorMode('json');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let submissionData = { ...formData };
    
    if (editorMode === 'json') {
      try {
        const parsed = JSON.parse(jsonInput);
        submissionData = { ...submissionData, ...parsed };
      } catch (err: any) {
        setJsonError('Invalid JSON format: ' + err.message);
        return;
      }
    }

    setSubmitting(true);
    setError('');

    try {
      // Auto-calculate testCases from examples and hiddenTestCases
      const totalTestCases = (submissionData.examples?.length || 0) + (submissionData.hiddenTestCases?.length || 0);
      const dataToSubmit = { ...submissionData, testCases: totalTestCases };

      if (editingQuestion) {
        await updateQuestion(editingQuestion._id, dataToSubmit);
      } else {
        await createQuestion(dataToSubmit as CreateQuestionData);
      }
      await fetchQuestions();
      handleCloseModal();
    } catch (err: any) {
      console.error('Error saving question:', err);
      setError(err.response?.data?.message || 'Failed to save question');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      try {
        await deleteQuestion(id);
        await fetchQuestions();
      } catch (err: any) {
        console.error('Error deleting question:', err);
        alert('Failed to delete question');
      }
    }
  };

  const difficultyColors: Record<'Easy' | 'Medium' | 'Hard', string> = {
    Easy: 'text-green-500 bg-green-500/10',
    Medium: 'text-yellow-500 bg-yellow-500/10',
    Hard: 'text-red-500 bg-red-500/10',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading questions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Questions Bank</h2>
          <p className="text-gray-400 mt-1">Manage DSA problems for the contest</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Question
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-500">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
        <input
          type="text"
          placeholder="Search questions by title or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-3 px-12 text-white placeholder-gray-600 focus:outline-none focus:border-zinc-600 transition-colors"
        />
      </div>

      {/* Questions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredQuestions.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-gray-400">
            {searchTerm ? 'No questions found matching your search' : 'No questions yet. Click "Add Question" to create one.'}
          </div>
        ) : (
          filteredQuestions.map((question) => (
            <div
              key={question._id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">{question.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className={'px-2 py-1 rounded text-xs font-medium ' + difficultyColors[question.difficulty]}>
                      {question.difficulty}
                    </span>
                    <span className="text-gray-400 text-sm">{question.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenModal(question)}
                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(question._id)}
                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
              <p className="text-gray-400 text-sm line-clamp-2 mb-3">{question.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{question.testCases} test cases</span>
                <span>{question.examples.length} examples</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] flex flex-col">
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
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-500 text-sm">
                  {error}
                </div>
              )}

              {editorMode === 'json' ? (
                <div className="h-full flex flex-col">
                  {jsonError && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-500 text-sm mb-4">
                      {jsonError}
                    </div>
                  )}
                  <p className="text-gray-400 text-sm mb-2">Edit the raw JSON data for this question.</p>
                  <textarea
                    value={jsonInput}
                    onChange={(e) => {
                       setJsonInput(e.target.value);
                       setJsonError(''); // clear error while typing
                    }}
                    className="flex-1 w-full bg-black border border-zinc-800 rounded-lg p-4 text-green-400 font-mono text-sm focus:outline-none focus:border-zinc-500"
                    style={{ minHeight: '400px', whiteSpace: 'pre-wrap' }}
                  />
                </div>
              ) : (
                <>
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
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Category *</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-black border border-zinc-800 rounded-lg py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-zinc-600"
                      placeholder="e.g., Arrays, Trees, DP"
                      required
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

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded-lg py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-zinc-600"
                    rows={4}
                    placeholder="Enter question description..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Input Format *</label>
                    <textarea
                      value={formData.inputFormat}
                      onChange={(e) => setFormData({ ...formData, inputFormat: e.target.value })}
                      className="w-full bg-black border border-zinc-800 rounded-lg py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-zinc-600"
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Output Format *</label>
                    <textarea
                      value={formData.outputFormat}
                      onChange={(e) => setFormData({ ...formData, outputFormat: e.target.value })}
                      className="w-full bg-black border border-zinc-800 rounded-lg py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-zinc-600"
                      rows={3}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Constraints *</label>
                  <textarea
                    value={formData.constraints}
                    onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded-lg py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-zinc-600"
                    rows={3}
                    placeholder="Enter constraints separated by newlines"
                    required
                  />
                </div>
              </div>


              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm text-gray-300">Examples *</label>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      examples: [...(formData.examples || []), { input: '', output: '', explanation: '' }]
                    })}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    + Add Example
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.examples?.map((example, index) => (
                    <div key={index} className="bg-black border border-zinc-800 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs text-gray-500">Example {index + 1}</span>
                        {(formData.examples?.length || 0) > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newExamples = [...(formData.examples || [])];
                              newExamples.splice(index, 1);
                              setFormData({ ...formData, examples: newExamples });
                            }}
                            className="text-xs text-red-500 hover:text-red-400"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Input"
                          value={example.input}
                          onChange={(e) => {
                            const newExamples = [...(formData.examples || [])];
                            newExamples[index] = { ...newExamples[index], input: e.target.value };
                            setFormData({ ...formData, examples: newExamples });
                          }}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-zinc-600"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Output"
                          value={example.output}
                          onChange={(e) => {
                            const newExamples = [...(formData.examples || [])];
                            newExamples[index] = { ...newExamples[index], output: e.target.value };
                            setFormData({ ...formData, examples: newExamples });
                          }}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-zinc-600"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Explanation (optional)"
                          value={example.explanation || ''}
                          onChange={(e) => {
                            const newExamples = [...(formData.examples || [])];
                            newExamples[index] = { ...newExamples[index], explanation: e.target.value };
                            setFormData({ ...formData, examples: newExamples });
                          }}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-zinc-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hidden Test Cases */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <label className="block text-sm text-gray-300">Hidden Test Cases</label>
                    <span className="text-xs text-gray-500">(Private)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      hiddenTestCases: [...(formData.hiddenTestCases || []), { input: '', output: '', explanation: '' }]
                    })}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    + Add Test Case
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.hiddenTestCases && formData.hiddenTestCases.length > 0 ? (
                    formData.hiddenTestCases.map((testCase, index) => (
                      <div key={index} className="bg-black border border-zinc-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-amber-500 font-medium">Test Case {index + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newHiddenTests = [...(formData.hiddenTestCases || [])];
                              newHiddenTests.splice(index, 1);
                              setFormData({ ...formData, hiddenTestCases: newHiddenTests });
                            }}
                            className="text-xs text-red-500 hover:text-red-400"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Input"
                            value={testCase.input}
                            onChange={(e) => {
                              const newHiddenTests = [...(formData.hiddenTestCases || [])];
                              newHiddenTests[index] = { ...newHiddenTests[index], input: e.target.value };
                              setFormData({ ...formData, hiddenTestCases: newHiddenTests });
                            }}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-zinc-600"
                          />
                          <input
                            type="text"
                            placeholder="Output"
                            value={testCase.output}
                            onChange={(e) => {
                              const newHiddenTests = [...(formData.hiddenTestCases || [])];
                              newHiddenTests[index] = { ...newHiddenTests[index], output: e.target.value };
                              setFormData({ ...formData, hiddenTestCases: newHiddenTests });
                            }}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-zinc-600"
                          />
                          <input
                            type="text"
                            placeholder="Explanation (Optional)"
                            value={testCase.explanation || ''}
                            onChange={(e) => {
                              const newHiddenTests = [...(formData.hiddenTestCases || [])];
                              newHiddenTests[index] = { ...newHiddenTests[index], explanation: e.target.value };
                              setFormData({ ...formData, hiddenTestCases: newHiddenTests });
                            }}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-zinc-600"
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 italic mb-2">No hidden test cases added yet</div>
                  )}
                </div>
              </div>

              {/* Boilerplate Code */}
              <div className="col-span-2">
                <label className="block text-sm text-gray-300 mb-3">Boilerplate Code</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">Python</label>
                    <textarea
                      value={formData.boilerplateCode?.python || ''}
                      onChange={(e) => setFormData({ ...formData, boilerplateCode: { ...formData.boilerplateCode!, python: e.target.value } })}
                      rows={4}
                      className="w-full bg-black border border-zinc-800 rounded-lg py-2 px-3 text-white text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-zinc-600"
                      placeholder="def twoSum(nums, target):&#10;    pass"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">C</label>
                    <textarea
                      value={formData.boilerplateCode?.c || ''}
                      onChange={(e) => setFormData({ ...formData, boilerplateCode: { ...formData.boilerplateCode!, c: e.target.value } })}
                      rows={4}
                      className="w-full bg-black border border-zinc-800 rounded-lg py-2 px-3 text-white text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-zinc-600"
                      placeholder="int* twoSum(int* nums, int size) {&#10;    &#10;}"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">C++</label>
                    <textarea
                      value={formData.boilerplateCode?.cpp || ''}
                      onChange={(e) => setFormData({ ...formData, boilerplateCode: { ...formData.boilerplateCode!, cpp: e.target.value } })}
                      rows={4}
                      className="w-full bg-black border border-zinc-800 rounded-lg py-2 px-3 text-white text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-zinc-600"
                      placeholder="vector<int> twoSum(vector<int>& nums, int target) {&#10;    &#10;}"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">Java</label>
                    <textarea
                      value={formData.boilerplateCode?.java || ''}
                      onChange={(e) => setFormData({ ...formData, boilerplateCode: { ...formData.boilerplateCode!, java: e.target.value } })}
                      rows={4}
                      className="w-full bg-black border border-zinc-800 rounded-lg py-2 px-3 text-white text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-zinc-600"
                      placeholder="public int[] twoSum(int[] nums, int target) {&#10;    &#10;}"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Driver Code */}
              <div className="col-span-2 mt-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm text-gray-300">Driver Code (Hidden Wrapper)</label>
                  <span className="text-xs text-gray-500">Inject user's code using {'{{USER_CODE}}'} placeholder</span>
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
                <p className="text-xs text-gray-500 mt-2">Driver code overrides standard I/O reading. Leave driver code blank to use traditional CP execution defaults.</p>
              </div>
              </>
            )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-8 flex-shrink-0">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-white text-black py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving...' : (editingQuestion ? 'Save Changes' : 'Add Question')}
              </button>
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 bg-zinc-800 text-white py-3 rounded-lg font-medium hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
