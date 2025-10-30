
import React from 'react';
import { RubricItem } from '../../types';

interface RubricInfoModalProps {
    item: RubricItem;
    onClose: () => void;
    onLevelSelect: (score: number) => void;
}

const RubricInfoModal: React.FC<RubricInfoModalProps> = ({ item, onClose, onLevelSelect }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">{item.name}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-white">&times;</button>
                </div>
                <div className="p-4 overflow-y-auto">
                    <p className="mb-4 text-gray-600 dark:text-gray-400">{item.description}</p>
                    <div className="space-y-3">
                        {item.levels.map((level, index) => (
                            <button 
                                key={index} 
                                onClick={() => onLevelSelect(level.score)}
                                className="w-full text-left p-3 border dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            >
                                <p className="font-semibold text-indigo-600 dark:text-indigo-400">{level.points} points</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{level.description}</p>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="p-4 border-t dark:border-gray-700 text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RubricInfoModal;
