import api from './dualityApi';

// ─── Quiz CRUD ────────────────────────────────────────────────────────────────

export const getQuizzes = async () => {
  const res = await api.get('/duality/quiz');
  return res.data;
};

export const getQuiz = async (id: string) => {
  const res = await api.get(`/duality/quiz/${id}`);
  return res.data;
};

export const createQuiz = async (data: {
  title: string;
  description?: string;
  durationMinutes: number;
  questions: string[];
  assignedTo?: string[];
  startTime?: string;
  endTime?: string;
}) => {
  const res = await api.post('/duality/quiz', data);
  return res.data;
};

export const updateQuiz = async (id: string, data: Partial<{
  title: string;
  description: string;
  durationMinutes: number;
  questions: string[];
  assignedTo: string[];
  status: string;
  startTime: string;
  endTime: string;
}>) => {
  const res = await api.patch(`/duality/quiz/${id}`, data);
  return res.data;
};

export const deleteQuiz = async (id: string) => {
  const res = await api.delete(`/duality/quiz/${id}`);
  return res.data;
};

// ─── Quiz Lifecycle ───────────────────────────────────────────────────────────

export const activateQuiz = async (id: string) => {
  const res = await api.patch(`/duality/quiz/${id}/activate`, {});
  return res.data;
};

export const endQuiz = async (id: string) => {
  const res = await api.patch(`/duality/quiz/${id}/end`, {});
  return res.data;
};

// ─── Submissions ──────────────────────────────────────────────────────────────

export const submitQuizAnswer = async (
  quizId: string,
  payload: { questionId: string; code: string; language: string; isRunOnly?: boolean }
) => {
  const res = await api.post(`/duality/quiz/${quizId}/submit`, payload);
  return res.data;
};

export const getQuizResults = async (quizId: string) => {
  const res = await api.get(`/duality/quiz/${quizId}/results`);
  return res.data;
};

export const getMyQuizResult = async (quizId: string) => {
  const res = await api.get(`/duality/quiz/${quizId}/my-result`);
  return res.data;
};

