
import { RubricItem } from './types';

export const BEST_PRESENTER_RUBRIC: RubricItem[] = [
  {
    id: 'preparedness',
    name: 'Preparedness',
    weight: 40,
    description: 'Student is completely prepared and uses language easy to understand.',
    levels: [
      { points: '35-40', description: 'Excellent: Fully prepared, exceptionally clear.', score: 40 },
      { points: '30-34', description: 'Very Good: Well-prepared, very clear.', score: 34 },
      { points: '25-29', description: 'Good: Prepared, mostly clear.', score: 29 },
      { points: '20-24', description: 'Fair: Somewhat prepared, needs more clarity.', score: 24 },
      { points: '<20', description: 'Poor: Unprepared and unclear.', score: 19 },
    ]
  },
  {
    id: 'speaks_clearly',
    name: 'Speaks Clearly',
    weight: 30,
    description: 'Speaks clearly and distinctly all the time and mispronounces no words.',
     levels: [
      { points: '26-30', description: 'Excellent: Flawless pronunciation and clarity.', score: 30 },
      { points: '21-25', description: 'Very Good: Clear speech with minor mispronunciations.', score: 25 },
      { points: '16-20', description: 'Good: Generally clear but some words are unclear.', score: 20 },
      { points: '11-15', description: 'Fair: Often mumbles or mispronounces words.', score: 15 },
      { points: '<11', description: 'Poor: Speech is very difficult to understand.', score: 10 },
    ]
  },
  {
    id: 'audience_rapport',
    name: 'Audience Rapport',
    weight: 20,
    description: 'Looks relaxed and confident. Establishes rapport with the audience during demonstration.',
     levels: [
      { points: '18-20', description: 'Excellent: Strong connection with audience, very confident.', score: 20 },
      { points: '15-17', description: 'Very Good: Good rapport, confident.', score: 17 },
      { points: '12-14', description: 'Good: Makes some connection, appears somewhat confident.', score: 14 },
      { points: '9-11', description: 'Fair: Little connection, appears nervous.', score: 11 },
      { points: '<9', description: 'Poor: No rapport, very nervous.', score: 8 },
    ]
  },
  {
    id: 'stays_on_topic',
    name: 'Stays on Topic',
    weight: 10,
    description: 'Stays on topic all of the time.',
     levels: [
      { points: '9-10', description: 'Excellent: Always focused on the topic.', score: 10 },
      { points: '7-8', description: 'Very Good: Mostly stays on topic.', score: 8 },
      { points: '5-6', description: 'Good: Some deviation from the topic.', score: 6 },
      { points: '3-4', description: 'Fair: Often strays from the topic.', score: 4 },
      { points: '<3', description: 'Poor: Does not address the topic.', score: 2 },
    ]
  },
];

export const BEST_THESIS_RUBRIC: RubricItem[] = [
  {
    id: 'organization',
    name: 'Organization',
    weight: 35,
    description: 'Information is very organized with well-constructed paragraphs and discussions.',
    levels: [
      { points: '30-35', description: 'Excellent: Superbly organized, flows logically.', score: 35 },
      { points: '25-29', description: 'Very Good: Well-organized, easy to follow.', score: 29 },
      { points: '20-24', description: 'Good: Organized, but could be clearer.', score: 24 },
      { points: '15-19', description: 'Fair: Some organization is apparent, but confusing.', score: 19 },
      { points: '<15', description: 'Poor: Disorganized and hard to follow.', score: 14 },
    ]
  },
  {
    id: 'quality_of_info',
    name: 'Quality of Information',
    weight: 30,
    description: 'Information clearly relates to the main topic. It includes several supporting details and/or examples.',
    levels: [
      { points: '26-30', description: 'Excellent: Information is rich, detailed, and highly relevant.', score: 30 },
      { points: '21-25', description: 'Very Good: Information is relevant with good supporting details.', score: 25 },
      { points: '16-20', description: 'Good: Information is relevant but lacks detail.', score: 20 },
      { points: '11-15', description: 'Fair: Information is somewhat relevant, but superficial.', score: 15 },
      { points: '<11', description: 'Poor: Information is irrelevant or inaccurate.', score: 10 },
    ]
  },
  {
    id: 'diagrams',
    name: 'Diagrams & Illustration',
    weight: 20,
    description: 'Diagrams and illustrations are neat, accurate and add to the reader\'s understanding of the topic.',
     levels: [
      { points: '18-20', description: 'Excellent: Illustrations greatly enhance understanding.', score: 20 },
      { points: '15-17', description: 'Very Good: Illustrations are accurate and helpful.', score: 17 },
      { points: '12-14', description: 'Good: Illustrations are present and mostly accurate.', score: 14 },
      { points: '9-11', description: 'Fair: Illustrations are present but not clear or helpful.', score: 11 },
      { points: '<9', description: 'Poor: Illustrations are missing or inaccurate.', score: 8 },
    ]
  },
  {
    id: 'analysis',
    name: 'Analysis',
    weight: 15,
    description: 'The relationship between the variables is discussed and trends/patterns logically analyzed. Predictions are made.',
     levels: [
      { points: '13-15', description: 'Excellent: Insightful analysis and logical predictions.', score: 15 },
      { points: '10-12', description: 'Very Good: Good analysis of trends.', score: 12 },
      { points: '7-9', description: 'Good: Basic analysis is present.', score: 9 },
      { points: '4-6', description: 'Fair: Analysis is weak or flawed.', score: 6 },
      { points: '<4', description: 'Poor: No analysis is present.', score: 3 },
    ]
  },
];
