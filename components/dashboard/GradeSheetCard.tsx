import React from 'react';
import { Link } from 'react-router-dom';
import { StudentGroup, User, GradingStatus } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { BEST_PRESENTER_RUBRIC, BEST_THESIS_RUBRIC } from '../../constants';

interface GradeSheetCardProps {
    group: StudentGroup;
    users: User[];
}

const GradeSheetCard: React.FC<GradeSheetCardProps> = ({ group, users }) => {
    const { user } = useAuth();
    const getUserName = (id?: string) => users.find(u => u.id === id)?.name || 'N/A';
    
    const maxPresenterScore = BEST_PRESENTER_RUBRIC.reduce((sum, item) => sum + item.weight, 0);
    const maxThesisScore = BEST_THESIS_RUBRIC.reduce((sum, item) => sum + item.weight, 0);

    const getFinalScore = () => {
        if (group.status !== GradingStatus.COMPLETED || !group.grades.length) return 0;
        
        const totalScore = group.grades.reduce((acc, grade) => {
            // FIX: Cast value to number as Object.values() returns `unknown[]` which cannot be used in arithmetic operations.
            const presenterScore = Object.values(grade.presenterScores).reduce((s, v) => s + Number(v), 0);
            // FIX: Cast value to number as Object.values() returns `unknown[]` which cannot be used in arithmetic operations.
            const thesisScore = Object.values(grade.thesisScores).reduce((s, v) => s + Number(v), 0);
            return acc + (presenterScore / maxPresenterScore) * 100 + (thesisScore / maxThesisScore) * 100;
        }, 0);
        
        // This is a simplified calculation logic.
        // It averages the percentage scores of presenter and thesis rubrics across all panelists.
        return totalScore / (group.grades.length * 2);
    };
    
    const finalScore = getFinalScore();
    const remark = finalScore >= 75 ? 'Passed' : 'Failed';

    const getStatusChipColor = () => {
        switch (group.status) {
            case GradingStatus.NOT_STARTED: return 'bg-gray-200 text-gray-800';
            case GradingStatus.IN_PROGRESS: return 'bg-yellow-200 text-yellow-800';
            case GradingStatus.COMPLETED: return 'bg-green-200 text-green-800';
            default: return 'bg-gray-200 text-gray-800';
        }
    };
    
    const isPanelistForGroup = user && (group.panel1Id === user.id || group.panel2Id === user.id || group.externalPanelId === user.id);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105 duration-300">
            <div className="p-5">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{group.name}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChipColor()}`}>{group.status}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate" title={group.projectTitle}>
                    {group.projectTitle}
                </p>

                <div className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <p><strong>Panel 1:</strong> {getUserName(group.panel1Id)}</p>
                    <p><strong>Panel 2:</strong> {getUserName(group.panel2Id)}</p>
                    <p><strong>External:</strong> {getUserName(group.externalPanelId)}</p>
                </div>
                
                {group.status === GradingStatus.COMPLETED && (
                    <div className={`mt-4 text-center py-2 rounded-md font-bold ${remark === 'Passed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                        Remark: {remark} ({finalScore.toFixed(2)}%)
                    </div>
                )}
            </div>

            {(isPanelistForGroup && group.status !== GradingStatus.COMPLETED) && (
                <Link to={`/grading/${group.id}`} className="block w-full text-center bg-indigo-600 text-white py-2 font-semibold hover:bg-indigo-700 transition">
                    Go to Grading Sheet
                </Link>
            )}
        </div>
    );
};

export default GradeSheetCard;
