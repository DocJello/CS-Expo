import React, { useState, useEffect, useMemo } from 'react';
import { getGroups } from '../services/api';
import { StudentGroup, GradingStatus } from '../types';
import { BEST_PRESENTER_RUBRIC, BEST_THESIS_RUBRIC } from '../constants';

interface AwardWinner {
    groupName: string;
    projectTitle: string;
    score: number;
}

const GoldBadge = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="gold" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 Z"/></svg>;

const AwardsPage: React.FC = () => {
    const [groups, setGroups] = useState<StudentGroup[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const groupsData = await getGroups();
            setGroups(groupsData.filter(g => g.status === GradingStatus.COMPLETED));
            setLoading(false);
        };
        fetchData();
    }, []);

    const awardWinners = useMemo(() => {
        const maxPresenterScore = BEST_PRESENTER_RUBRIC.reduce((sum, item) => sum + item.weight, 0);
        const maxThesisScore = BEST_THESIS_RUBRIC.reduce((sum, item) => sum + item.weight, 0);
        
        const presenterScores: AwardWinner[] = [];
        const thesisScores: AwardWinner[] = [];

        groups.forEach(group => {
            if (!group.grades || group.grades.length === 0) return;

            // FIX: Cast value to number as Object.values() returns `unknown[]` which cannot be used in arithmetic operations.
            const avgPresenter = group.grades.reduce((sum, grade) => sum + Object.values(grade.presenterScores).reduce((s,v) => s + Number(v), 0), 0) / group.grades.length;
            // FIX: Cast value to number as Object.values() returns `unknown[]` which cannot be used in arithmetic operations.
            const avgThesis = group.grades.reduce((sum, grade) => sum + Object.values(grade.thesisScores).reduce((s,v) => s + Number(v), 0), 0) / group.grades.length;
            
            presenterScores.push({ groupName: group.name, projectTitle: group.projectTitle, score: (avgPresenter / maxPresenterScore) * 100 });
            thesisScores.push({ groupName: group.name, projectTitle: group.projectTitle, score: (avgThesis / maxThesisScore) * 100 });
        });

        const top3Presenters = presenterScores.sort((a, b) => b.score - a.score).slice(0, 3);
        const top3Theses = thesisScores.sort((a, b) => b.score - a.score).slice(0, 3);

        return { top3Presenters, top3Theses };
    }, [groups]);

    if (loading) return <p>Calculating awards...</p>;

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Awards</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <AwardCategory title="Best Presenter" winners={awardWinners.top3Presenters} />
                <AwardCategory title="Best Thesis" winners={awardWinners.top3Theses} />
            </div>
        </div>
    );
};

interface AwardCategoryProps {
    title: string;
    winners: AwardWinner[];
}

const AwardCategory: React.FC<AwardCategoryProps> = ({ title, winners }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-center mb-4">{title}</h2>
        <ul className="space-y-4">
            {winners.map((winner, index) => (
                <li key={index} className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                    <span className="text-2xl font-bold text-gray-400 dark:text-gray-500 mr-4">{index + 1}</span>
                    <div className="flex-1">
                        <p className="font-semibold text-lg">{winner.groupName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{winner.projectTitle}</p>
                    </div>
                    <div className="flex items-center">
                        {index === 0 && <GoldBadge/>}
                        <span className="font-bold text-lg ml-2">{winner.score.toFixed(2)}%</span>
                    </div>
                </li>
            ))}
             {winners.length === 0 && <p className="text-center text-gray-500">No completed evaluations yet.</p>}
        </ul>
    </div>
);


export default AwardsPage;
