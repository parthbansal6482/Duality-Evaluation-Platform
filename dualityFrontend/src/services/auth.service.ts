import api from './api';

interface AdminSignupData {
    name: string;
    email: string;
    password: string;
}

interface AdminLoginData {
    email: string;
    password: string;
}

interface TeamRegisterData {
    teamName: string;
    password: string;
    members: Array<{
        name: string;
        email: string;
    }>;
}

interface TeamLoginData {
    teamName: string;
    password: string;
}

// Admin Authentication
export const adminSignup = async (data: AdminSignupData) => {
    const response = await api.post('/admin/signup', data);
    if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.admin));
        localStorage.setItem('userType', 'admin');
    }
    return response.data;
};

export const adminLogin = async (data: AdminLoginData) => {
    const response = await api.post('/admin/login', data);
    if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.admin));
        localStorage.setItem('userType', 'admin');
    }
    return response.data;
};

export const getAdminProfile = async () => {
    const response = await api.get('/admin/profile');
    return response.data;
};

// Team Authentication
export const teamRegister = async (data: TeamRegisterData) => {
    const response = await api.post('/team/register', data);
    return response.data;
};

export const teamLogin = async (data: TeamLoginData) => {
    const response = await api.post('/team/login', data);
    if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.team));
        localStorage.setItem('userType', 'team');
    }
    return response.data;
};

export const getTeamProfile = async () => {
    const response = await api.get('/team/profile');
    return response.data;
};

// Logout
export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
};

// Check if user is authenticated
export const isAuthenticated = () => {
    return !!localStorage.getItem('token');
};

// Get current user type
export const getUserType = () => {
    return localStorage.getItem('userType');
};

// Get current user
export const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};
