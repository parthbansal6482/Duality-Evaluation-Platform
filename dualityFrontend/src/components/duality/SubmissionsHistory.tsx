import { CheckCircle2, XCircle, Clock, Code2 } from 'lucide-react';

interface Submission {
  _id: string;
  question: {
    title: string;
  };
  language: string;
  status: string;
  executionTime: number;
  memoryUsed: number;
  submittedAt: string;
  testCasesPassed: number;
  totalTestCases: number;
}

import { useEffect, useState } from 'react';
import { getDualityUserSubmissions } from '../../services/duality.service';
import { dualitySocket } from '../../services/dualitySocket.service';

export function SubmissionsHistory() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchSubmissions = async () => {
    try {
      const result = await getDualityUserSubmissions();
      if (result.success) {
        setSubmissions(result.data);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useEffect(() => {
    dualitySocket.connect();
    const unsubscribe = dualitySocket.onSubmissionUpdate((data) => {
      console.log('[SubmissionsHistory] Received real-time update:', data);

      // Get current user ID to verify ownership
      const dualityUser = JSON.parse(localStorage.getItem('dualityUser') || '{}');
      const userId = dualityUser.id || dualityUser._id;
      const dataUserId = (data as any).user?.id || (data as any).user?._id;

      if (!dataUserId || dataUserId === userId) {
        fetchSubmissions();
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(submissions.length / pageSize));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [submissions, currentPage]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted': return ' text-green-500 ';
      case 'wrong_answer': return ' text-red-500 ';
      case 'runtime_error': return '';
      case 'time_limit_exceeded': return ' text-yellow-500 ';
      default: return ' text-gray-500 ';
    }
  };

  const getStatusStyle = (status: string) => {
    if (status.toLowerCase() === 'runtime_error') {
      return {
        color: 'rgb(249, 115, 22)'
      };
    }
    return undefined;
  };

  const getStatusDisplay = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getStatusIcon = (status: string) => {
    if (status.toLowerCase() === 'accepted') {
      return <CheckCircle2 className="w-4 h-4" />;
    }
    return <XCircle className="w-4 h-4" />;
  };

  const totalPages = Math.max(1, Math.ceil(submissions.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedSubmissions = submissions.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Submission History</h2>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Code2 className="w-4 h-4" />
          <span>{submissions.length} Total Submissions</span>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black border-b border-zinc-800">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Status</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Problem</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Language</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Runtime</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Memory</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Tests</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">Time</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSubmissions.map((submission) => (
                <tr key={submission._id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 ${getStatusColor(submission.status)} w-fit`}
                      style={getStatusStyle(submission.status)}
                    >
                      {getStatusIcon(submission.status)}
                      <span className="text-xs font-medium">{getStatusDisplay(submission.status)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white font-medium">{submission.question?.title || 'Unknown Problem'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-400 font-mono capitalize">{submission.language}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-400">{submission.executionTime} ms</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-400">{submission.memoryUsed} KB</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm ${submission.testCasesPassed === submission.totalTestCases ? 'text-green-500' : 'text-yellow-500'}`}>
                      {submission.testCasesPassed}/{submission.totalTestCases}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(submission.submittedAt).toLocaleString()}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && submissions.length > pageSize && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-black/40">
            <p className="text-xs text-gray-500">
              Showing {startIndex + 1}-{Math.min(startIndex + pageSize, submissions.length)} of {submissions.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${currentPage === page
                    ? 'bg-white text-black'
                    : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
                    }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Acceptance Rate</p>
          <p className="text-2xl font-bold text-green-500">
            {submissions.length > 0 ? Math.round((submissions.filter(s => s.status === 'accepted').length / submissions.length) * 100) : 0}%
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Accepted</p>
          <p className="text-2xl font-bold text-white">
            {submissions.filter(s => s.status === 'accepted').length}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Language Distribution</p>
          <p className="text-xs font-bold text-white">
            {submissions.length > 0 ? Array.from(new Set(submissions.map(s => s.language))).slice(0, 2).join(', ') : 'None'}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Total Submissions</p>
          <p className="text-2xl font-bold text-white">{submissions.length}</p>
        </div>
      </div>
    </div>
  );
}
