
export enum UserRole {
  ADMIN = 'Admin',
  COURSE_ADVISER = 'Course Adviser',
  PANEL = 'Panel',
  EXTERNAL_PANEL = 'External Panel',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
}

export enum GradingStatus {
  NOT_STARTED = 'Not Started',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
}

export interface RubricScore {
  [criterionId: string]: number;
}

export interface PanelGrade {
  panelistId: string;
  presenterScores: RubricScore;
  thesisScores: RubricScore;
  submitted: boolean;
}

export interface StudentGroup {
  id: string;
  name: string;
  projectTitle: string;
  members: string[];
  panel1Id?: string;
  panel2Id?: string;
  externalPanelId?: string;
  status: GradingStatus;
  grades: PanelGrade[];
}

export interface Notification {
  id: string;
  message: string;
  read: boolean;
  timestamp: Date;
}

export interface RubricItem {
  id: string;
  name: string;
  weight: number;
  description: string;
  levels: { points: string; description: string; score: number }[];
}
