import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGroupById, submitGrade } from '../services/api';
import { StudentGroup, RubricScore, RubricItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { BEST_PRESENTER_RUBRIC, BEST_THESIS_RUBRIC } from '../constants';
import { useNotifications } from '../contexts/NotificationContext';
import Rubric from '../components/grading/Rubric';

const GradingSheetPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const [group, setGroup] = useState<StudentGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [presenterScores, setPresenterScores] = useState<RubricScore>({});
  const [thesisScores, setThesisScores] = useState<RubricScore>({});
  
  useEffect(() => {
    const fetchGroup = async () => {
      if (!groupId) return;
      setLoading(true);
      try {
        const groupData = await getGroupById(groupId);
        setGroup(groupData || null);
        
        if (groupData && user) {
            const myGrade = groupData.grades.find(g => g.panelistId === user.id);
            if (myGrade) {
                setPresenterScores(myGrade.presenterScores);
                setThesisScores(myGrade.thesisScores);
            }
        }

      } catch (error) {
        console.error("Failed to fetch group:", error);
        addNotification("Failed to load grading sheet.");
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [groupId, user, navigate, addNotification]);

  const allPresenterScoresSet = BEST_PRESENTER_RUBRIC.every(item => presenterScores[item.id] !== undefined && presenterScores[item.id] !== null);
  const allThesisScoresSet = BEST_THESIS_RUBRIC.every(item => thesisScores[item.id] !== undefined && thesisScores[item.id] !== null);
  const isFormComplete = allPresenterScoresSet && allThesisScoresSet;

  const handleSubmit = async () => {
    if (!group || !user || !isFormComplete) return;
    
    try {
      await submitGrade(group.id, user.id, presenterScores, thesisScores);
      addNotification(`You have successfully submitted grades for ${group.name}.`);
      navigate('/');
    } catch (error) {
      console.error("Failed to submit grades:", error);
      addNotification(`Error submitting grades for ${group.name}.`);
    }
  };

  if (loading) return <p>Loading grading sheet...</p>;
  if (!group) return <p>Group not found.</p>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Grading Sheet</h1>
      <div className="mt-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold">{group.name}</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">{group.projectTitle}</p>
        {group.members && group.members.length > 0 && 
            <p className="mt-2"><strong>Members:</strong> {group.members.join(', ')}</p>
        }
      </div>

      <div className="mt-8">
        <Rubric 
          title="Best Presenter Rubric"
          rubricItems={BEST_PRESENTER_RUBRIC}
          scores={presenterScores}
          onScoreChange={setPresenterScores}
        />
      </div>

      <div className="mt-8">
        <Rubric
          title="Best Thesis Rubric"
          rubricItems={BEST_THESIS_RUBRIC}
          scores={thesisScores}
          onScoreChange={setThesisScores}
        />
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!isFormComplete}
          className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          Submit Grades
        </button>
      </div>
    </div>
  );
};

export default GradingSheetPage;
