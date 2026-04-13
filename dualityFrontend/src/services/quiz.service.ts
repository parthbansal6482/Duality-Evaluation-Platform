import axios from 'axios';

const DUALITY_API_URL = import.meta.env.VITE_DUALITY_API_URL || 'http://localhost:5000/api/duality';

const getHeaders = () => {
  const token = localStorage.getItem('dualityToken');
  return { Authorization: `Bearer ${token}` };
};

// ─── Quiz CRUD ────────────────────────────────────────────────────────────────

export const getQuizzes = async () => {
  const res = await axios.get(`${DUALITY_API_URL}/quiz`, { headers: getHeaders() });
  return res.data;
};

export const getQuiz = async (id: string) => {
  const res = await axios.get(`${DUALITY_API_URL}/quiz/${id}`, { headers: getHeaders() });
  return res.data;
};

export const createQuiz = async (data: {
  title: string;
  description?: string;
  durationMinutes: number;
  questions: string[];
  startTime?: string;
  endTime?: string;
}) => {
  const res = await axios.post(`${DUALITY_API_URL}/quiz`, data, { headers: getHeaders() });
  return res.data;
};

export const updateQuiz = async (id: string, data: Partial<{
  title: string;
  description: string;
  durationMinutes: number;
  questions: string[];
  status: string;
  startTime: string;
  endTime: string;
}>) => {
  const res = await axios.patch(`${DUALITY_API_URL}/quiz/${id}`, data, { headers: getHeaders() });
  return res.data;
};

export const deleteQuiz = async (id: string) => {
  const res = await axios.delete(`${DUALITY_API_URL}/quiz/${id}`, { headers: getHeaders() });
  return res.data;
};

// ─── Quiz Lifecycle ───────────────────────────────────────────────────────────

export const activateQuiz = async (id: string) => {
  const res = await axios.patch(`${DUALITY_API_URL}/quiz/${id}/activate`, {}, { headers: getHeaders() });
  return res.data;
};

export const endQuiz = async (id: string) => {
  const res = await axios.patch(`${DUALITY_API_URL}/quiz/${id}/end`, {}, { headers: getHeaders() });
  return res.data;
};

// ─── Submissions ──────────────────────────────────────────────────────────────

export const submitQuizAnswer = async (
  quizId: string,
  payload: { questionId: string; code: string; language: string }
) => {
  const res = await axios.post(`${DUALITY_API_URL}/quiz/${quizId}/submit`, payload, { headers: getHeaders() });
  return res.data;
};

export const getQuizResults = async (quizId: string) => {
  const res = await axios.get(`${DUALITY_API_URL}/quiz/${quizId}/results`, { headers: getHeaders() });
  return res.data;
};

export const getMyQuizResult = async (quizId: string) => {
  const res = await axios.get(`${DUALITY_API_URL}/quiz/${quizId}/my-result`, { headers: getHeaders() });
  return res.data;
};
