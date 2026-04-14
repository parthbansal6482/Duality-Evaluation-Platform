import api from './api';

export interface Round {
    _id: string;
    name: string;
    duration: number;
    questions: Array<{
        _id: string;
        title: string;
        difficulty: string;
        category: string;
    } | string>;
    status: 'upcoming' | 'active' | 'completed';
    startTime?: string;
    endTime?: string;
    createdBy?: {
        _id: string;
        name: string;
        email: string;
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateRoundData {
    name: string;
    duration: number;
    questions: string[];
    status?: 'upcoming' | 'active' | 'completed';
}

/**
 * Get all rounds
 */
export const getAllRounds = async (filters?: {
    status?: string;
    search?: string;
}): Promise<Round[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);

    const response = await api.get(`/rounds?${params.toString()}`);
    return response.data.data;
};

/**
 * Get round by ID
 */
export const getRoundById = async (id: string): Promise<Round> => {
    const response = await api.get(`/rounds/${id}`);
    return response.data.data;
};

/**
 * Create new round
 */
export const createRound = async (data: CreateRoundData): Promise<Round> => {
    const response = await api.post('/rounds', data);
    return response.data.data;
};

/**
 * Update round
 */
export const updateRound = async (id: string, data: Partial<CreateRoundData>): Promise<Round> => {
    const response = await api.put(`/rounds/${id}`, data);
    return response.data.data;
};

/**
 * Delete round
 */
export const deleteRound = async (id: string): Promise<void> => {
    await api.delete(`/rounds/${id}`);
};

/**
 * Update round status
 */
export const updateRoundStatus = async (
    id: string,
    status: 'upcoming' | 'active' | 'completed'
): Promise<Round> => {
    const response = await api.patch(`/rounds/${id}/status`, { status });
    return response.data.data;
};

// ===== Team-facing functions =====

/**
 * Get active rounds for teams
 */
export const getActiveRounds = async () => {
    const response = await api.get('/rounds/active');
    return response.data;
};

/**
 * Get round questions for teams
 */
export const getRoundQuestions = async (roundId: string) => {
    const response = await api.get(`/rounds/${roundId}/questions`);
    return response.data;
};

/**
 * Submit solution for a question
 */
export const submitSolution = async (
    roundId: string,
    questionId: string,
    code: string,
    language: string
) => {
    const response = await api.post(`/rounds/${roundId}/submit`, {
        questionId,
        code,
        language,
    });
    return response.data;
};

/**
 * Get team's submissions for a round
 */
export const getRoundSubmissions = async (roundId: string) => {
    const response = await api.get(`/rounds/${roundId}/submissions`);
    return response.data;
};

/**
 * Run code against sample test cases (no submission)
 */
export const runCode = async (
    roundId: string,
    questionId: string,
    code: string,
    language: string
) => {
    const response = await api.post(`/rounds/${roundId}/run`, {
        questionId,
        code,
        language,
    });
    return response.data;
};

/**
 * Exit round and reset all progress
 */
export const exitRound = async (roundId: string) => {
    const response = await api.post(`/rounds/${roundId}/exit`);
    return response.data;
};

/**
 * Complete round (keep progress, prevent re-entry)
 */
export const completeRound = async (roundId: string) => {
    const response = await api.post(`/rounds/${roundId}/complete`);
    return response.data;
};

