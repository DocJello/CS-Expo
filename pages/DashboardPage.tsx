import React, { useState, useEffect, useMemo } from 'react';
import { getGroups, getUsers } from '../services/api';
import { StudentGroup, User, GradingStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import GradeSheetCard from '../components/dashboard/GradeSheetCard';

const FileSpreadsheetIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 12h8"/><path d="M8 16h8"/><path d="M12 8v8"/></svg>;
const FileTextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;

const DashboardPage: React.FC = () => {
    const [groups, setGroups] = useState<StudentGroup[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<GradingStatus | 'All'>('All');
    const { user } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [groupsData, usersData] = await Promise.all([getGroups(), getUsers()]);
                setGroups(groupsData);
                setUsers(usersData);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredGroups = useMemo(() => {
        let displayGroups = groups;
        if (user && (user.role === 'Panel' || user.role === 'External Panel')) {
            displayGroups = groups.filter(g => g.panel1Id === user.id || g.panel2Id === user.id || g.externalPanelId === user.id);
        }
        if (filter !== 'All') {
            return displayGroups.filter(group => group.status === filter);
        }
        return displayGroups;
    }, [groups, filter, user]);
    
    const getUserName = (id?: string) => users.find(u => u.id === id)?.name || 'N/A';
    
    const handleExport = (format: 'csv' | 'word') => {
        let content = '';
        const headers = ['Group Name', 'Project Title', 'Panel 1', 'Panel 2', 'External Panel', 'Status', 'Remark'];
        
        const data = filteredGroups.map(group => {
            const finalScore = 0; // Simplified
            const remark = group.status === GradingStatus.COMPLETED ? (finalScore >= 75 ? 'Passed' : 'Failed') : 'N/A';
            return [
                group.name,
                group.projectTitle,
                getUserName(group.panel1Id),
                getUserName(group.panel2Id),
                getUserName(group.externalPanelId),
                group.status,
                remark,
            ];
        });

        if (format === 'csv') {
            content = [headers.join(','), ...data.map(row => row.join(','))].join('\n');
            const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", "dashboard_summary.csv");
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } else { // 'word' - simplified as text
             content = `CS Expo Dashboard Summary\n\n${headers.join('\t')}\n` + data.map(row => row.join('\t')).join('\n');
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
            const link = document.createElement("a");
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", "dashboard_summary.txt");
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    };
    
    const filterOptions: (GradingStatus | 'All')[] = ['All', GradingStatus.NOT_STARTED, GradingStatus.IN_PROGRESS, GradingStatus.COMPLETED];
    const filterLabels: Record<GradingStatus | 'All', string> = {
        'All': 'All Statuses',
        [GradingStatus.NOT_STARTED]: GradingStatus.NOT_STARTED,
        [GradingStatus.IN_PROGRESS]: GradingStatus.IN_PROGRESS,
        [GradingStatus.COMPLETED]: GradingStatus.COMPLETED,
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
                <div className="flex items-center space-x-4">
                    {(user?.role === 'Admin' || user?.role === 'Course Adviser') && (
                        <div className="flex items-center space-x-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
                            {filterOptions.map(option => (
                                <button
                                    key={option}
                                    onClick={() => setFilter(option)}
                                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                                        filter === option
                                            ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {filterLabels[option]}
                                </button>
                            ))}
                        </div>
                    )}
                    <button onClick={() => handleExport('csv')} className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition">
                        <FileSpreadsheetIcon />
                        <span>Export CSV</span>
                    </button>
                    <button onClick={() => handleExport('word')} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
                        <FileTextIcon />
                        <span>Export Word</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <p className="text-center text-gray-500 dark:text-gray-400">Loading grade sheets...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredGroups.map(group => (
                        // Fix: Pass 'group' and 'users' props to GradeSheetCard component.
                        <GradeSheetCard key={group.id} group={group} users={users} />
                    ))}
                </div>
            )}
        </div>
    );
};

// Fix: Add default export to the component.
export default DashboardPage;
