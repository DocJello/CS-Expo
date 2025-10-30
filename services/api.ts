import { User, StudentGroup, RubricScore } from '../types';

// IMPORTANT: Before deployment, replace this with your backend's public URL.
// For local development, this should point to your local backend server.
// Per your instructions, this will be replaced with your Render URL during deployment.
export const API_URL = 'https://cs-expo-web-api.onrender.com'; 

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};

const apiFetch = (endpoint: string, options: RequestInit = {}) => {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    return fetch(`${API_URL}${endpoint}`, { ...options, headers }).then(handleResponse);
};

// --- AUTH ---
export const login = (email: string, password: string): Promise<User> => {
    return apiFetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
};

// --- USERS ---
export const getUsers = (): Promise<User[]> => apiFetch('/api/users');

export const createUser = (user: Omit<User, 'id'>): Promise<User> => {
    return apiFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(user),
    });
};

export const updateUser = (user: User): Promise<User> => {
    return apiFetch(`/api/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify(user),
    });
};

export const deleteUser = (userId: string): Promise<{ success: boolean }> => {
    return apiFetch(`/api/users/${userId}`, { method: 'DELETE' });
};

export const bulkCreateUsers = (usersToCreate: Omit<User, 'id'>[]): Promise<{ addedCount: number, skippedCount: number }> => {
    return apiFetch('/api/users/bulk-create', {
        method: 'POST',
        body: JSON.stringify(usersToCreate),
    });
};

export const bulkUpdateUserEmails = (updates: { name: string, email: string }[]): Promise<{ updatedCount: number, notFoundCount: number }> => {
    return apiFetch('/api/users/bulk-update-emails', {
        method: 'POST',
        body: JSON.stringify(updates),
    });
};

export const changePassword = (userId: string, oldPassword: string, newPassword: string): Promise<{ success: boolean }> => {
    return apiFetch(`/api/users/${userId}/change-password`, {
        method: 'POST',
        body: JSON.stringify({ oldPassword, newPassword }),
    });
};

// --- GROUPS ---
export const getGroups = (): Promise<StudentGroup[]> => apiFetch('/api/groups');
export const getGroupById = (id: string): Promise<StudentGroup> => apiFetch(`/api/groups/${id}`);

export const createGroup = (group: Omit<StudentGroup, 'id' | 'status' | 'grades'>): Promise<StudentGroup> => {
    return apiFetch('/api/groups', {
        method: 'POST',
        body: JSON.stringify(group),
    });
};

export const updateGroup = (group: Partial<StudentGroup>): Promise<StudentGroup> => {
    return apiFetch(`/api/groups/${group.id}`, {
        method: 'PUT',
        body: JSON.stringify(group),
    });
};

export const deleteGroup = (groupId: string): Promise<{ success: boolean }> => {
    return apiFetch(`/api/groups/${groupId}`, { method: 'DELETE' });
};

export const bulkCreateGroups = (groupsToCreate: { name: string, projectTitle?: string }[]): Promise<{ addedCount: number, skippedCount: number }> => {
    return apiFetch('/api/groups/bulk-create', {
        method: 'POST',
        body: JSON.stringify(groupsToCreate),
    });
};

export const deleteAllGroups = (): Promise<{ success: boolean }> => {
    return apiFetch('/api/groups/all', { method: 'DELETE' });
};

// --- GRADING ---
export const submitGrade = (groupId: string, panelistId: string, presenterScores: RubricScore, thesisScores: RubricScore): Promise<StudentGroup> => {
    return apiFetch(`/api/grades/${groupId}`, {
        method: 'POST',
        body: JSON.stringify({ panelistId, presenterScores, thesisScores }),
    });
};

// --- SYSTEM ---
export const backupSystem = (): Promise<{ users: User[], groups: StudentGroup[] }> => apiFetch('/api/system/backup');

export const restoreSystem = (data: { users: User[], groups: StudentGroup[] }): Promise<{ success: boolean }> => {
    return apiFetch('/api/system/restore', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};
