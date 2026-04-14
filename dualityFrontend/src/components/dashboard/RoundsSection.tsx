import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Clock } from 'lucide-react';
import {
  getAllRounds,
  createRound,
  updateRound,
  deleteRound,
  Round as APIRound,
  CreateRoundData,
} from '../../services/round.service';
import { getAllQuestions } from '../../services/question.service';

interface Round {
  _id: string;
  name: string;
  duration: number;
  questions: Array<{
    _id: string;
    title: string;
    difficulty: string;
    category: string;
  }>;
  status: 'upcoming' | 'active' | 'completed';
  startTime?: string;
  endTime?: string;
}

export function RoundsSection() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<Array<{ _id: string; title: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRound, setEditingRound] = useState<Round | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateRoundData>>({
    name: '',
    duration: 60,
    questions: [],
    status: 'upcoming',
  });

  useEffect(() => {
    fetchRounds();
    fetchQuestions();
  }, []);

  const fetchRounds = async () => {
    try {
      setLoading(true);
      const data = await getAllRounds();
      setRounds(data as Round[]);
      setError('');
    } catch (err: any) {
      console.error('Error fetching rounds:', err);
      setError('Failed to load rounds');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      // Check if user is admin before fetching
      const userType = localStorage.getItem('userType');
      if (userType !== 'admin') {
        console.warn('Not logged in as admin, skipping question fetch');
        return;
      }

      const data = await getAllQuestions();
      setAvailableQuestions(data.map(q => ({ _id: q._id, title: q.title })));
    } catch (err: any) {
      console.error('Error fetching questions:', err);
      // Don't show error to user for questions fetch failure
      // as it's not critical for viewing rounds
      if (err.response?.status === 403) {
        console.warn('Access denied: Admin authentication required');
      }
    }
  };

  const filteredRounds = rounds.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (round?: Round) => {
    if (round) {
      setEditingRound(round);
      setFormData({
        name: round.name,
        duration: round.duration,
        questions: round.questions.map(q => typeof q === 'string' ? q : q._id),
        status: round.status,
      });
    } else {
      setEditingRound(null);
      setFormData({
        name: '',
        duration: 60,
        questions: [],
        status: 'upcoming',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRound(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (editingRound) {
        await updateRound(editingRound._id, formData);
      } else {
        await createRound(formData as CreateRoundData);
      }
      await fetchRounds();
      handleCloseModal();
    } catch (err: any) {
      console.error('Error saving round:', err);
      setError(err.response?.data?.message || 'Failed to save round');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this round?')) {
      try {
        await deleteRound(id);
        await fetchRounds();
      } catch (err: any) {
        console.error('Error deleting round:', err);
        alert('Failed to delete round');
      }
    }
  };

  const toggleQuestion = (questionId: string) => {
    const currentQuestions = formData.questions || [];
    if (currentQuestions.includes(questionId)) {
      setFormData({
        ...formData,
        questions: currentQuestions.filter(id => id !== questionId),
      });
    } else {
      setFormData({
        ...formData,
        questions: [...currentQuestions, questionId],
      });
    }
  };

  const statusColors = {
    upcoming: 'text-blue-500 bg-blue-500/10',
    active: 'text-green-500 bg-green-500/10',
    completed: 'text-gray-500 bg-gray-500/10',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading rounds...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Contest Rounds</h2>
          <p className="text-gray-400 mt-1">Manage competition rounds and schedules</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Round
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
          placeholder="Search rounds..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-3 px-12 text-white placeholder-gray-600 focus:outline-none focus:border-zinc-600 transition-colors"
        />
      </div>

      {/* Rounds List */}
      <div className="space-y-4">
        {filteredRounds.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {searchTerm ? 'No rounds found matching your search' : 'No rounds yet. Click "Create Round" to add one.'}
          </div>
        ) : (
          filteredRounds.map((round) => (
            <div
              key={round._id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{round.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[round.status]}`}>
                      {round.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{round.duration} minutes</span>
                    </div>
                    <span>{round.questions.length} questions</span>
                  </div>
                  {round.questions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {round.questions.map((q) => (
                        <span
                          key={typeof q === 'string' ? q : q._id}
                          className="px-2 py-1 bg-zinc-800 rounded text-xs text-gray-300"
                        >
                          {typeof q === 'string' ? q : q.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenModal(round)}
                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(round._id)}
                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                {editingRound ? 'Edit Round' : 'Create New Round'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-500 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-300 mb-2">Round Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-zinc-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    value={formData.duration !== undefined && isNaN(formData.duration) ? '' : formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="w-full bg-black border border-zinc-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-zinc-600"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'upcoming' | 'active' | 'completed' })}
                    className="w-full bg-black border border-zinc-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-zinc-600"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Select Questions ({formData.questions?.length || 0} selected)
                </label>
                <div className="bg-black border border-zinc-800 rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
                  {availableQuestions.length === 0 ? (
                    <p className="text-gray-500 text-sm">No questions available. Create questions first.</p>
                  ) : (
                    availableQuestions.map((question) => (
                      <label
                        key={question._id}
                        className="flex items-center gap-2 p-2 hover:bg-zinc-900 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.questions?.includes(question._id) || false}
                          onChange={() => toggleQuestion(question._id)}
                          className="w-4 h-4"
                        />
                        <span className="text-white text-sm">{question.title}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-white text-black py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : (editingRound ? 'Update Round' : 'Create Round')}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 bg-zinc-800 text-white py-2 rounded-lg font-medium hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
