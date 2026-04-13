import api from './dualityApi';

// ========== AUTH ==========

export const dualityGoogleLogin = async (credential: string) => {
    const res = await api.post('/duality/auth/google', { credential });
    return res.data;
};

export const dualityGetMe = async () => {
    const res = await api.get('/duality/auth/me');
    return res.data;
};

export const getDualityLeaderboard = async () => {
    const res = await api.get('/duality/auth/leaderboard');
    return res.data;
};

// ========== SETTINGS ==========

export const getDualitySettings = async () => {
    const res = await api.get('/duality/settings');
    return res.data;
};

export const updateDualitySettings = async (settings: { isOpenRegistration?: boolean, isPasteEnabled?: boolean }) => {
    const res = await api.put('/duality/settings', settings);
    return res.data;
};

// ========== ALLOWED EMAILS ==========

export const getAllowedEmails = async () => {
    const res = await api.get('/duality/allowed-emails');
    return res.data;
};

export const addAllowedEmail = async (email: string) => {
    const res = await api.post('/duality/allowed-emails', { email });
    return res.data;
};

export const addBulkAllowedEmails = async (emails: string[]) => {
    const res = await api.post('/duality/allowed-emails/bulk', { emails });
    return res.data;
};

export const removeAllowedEmail = async (email: string) => {
    const res = await api.delete(`/duality/allowed-emails/${encodeURIComponent(email)}`);
    return res.data;
};

// ========== QUESTIONS ==========

export const getDualityQuestions = async () => {
    const res = await api.get('/duality/questions');
    return res.data;
};

export const getDualityQuestion = async (id: string) => {
    const res = await api.get(`/duality/questions/${id}`);
    return res.data;
};

export const createDualityQuestion = async (data: {
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    category: string;
    description: string;
    constraints?: string[];
    examples: { input: string; output: string; explanation?: string }[];
    testCases: { input: string; output: string }[];
    boilerplate?: { python?: string; c?: string; cpp?: string; java?: string };
    driverCode?: { python?: string; c?: string; cpp?: string; java?: string };
}) => {
    const res = await api.post('/duality/questions', data);
    return res.data;
};

export const updateDualityQuestion = async (id: string, data: Record<string, unknown>) => {
    const res = await api.put(`/duality/questions/${id}`, data);
    return res.data;
};

export const deleteDualityQuestion = async (id: string) => {
    const res = await api.delete(`/duality/questions/${id}`);
    return res.data;
};

// ========== SUBMISSIONS ==========

export const submitDualityCode = async (questionId: string, code: string, language: string) => {
    const res = await api.post('/duality/submissions', { questionId, code, language });
    return res.data;
};

export const runDualityCode = async (questionId: string, code: string, language: string) => {
    const res = await api.post('/duality/submissions/run', { questionId, code, language });
    return res.data;
};

export const getDualitySubmission = async (id: string) => {
    const res = await api.get(`/duality/submissions/${id}`);
    return res.data;
};

export const getDualityUserSubmissions = async () => {
    const res = await api.get('/duality/submissions/user/me');
    return res.data;
};

export const getDualityQuestionSubmissions = async (questionId: string) => {
    const res = await api.get(`/duality/submissions/question/${questionId}`);
    return res.data;
};

// ========== ADMIN SPECIAL ==========

export const getDualityUsers = async () => {
    const res = await api.get('/duality/auth/users');
    return res.data;
};

export const getAllDualitySubmissions = async () => {
    const res = await api.get('/duality/submissions/all');
    return res.data;
};
