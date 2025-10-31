import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getGroups, getUsers, createGroup, updateGroup, deleteGroup, bulkCreateGroups } from '../services/api';
import { StudentGroup, User, UserRole, GradingStatus } from '../types';
import { useNotifications } from '../contexts/NotificationContext';
// FIX: Added import for XLSX library to handle spreadsheet data.
import * as XLSX from 'xlsx';

const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const EditIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const SaveIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>;
const XIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const UploadIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>;

const GroupManagementPage: React.FC = () => {
    const [groups, setGroups] = useState<StudentGroup[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [panels, setPanels] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentGroup, setCurrentGroup] = useState<Partial<StudentGroup> | null>(null);
    const { addNotification } = useNotifications();
    const importGroupsRef = useRef<HTMLInputElement>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [groupsData, usersData] = await Promise.all([getGroups(), getUsers()]);
            setGroups(groupsData);
            setUsers(usersData);
            setPanels(usersData.filter(u => u.role === UserRole.PANEL || u.role === UserRole.EXTERNAL_PANEL));
        } catch (error) {
            console.error("Failed to fetch data:", error);
            addNotification("Failed to load data.");
        } finally {
            setLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = (group: Partial<StudentGroup> | null = null) => {
        setCurrentGroup(group ? { ...group } : { name: '', projectTitle: '' });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentGroup(null);
    };

    const handleSave = async () => {
        if (!currentGroup || !currentGroup.name) {
            addNotification("Group name is required.");
            return;
        }
        
        try {
            if (currentGroup.id) {
                await updateGroup(currentGroup as StudentGroup);
                addNotification(`Group "${currentGroup.name}" updated successfully.`);
            } else {
                await createGroup(currentGroup as Omit<StudentGroup, 'id' | 'status' | 'grades'>);
                addNotification(`Group "${currentGroup.name}" created successfully.`);
            }
            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save group:", error);
            addNotification("Failed to save group.");
        }
    };

    const handleDelete = async () => {
        if (!currentGroup || !currentGroup.id) return;
        try {
            await deleteGroup(currentGroup.id);
            addNotification(`Group "${currentGroup.name}" deleted successfully.`);
            fetchData();
            setIsDeleteModalOpen(false);
            setCurrentGroup(null);
        } catch (error) {
            console.error("Failed to delete group:", error);
            addNotification("Failed to delete group.");
        }
    };
    
    const openDeleteModal = (group: StudentGroup) => {
        setCurrentGroup(group);
        setIsDeleteModalOpen(true);
    };

    const handleBulkImport = (event: React.ChangeEvent<HTMLInputElement>) => {
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

                const groupsToCreate = json.map(row => ({
                    name: row['Group Name'],
                    projectTitle: row['Project Title'] || row['Title']
                })).filter(g => g.name);


                if (groupsToCreate.length > 0) {
                    const { addedCount, skippedCount } = await bulkCreateGroups(groupsToCreate);
                    addNotification(`Bulk import complete. Added: ${addedCount}, Skipped (duplicates): ${skippedCount}.`);
                    fetchData();
                } else {
                    addNotification("No groups found in the 'Group Name' column.");
                }
            } catch (error) {
                addNotification("Failed to process file.");
                console.error(error);
            }
        };
        reader.readAsArrayBuffer(file);
        event.target.value = ''; // Reset file input
    };

    const groupStats = useMemo(() => {
        const total = groups.length;
        const graded = groups.filter(g => g.status === GradingStatus.COMPLETED).length;
        const ungraded = total - graded;
        return { total, graded, ungraded };
    }, [groups]);
    
    const tableContainerClasses = groups.length > 5 ? 'max-h-96 overflow-y-auto' : '';
    
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Group Management</h1>
                <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    <PlusIcon />
                    <span>Add Group</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md text-center">
                    <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">Total Groups</h3>
                    <p className="text-3xl font-bold">{groupStats.total}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md text-center">
                    <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">Graded</h3>
                    <p className="text-3xl font-bold text-green-600">{groupStats.graded}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md text-center">
                    <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">Ungraded</h3>
                    <p className="text-3xl font-bold text-yellow-600">{groupStats.ungraded}</p>
                </div>
            </div>

            {loading ? <p>Loading...</p> : (
                <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto ${tableContainerClasses}`}>
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Group Name</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Project Title</th>
                                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {groups.map(group => (
                                <tr key={group.id}>
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="font-medium">{group.name}</div></td>
                                    <td className="px-6 py-4 whitespace-nowrap">{group.projectTitle}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenModal(group)} className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-900">
                                            <EditIcon />
                                            <span>Edit</span>
                                        </button>
                                        <button onClick={() => openDeleteModal(group)} className="inline-flex items-center space-x-1 text-red-600 hover:text-red-900 ml-4">
                                            <TrashIcon />
                                            <span>Delete</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">Bulk Add Groups</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Upload an XLSX or CSV file with a column named "Group Name" to create multiple groups at once. You can optionally include a "Project Title" or "Title" column.</p>
                <button onClick={() => importGroupsRef.current?.click()} className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                    <UploadIcon />
                    <span>Import From File</span>
                </button>
                <input type="file" ref={importGroupsRef} accept=".xlsx, .csv" onChange={handleBulkImport} className="hidden" />
            </div>

            {isModalOpen && currentGroup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
                        <h2 className="text-xl font-bold">{currentGroup.id ? 'Edit Group' : 'Add Group'}</h2>
                        <div>
                            <label className="block text-sm font-medium">Group Name</label>
                            <input type="text" value={currentGroup.name || ''} onChange={e => setCurrentGroup({ ...currentGroup, name: e.target.value })} className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-indigo-50 dark:bg-gray-700/50 border-indigo-300 dark:border-indigo-800" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Project Title</label>
                            <input type="text" value={currentGroup.projectTitle || ''} onChange={e => setCurrentGroup({ ...currentGroup, projectTitle: e.target.value })} className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-indigo-50 dark:bg-gray-700/50 border-indigo-300 dark:border-indigo-800" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium">Chair Panel</label>
                            <select value={currentGroup.panel1Id || ''} onChange={e => setCurrentGroup({ ...currentGroup, panel1Id: e.target.value })} className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-indigo-50 dark:bg-gray-700/50 border-indigo-300 dark:border-indigo-800">
                                <option value="">Select Panel</option>
                                {panels.filter(p => p.role === UserRole.PANEL).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Internal Panel</label>
                            <select value={currentGroup.panel2Id || ''} onChange={e => setCurrentGroup({ ...currentGroup, panel2Id: e.target.value })} className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-indigo-50 dark:bg-gray-700/50 border-indigo-300 dark:border-indigo-800">
                                <option value="">Select Panel</option>
                                {panels.filter(p => p.role === UserRole.PANEL).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium">External Panel</label>
                            <select value={currentGroup.externalPanelId || ''} onChange={e => setCurrentGroup({ ...currentGroup, externalPanelId: e.target.value })} className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-indigo-50 dark:bg-gray-700/50 border-indigo-300 dark:border-indigo-800">
                                <option value="">Select Panel</option>
                                {panels.filter(p => p.role === UserRole.EXTERNAL_PANEL).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
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
             {isDeleteModalOpen && currentGroup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold">Confirm Deletion</h2>
                        <p className="mt-2">Are you sure you want to delete the group "{currentGroup.name}"? This action cannot be undone.</p>
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

export default GroupManagementPage;
