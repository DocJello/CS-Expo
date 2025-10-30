import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getGroups, getUsers, updateGroup } from '../services/mockApi';
import { StudentGroup, User, GradingStatus, UserRole } from '../types';
import { BEST_PRESENTER_RUBRIC, BEST_THESIS_RUBRIC } from '../constants';
import { useNotifications } from '../contexts/NotificationContext';
import * as XLSX from 'xlsx';

const MasterlistPage: React.FC = () => {
    const [groups, setGroups] = useState<StudentGroup[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const { addNotification } = useNotifications();
    const importFileRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [viewedGroup, setViewedGroup] = useState<StudentGroup | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [groupsData, usersData] = await Promise.all([getGroups(), getUsers()]);
            setGroups(groupsData);
            setUsers(usersData);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            addNotification("Failed to load masterlist data.");
        } finally {
            setLoading(false);
        }
    }, [addNotification]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const { externalPanels, internalPanels } = useMemo(() => {
        return {
            externalPanels: users.filter(u => u.role === UserRole.EXTERNAL_PANEL),
            internalPanels: users.filter(u => u.role === UserRole.PANEL || u.role === UserRole.COURSE_ADVISER),
        };
    }, [users]);
    
    const maxPresenterScore = useMemo(() => BEST_PRESENTER_RUBRIC.reduce((sum, item) => sum + item.weight, 0), []);
    const maxThesisScore = useMemo(() => BEST_THESIS_RUBRIC.reduce((sum, item) => sum + item.weight, 0), []);

    const getUserName = (id?: string) => users.find(u => u.id === id)?.name || 'N/A';

    const calculateScores = (group: StudentGroup) => {
        if (group.status !== GradingStatus.COMPLETED || !group.grades.length) {
            return { presenterScore: 'N/A', thesisScore: 'N/A' };
        }
        
        const totalPresenter = group.grades.reduce((sum, grade) => sum + Object.values(grade.presenterScores).reduce((s,v) => s+(v as number), 0), 0);
        const totalThesis = group.grades.reduce((sum, grade) => sum + Object.values(grade.thesisScores).reduce((s,v) => s+(v as number), 0), 0);
        
        const avgPresenter = totalPresenter / group.grades.length;
        const avgThesis = totalThesis / group.grades.length;

        return {
            presenterScore: `${((avgPresenter / maxPresenterScore) * 100).toFixed(2)}%`,
            thesisScore: `${((avgThesis / maxThesisScore) * 100).toFixed(2)}%`
        };
    };
    
    const handlePanelChange = async (groupId: string, panelType: 'panel1Id' | 'panel2Id' | 'externalPanelId', panelistId: string) => {
        const group = groups.find(g => g.id === groupId);
        if (!group) return;

        const updatedGroup = { ...group, [panelType]: panelistId || undefined };
        
        if (updatedGroup.panel1Id && updatedGroup.panel1Id === updatedGroup.panel2Id) {
            addNotification("Chair Panel and Internal Panel cannot be the same person.");
            return;
        }

        try {
            await updateGroup(updatedGroup);
            setGroups(prev => prev.map(g => g.id === groupId ? updatedGroup : g));
            addNotification(`Panel for ${group.name} updated.`);
        } catch (error) {
            addNotification("Failed to update panel assignment.");
        }
    };

    const handleExportToWord = () => {
        let content = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>Masterlist Export</title></head><body>`;
        
        content += '<h1>Masterlist and Panel Assignment</h1>';
        content += '<table border="1" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">';
        content += `
            <thead>
                <tr style="background-color: #f2f2f2;">
                    <th style="padding: 8px;">Group</th>
                    <th style="padding: 8px;">External Panel</th>
                    <th style="padding: 8px;">Chair Panel</th>
                    <th style="padding: 8px;">Internal Panel</th>
                    <th style="padding: 8px;">Best Presenter</th>
                    <th style="padding: 8px;">Best Thesis</th>
                </tr>
            </thead>
            <tbody>
        `;

        groups.forEach(group => {
            const scores = calculateScores(group);
            content += `
                <tr>
                    <td style="padding: 8px;"><b>${group.name}</b><br/><small>${group.projectTitle}</small></td>
                    <td style="padding: 8px;">${getUserName(group.externalPanelId)}</td>
                    <td style="padding: 8px;">${getUserName(group.panel1Id)}</td>
                    <td style="padding: 8px;">${getUserName(group.panel2Id)}</td>
                    <td style="padding: 8px; text-align: center;">${scores.presenterScore}</td>
                    <td style="padding: 8px; text-align: center;">${scores.thesisScore}</td>
                </tr>
            `;
        });

        content += '</tbody></table></body></html>';
        
        const blob = new Blob([content], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "masterlist.doc";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        addNotification("Masterlist exported to Word successfully.");
    };

    const handleImportMasterlist = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
                
                setIsImporting(true);
                setImportProgress(0);

                let updatedCount = 0;
                let groupsNotFound = new Set<string>();
                let panelsNotFound = new Set<string>();

                const allPanels = [...internalPanels, ...externalPanels];
                const totalRows = json.length;
                
                if (totalRows === 0) {
                    addNotification("The selected file is empty or has no data.");
                    setIsImporting(false);
                    return;
                }

                for (let i = 0; i < totalRows; i++) {
                    const row = json[i];
                    const groupName = row['Group Name']?.trim();

                    if (!groupName) {
                        setImportProgress(((i + 1) / totalRows) * 100);
                        continue;
                    }

                    const group = groups.find(g => g.name.trim().toLowerCase() === groupName.toLowerCase());
                    if (!group) {
                        groupsNotFound.add(groupName);
                        setImportProgress(((i + 1) / totalRows) * 100);
                        continue;
                    }

                    const externalPanelName = row['External Panel']?.trim();
                    const chairPanelName = row['Chair Panel']?.trim();
                    const internalPanelName = row['Internal Panel']?.trim();

                    const findPanelId = (name: string | undefined) => {
                        if (!name) return undefined;
                        const panel = allPanels.find(p => p.name.trim().toLowerCase() === name.toLowerCase());
                        if (!panel) panelsNotFound.add(name);
                        return panel?.id;
                    };

                    const updatedGroup: StudentGroup = { 
                        ...group,
                        externalPanelId: findPanelId(externalPanelName) ?? group.externalPanelId,
                        panel1Id: findPanelId(chairPanelName) ?? group.panel1Id,
                        panel2Id: findPanelId(internalPanelName) ?? group.panel2Id
                    };
                    
                    if (updatedGroup.panel1Id && updatedGroup.panel1Id === updatedGroup.panel2Id) {
                         addNotification(`Assignment skipped for ${group.name}: Chair and Internal panels cannot be the same.`);
                         setImportProgress(((i + 1) / totalRows) * 100);
                         continue;
                    }

                    const hasChanged = group.externalPanelId !== updatedGroup.externalPanelId ||
                                     group.panel1Id !== updatedGroup.panel1Id ||
                                     group.panel2Id !== updatedGroup.panel2Id;
                    
                    if(hasChanged) {
                        await updateGroup(updatedGroup);
                        updatedCount++;
                    }
                    
                    setImportProgress(((i + 1) / totalRows) * 100);
                }
                
                setTimeout(() => {
                    setIsImporting(false);
                    addNotification(`Import complete. Updated: ${updatedCount}. Groups not found: ${groupsNotFound.size}. Panels not found: ${panelsNotFound.size}.`);
                    if(groupsNotFound.size > 0) console.warn("Groups not found:", Array.from(groupsNotFound));
                    if(panelsNotFound.size > 0) console.warn("Panels not found:", Array.from(panelsNotFound));
                    
                    fetchData();
                }, 500);

            } catch (error) {
                setIsImporting(false);
                addNotification("Failed to process masterlist file.");
                console.error(error);
            } finally {
                if (importFileRef.current) {
                    importFileRef.current.value = '';
                }
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const tableContainerClasses = groups.length > 5 ? 'max-h-[40rem] overflow-y-auto' : '';

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Masterlist and Panel Assignment</h1>
                 <div className="flex space-x-2">
                    <button onClick={() => importFileRef.current?.click()} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                        Import Masterlist
                    </button>
                    <input type="file" ref={importFileRef} onChange={handleImportMasterlist} accept=".xlsx" className="hidden" />
                    <button onClick={handleExportToWord} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Export to Word
                    </button>
                </div>
            </div>

            {loading ? <p>Loading masterlist...</p> : (
                <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto ${tableContainerClasses}`}>
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase">Group</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase">External Panel</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase">Chair Panel</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase">Internal Panel</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase">Best Presenter</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase">Best Thesis</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {groups.map(group => {
                                const scores = calculateScores(group);
                                return (
                                <tr key={group.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button onClick={() => setViewedGroup(group)} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                                            {group.name}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select value={group.externalPanelId || ''} onChange={e => handlePanelChange(group.id, 'externalPanelId', e.target.value)} className="input-style w-full">
                                            <option value="">Assign...</option>
                                            {externalPanels.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select value={group.panel1Id || ''} onChange={e => handlePanelChange(group.id, 'panel1Id', e.target.value)} className="input-style w-full">
                                            <option value="">Assign...</option>
                                            {internalPanels.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                         <select value={group.panel2Id || ''} onChange={e => handlePanelChange(group.id, 'panel2Id', e.target.value)} className="input-style w-full">
                                            <option value="">Assign...</option>
                                            {internalPanels.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-center">{scores.presenterScore}</td>
                                    <td className="px-6 py-4 font-medium text-center">{scores.thesisScore}</td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            )}
            
            {isImporting && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
                        <h2 className="text-xl font-bold">Importing Masterlist...</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Please wait while we process your file. This may take a moment.</p>
                        <div className="w-full bg-gray-200 rounded-full dark:bg-gray-700">
                            <div 
                                className="bg-indigo-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full transition-all duration-300" 
                                style={{ width: `${importProgress}%` }}
                            >
                                {Math.round(importProgress)}%
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {viewedGroup && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
                    onClick={() => setViewedGroup(null)}
                >
                    <div 
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 space-y-4"
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-bold border-b pb-2 dark:border-gray-700">Group Details</h2>
                        <div>
                            <p className="font-semibold">Group Name:</p>
                            <p>{viewedGroup.name}</p>
                        </div>
                         <div>
                            <p className="font-semibold">Project Title:</p>
                            <p>{viewedGroup.projectTitle}</p>
                        </div>
                        <div className="flex justify-end pt-2">
                             <button onClick={() => setViewedGroup(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MasterlistPage;
