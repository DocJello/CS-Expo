
import React, { useRef, useState } from 'react';
import { backupSystem, restoreSystem, deleteAllGroups } from '../services/mockApi';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

const MaintenancePage: React.FC = () => {
    const { addNotification } = useNotifications();
    const restoreInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();
    const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);

    const handleBackup = async () => {
        try {
            const data = await backupSystem();
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
            const link = document.createElement("a");
            link.href = jsonString;
            link.download = `cs-expo-backup-${new Date().toISOString()}.json`;
            link.click();
            addNotification("System backup successful.");
        } catch (error) {
            addNotification("System backup failed.");
        }
    };

    const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File content is not valid");
                const data = JSON.parse(text);
                if (!data.users || !data.groups) throw new Error("Invalid backup file format");
                
                await restoreSystem(data);
                addNotification("System restore successful. Data will be updated on next page navigation.");
            } catch (error) {
                console.error("Restore failed:", error);
                addNotification(`Restore failed: ${error instanceof Error ? error.message : "Unknown error"}`);
            } finally {
                if (restoreInputRef.current) {
                    restoreInputRef.current.value = "";
                }
            }
        };
        reader.readAsText(file);
    };
    
    const handleDeleteAll = async () => {
        try {
            await deleteAllGroups();
            addNotification("All groups and grades have been deleted.");
        } catch (error) {
            addNotification("Failed to delete all groups.");
        } finally {
            setIsDeleteAllModalOpen(false);
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Maintenance System</h1>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">System Backup & Restore</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Download a full backup of all users and groups, or restore the system from a backup file.</p>
                 <div className="flex space-x-2">
                    <button onClick={handleBackup} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Backup Data</button>
                    <button onClick={() => restoreInputRef.current?.click()} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Restore Data</button>
                    <input type="file" accept=".json" ref={restoreInputRef} onChange={handleRestore} className="hidden" />
                </div>
            </div>

            {user?.role === UserRole.ADMIN && (
                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-red-800 dark:text-red-300 mb-4">Danger Zone</h2>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-4">This action will permanently delete all student groups and their associated grades. This cannot be undone.</p>
                    <button onClick={() => setIsDeleteAllModalOpen(true)} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Delete All Groups</button>
                </div>
            )}
            
            {isDeleteAllModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold">Confirm Delete All Groups</h2>
                        <p className="mt-2">Are you absolutely sure you want to delete all groups and their grades? This action is irreversible.</p>
                        <div className="flex justify-end space-x-2 mt-4">
                            <button onClick={() => setIsDeleteAllModalOpen(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">Cancel</button>
                            <button onClick={handleDeleteAll} className="px-4 py-2 bg-red-600 text-white rounded-md">Yes, Delete Everything</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MaintenancePage;
