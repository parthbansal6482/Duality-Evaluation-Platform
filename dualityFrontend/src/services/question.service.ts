import api from './api';

export interface Question {
    _id: string;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    category: string;
    description: string;
    inputFormat: string;
    outputFormat: string;
    constraints: string;
    examples: {
        input: string;
        output: string;
        explanation?: string;
    }[];
    hiddenTestCases?: {
        input: string;
        output: string;
        explanation?: string;
    }[];
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
    createdBy?: {
        _id: string;
        name: string;
        email: string;
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateQuestionData {
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    category: string;
    description: string;
    inputFormat: string;
    outputFormat: string;
    constraints: string;
    examples: {
        input: string;
        output: string;
        explanation?: string;
    }[];
    hiddenTestCases?: {
        input: string;
        output: string;
        explanation?: string;
    }[];
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

/**
 * Get all questions
 */
export const getAllQuestions = async (filters?: {
    difficulty?: string;
    category?: string;
    search?: string;
}): Promise<Question[]> => {
    const params = new URLSearchParams();
    if (filters?.difficulty) params.append('difficulty', filters.difficulty);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);

    const response = await api.get(`/questions?${params.toString()}`);
    return response.data.data;
};

/**
 * Get question by ID
 */
export const getQuestionById = async (id: string): Promise<Question> => {
    const response = await api.get(`/questions/${id}`);
    return response.data.data;
};

/**
 * Create new question
 */
export const createQuestion = async (data: CreateQuestionData): Promise<Question> => {
    const response = await api.post('/questions', data);
    return response.data.data;
};

/**
 * Update question
 */
export const updateQuestion = async (id: string, data: Partial<CreateQuestionData>): Promise<Question> => {
    const response = await api.put(`/questions/${id}`, data);
    return response.data.data;
};

/**
 * Delete question
 */
export const deleteQuestion = async (id: string): Promise<void> => {
    await api.delete(`/questions/${id}`);
};
