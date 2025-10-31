import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getUsers, createUser, updateUser, deleteUser, bulkCreateUsers, bulkUpdateUserEmails } from '../services/api';
import { User, UserRole } from '../types';
import { useNotifications } from '../contexts/NotificationContext';
import * as XLSX from 'xlsx';

const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const EditIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const SaveIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>;
const XIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const UploadIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>;

const UserTable = ({ title, users, onEdit, onDelete }: { title: string, users: User[], onEdit: (user: User) => void, onDelete: (user: User) => void }) => {
    const isScrollable = (title === 'Internal Panels' || title === 'External Panels') && users.length > 5;
    const containerClasses = `bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto ${isScrollable ? 'max-h-96 overflow-y-auto' : ''}`;

    return (
        <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-700 dark:text-gray-300">{title}</h2>
            <div className={containerClasses}>
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map(user => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium">{user.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{user.role}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => onEdit(user)} className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-900">
                                        <EditIcon />
                                        <span>Edit</span>
                                    </button>
                                    <button
                                        onClick={() => user.role !== UserRole.ADMIN && onDelete(user)}
                                        className={`ml-4 inline-flex items-center space-x-1 ${
                                            user.role === UserRole.ADMIN
                                                ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                                : 'text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-500'
                                        }`}
                                        disabled={user.role === UserRole.ADMIN}
                                    >
                                        <TrashIcon />
                                        <span>Delete</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const UserManagementPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<Partial<User> | null>(null);
    const { addNotification } = useNotifications();
    const importPanelsRef = useRef<HTMLInputElement>(null);
    const importEmailsRef = useRef<HTMLInputElement>(null);


    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const usersData = await getUsers();
            setUsers(usersData);
        } catch (error) {
            console.error("Failed to fetch users:", error);
            addNotification("Failed to load users.");
        } finally {
            setLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const { admins, internalPanels, externalPanels } = useMemo(() => ({
        admins: users.filter(u => u.role === UserRole.ADMIN || u.role === UserRole.COURSE_ADVISER),
        internalPanels: users.filter(u => u.role === UserRole.PANEL),
        externalPanels: users.filter(u => u.role === UserRole.EXTERNAL_PANEL),
    }), [users]);

    const handleOpenModal = (user: Partial<User> | null = null) => {
        setCurrentUser(user ? { ...user } : { name: '', email: '', role: UserRole.PANEL, password: '' });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentUser(null);
    };

    const handleSave = async () => {
        if (!currentUser || !currentUser.name || !currentUser.email || !currentUser.role) {
            addNotification("All fields are required.");
            return;
        }
        if (!currentUser.id && (!currentUser.password || currentUser.password.length < 3)) {
            addNotification("Password must be at least 3 characters for new users.");
            return;
        }

        try {
            if (currentUser.id) {
                await updateUser(currentUser as User);
                addNotification(`User "${currentUser.name}" updated successfully.`);
            } else {
                await createUser(currentUser as Omit<User, 'id'>);
                addNotification(`User "${currentUser.name}" created successfully.`);
            }
            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save user:", error);
            addNotification("Failed to save user.");
        }
    };
    
    const handleDelete = async () => {
        if (!currentUser || !currentUser.id) return;
        try {
            await deleteUser(currentUser.id);
            addNotification(`User "${currentUser.name}" deleted successfully.`);
            fetchData();
            setIsDeleteModalOpen(false);
            setCurrentUser(null);
        } catch (error) {
            console.error("Failed to delete user:", error);
            addNotification("Failed to delete user.");
        }
    };

    const openDeleteModal = (user: User) => {
        setCurrentUser(user);
        setIsDeleteModalOpen(true);
    };

    const handleBulkImportPanels = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json: any[] = XLSX.utils.sheet_to_json(worksheet);
                
                const externalPanelNames = new Set<string>();
                const internalPanelNames = new Set<string>();

                json.forEach(row => {
                    if (row['External Panel']?.trim()) externalPanelNames.add(row['External Panel'].trim());
                    if (row['Chair Panel']?.trim()) internalPanelNames.add(row['Chair Panel'].trim());
                    if (row['Internal Panel']?.trim()) internalPanelNames.add(row['Internal Panel'].trim());
                });

                const usersToCreate: Omit<User, 'id'>[] = [];
                const createdNames = new Set<string>();

                externalPanelNames.forEach(name => {
                    usersToCreate.push({
                        name: name,
                        email: `${name.toLowerCase().replace(/\s+/g, '.')}@expo.com`,
                        role: UserRole.EXTERNAL_PANEL,
                        password: 'password'
                    });
                    createdNames.add(name.toLowerCase());
                });

                internalPanelNames.forEach(name => {
                    if (!createdNames.has(name.toLowerCase())) {
                         usersToCreate.push({
                            name: name,
                            email: `${name.toLowerCase().replace(/\s+/g, '.')}@expo.com`,
                            role: UserRole.PANEL,
                            password: 'password'
                        });
                        createdNames.add(name.toLowerCase());
                    }
                });

                if (usersToCreate.length > 0) {
                    const { addedCount, skippedCount } = await bulkCreateUsers(usersToCreate);
                    addNotification(`Bulk panel import complete. Added: ${addedCount}, Skipped (duplicates): ${skippedCount}.`);
                    fetchData();
                } else {
                    addNotification(`No new panels found in the file.`);
                }
            } catch (error) {
                addNotification("Failed to process file.");
                console.error(error);
            }
        };
        reader.readAsArrayBuffer(file);
        event.target.value = ''; // Reset file input
    };

    const handleBulkEmailUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json: any[] = XLSX.utils.sheet_to_json(worksheet);

                const updates = json
                    .map(row => ({ name: row['Name'], email: row['Email'] }))
                    .filter(item => item.name && item.email);
                
                if (updates.length > 0) {
                    const { updatedCount, notFoundCount } = await bulkUpdateUserEmails(updates);
                    addNotification(`Email update complete. Updated: ${updatedCount}, Not Found: ${notFoundCount}.`);
                    fetchData();
                } else {
                    addNotification("No valid 'Name' and 'Email' pairs found in the file.");
                }

            } catch (error) {
                 addNotification("Failed to process email assignment file.");
                 console.error(error);
            }
        };
        reader.readAsArrayBuffer(file);
        event.target.value = ''; // Reset file input
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">User Management</h1>
                <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    <PlusIcon />
                    <span>Add User</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4">Bulk Add Panels</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Upload an XLSX file with columns 'External Panel', 'Chair Panel', and/or 'Internal Panel' to create panel users. Roles are assigned based on the columns names appear in, with 'External Panel' taking priority.</p>
                    <button onClick={() => importPanelsRef.current?.click()} className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                        <UploadIcon />
                        <span>Import Panels</span>
                    </button>
                    <input type="file" ref={importPanelsRef} accept=".xlsx, .csv" onChange={handleBulkImportPanels} className="hidden" />
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4">Bulk Email Assignment</h2>
                     <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Upload an XLSX file with "Name" and "Email" columns to update existing users' email addresses. The name must be an exact match.</p>
                    <button onClick={() => importEmailsRef.current?.click()} className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                        <UploadIcon />
                        <span>Import Emails</span>
                    </button>
                    <input type="file" ref={importEmailsRef} accept=".xlsx, .csv" onChange={handleBulkEmailUpdate} className="hidden" />
                </div>
            </div>

            {loading ? <p>Loading...</p> : (
                <>
                    <UserTable title="Administrators & Advisers" users={admins} onEdit={handleOpenModal} onDelete={openDeleteModal} />
                    <UserTable title="Internal Panels" users={internalPanels} onEdit={handleOpenModal} onDelete={openDeleteModal} />
                    <UserTable title="External Panels" users={externalPanels} onEdit={handleOpenModal} onDelete={openDeleteModal} />
                </>
            )}

            {isModalOpen && currentUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
                        <h2 className="text-xl font-bold">{currentUser.id ? 'Edit User' : 'Add User'}</h2>
                        <div>
                            <label className="block text-sm font-medium">Name</label>
                            <input type="text" value={currentUser.name || ''} onChange={e => setCurrentUser({ ...currentUser, name: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Email</label>
                            <input type="email" value={currentUser.email || ''} onChange={e => setCurrentUser({ ...currentUser, email: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Role</label>
                            <select value={currentUser.role || ''} onChange={e => setCurrentUser({ ...currentUser, role: e.target.value as UserRole })} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                                {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Password</label>
                            <input type="password" placeholder={currentUser.id ? "Leave blank to keep unchanged" : ""} onChange={e => setCurrentUser({ ...currentUser, password: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button onClick={handleCloseModal} className="flex items-center space-x-2 px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">
                                <XIcon />
                                <span>Cancel</span>
                            </button>
                            <button onClick={handleSave} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md">
                                <SaveIcon />
                                <span>Save</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isDeleteModalOpen && currentUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold">Confirm Deletion</h2>
                        <p className="mt-2">Are you sure you want to delete the user "{currentUser.name}"? This action cannot be undone.</p>
                        <div className="flex justify-end space-x-2 mt-4">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="flex items-center space-x-2 px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">
                                <XIcon />
                                <span>Cancel</span>
                            </button>
                            <button onClick={handleDelete} className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md">
                                <TrashIcon className="w-4 h-4" />
                                <span>Delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagementPage;
