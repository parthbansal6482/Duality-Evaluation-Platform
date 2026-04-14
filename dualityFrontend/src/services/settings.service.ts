import api from './api';

export const getSettings = async () => {
    const res = await api.get('/settings');
    return res.data;
};

export const updateSettings = async (settings: { isPasteEnabled?: boolean, autoApproveTeams?: boolean }) => {
    const res = await api.put('/settings', settings);
    return res.data;
};
