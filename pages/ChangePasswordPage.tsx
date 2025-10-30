import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { changePassword as apiChangePassword } from '../services/api';
import { useNotifications } from '../contexts/NotificationContext';

const ChangePasswordPage: React.FC = () => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const { user } = useAuth();
    const { addNotification } = useNotifications();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }
        if (newPassword.length < 6) {
            setError("New password must be at least 6 characters long.");
            return;
        }
        if (!user) {
            setError("You must be logged in to change your password.");
            return;
        }

        try {
            await apiChangePassword(user.id, oldPassword, newPassword);
            addNotification("Password changed successfully!");
            setMessage("Password changed successfully!");
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(`Failed to change password: ${errorMessage}`);
        }
    };

    return (
        <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Change Password</h1>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="old-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Old Password</label>
                        <input
                            type="password"
                            id="old-password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700"
                        />
                    </div>
                     <div>
                        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                        <input
                            type="password"
                            id="new-password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700"
                        />
                    </div>
                     <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
                        <input
                            type="password"
                            id="confirm-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700"
                        />
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {message && <p className="text-sm text-green-500">{message}</p>}

                    <div>
                        <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Update Password
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordPage;