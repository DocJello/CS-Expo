
import React, { useState } from 'react';
import { RubricItem, RubricScore } from '../../types';
import RubricInfoModal from './RubricInfoModal';

interface RubricProps {
    title: string;
    rubricItems: RubricItem[];
    scores: RubricScore;
    onScoreChange: (scores: RubricScore) => void;
}

const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;


const Rubric: React.FC<RubricProps> = ({ title, rubricItems, scores, onScoreChange }) => {
    const [modalItem, setModalItem] = useState<RubricItem | null>(null);

    const handleScoreUpdate = (itemId: string, score: number) => {
        onScoreChange({ ...scores, [itemId]: score });
    };

    const handleLevelSelect = (itemId: string, score: number) => {
        handleScoreUpdate(itemId, score);
        setModalItem(null);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4">{title}</h3>
            <div className="space-y-4">
                {rubricItems.map(item => (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center border-t dark:border-gray-700 pt-4 first:border-t-0 first:pt-0">
                        <div className="md:col-span-2">
                            <div className="flex items-center space-x-2">
                                <h4 className="font-semibold">{item.name} ({item.weight}%)</h4>
                                <button onClick={() => setModalItem(item)} className="text-blue-500 hover:text-blue-700">
                                    <InfoIcon/>
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                        </div>
                        <div>
                            <input
                                type="number"
                                max={item.weight}
                                min={0}
                                value={scores[item.id] || ''}
                                onChange={(e) => handleScoreUpdate(item.id, Math.min(parseInt(e.target.value, 10), item.weight))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700"
                                placeholder={`Score / ${item.weight}`}
                            />
                        </div>
                    </div>
                ))}
            </div>
            {modalItem && (
                <RubricInfoModal 
                    item={modalItem} 
                    onClose={() => setModalItem(null)} 
                    onLevelSelect={(score) => handleLevelSelect(modalItem.id, score)}
                />
            )}
        </div>
    );
};

export default Rubric;
