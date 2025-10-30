import { User, UserRole, StudentGroup, GradingStatus, PanelGrade } from '../types';
// This file simulates a backend API. In a real app, these functions would make HTTP requests.

let mockUsers: User[] = [
  { id: 'user-1', name: 'User Admin', email: 'admin@example.com', role: UserRole.ADMIN, password: '123' },
];

let mockGroups: StudentGroup[] = [];

const simulateDelay = <T,>(data: T): Promise<T> => 
  new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(data))), 500));


// User API
export const getUsers = () => simulateDelay(mockUsers.map(({ password, ...user }) => user));
export const updateUser = (user: User) => {
    const index = mockUsers.findIndex(u => u.id === user.id);
    if (index !== -1) {
        mockUsers[index] = { ...mockUsers[index], ...user };
        return simulateDelay({ ...mockUsers[index] });
    }
    return Promise.reject("User not found");
};
export const createUser = (user: Omit<User, 'id'>) => {
    const newUser = { ...user, id: `user-${Date.now()}`};
    mockUsers.push(newUser);
    return simulateDelay(newUser);
};
export const bulkCreateUsers = (usersToCreate: Omit<User, 'id'>[]) => {
    let addedCount = 0;
    let skippedCount = 0;
    const newUsers = [];
    usersToCreate.forEach(user => {
        const isDuplicate = mockUsers.some(u => u.name.toLowerCase() === user.name.toLowerCase() || u.email.toLowerCase() === user.email.toLowerCase());
        if (!isDuplicate && user.name) {
            const newUser = { ...user, id: `user-${Date.now()}-${addedCount}` };
            mockUsers.push(newUser);
            newUsers.push(newUser);
            addedCount++;
        } else {
            skippedCount++;
        }
    });
    return simulateDelay({ addedCount, skippedCount, newUsers });
};
export const bulkUpdateUserEmails = (updates: { name: string, email: string }[]) => {
    let updatedCount = 0;
    let notFoundCount = 0;
    updates.forEach(update => {
        const userIndex = mockUsers.findIndex(u => u.name.trim().toLowerCase() === update.name.trim().toLowerCase());
        if (userIndex !== -1) {
            mockUsers[userIndex].email = update.email;
            updatedCount++;
        } else {
            notFoundCount++;
        }
    });
    return simulateDelay({ updatedCount, notFoundCount });
};
export const deleteUser = (userId: string) => {
    mockUsers = mockUsers.filter(u => u.id !== userId);
    return simulateDelay({ success: true });
};


// Group API
export const getGroups = () => simulateDelay(mockGroups);
export const getGroupById = (id: string) => simulateDelay(mockGroups.find(g => g.id === id));
export const updateGroup = (group: StudentGroup) => {
    const index = mockGroups.findIndex(g => g.id === group.id);
    if (index !== -1) {
        mockGroups[index] = { ...mockGroups[index], ...group };
        return simulateDelay({ ...mockGroups[index] });
    }
    return Promise.reject("Group not found");
};
export const createGroup = (group: Omit<StudentGroup, 'id' | 'status' | 'grades'>) => {
    const newGroup = { ...group, id: `group-${Date.now()}`, status: GradingStatus.NOT_STARTED, grades: [] };
    mockGroups.push(newGroup);
    return simulateDelay(newGroup);
};
export const bulkCreateGroups = (groupsToCreate: { name: string, projectTitle?: string }[]) => {
    let addedCount = 0;
    let skippedCount = 0;
    const newGroups = [];
    groupsToCreate.forEach(group => {
        const isDuplicate = mockGroups.some(g => g.name.toLowerCase() === group.name.toLowerCase());
        if (!isDuplicate && group.name) {
            const newGroup: StudentGroup = { 
                name: group.name,
                id: `group-${Date.now()}-${addedCount}`, 
                status: GradingStatus.NOT_STARTED, 
                grades: [],
                projectTitle: group.projectTitle || 'TBA',
                members: []
            };
            mockGroups.push(newGroup);
            newGroups.push(newGroup);
            addedCount++;
        } else {
            skippedCount++;
        }
    });
    return simulateDelay({ addedCount, skippedCount, newGroups });
};
export const deleteGroup = (groupId: string) => {
    mockGroups = mockGroups.filter(g => g.id !== groupId);
    return simulateDelay({ success: true });
};
export const deleteAllGroups = () => {
    mockGroups = [];
    return simulateDelay({ success: true });
};

// Grading API
export const submitGrade = async (groupId: string, panelistId: string, presenterScores: any, thesisScores: any) => {
  const group = await getGroupById(groupId);
  if (!group) throw new Error("Group not found");

  const gradeIndex = group.grades.findIndex(g => g.panelistId === panelistId);
  if (gradeIndex === -1) {
    // If panelist was added but doesn't have a grade object yet
    const panelistIds = [group.panel1Id, group.panel2Id, group.externalPanelId].filter(Boolean);
    if (panelistIds.includes(panelistId)) {
        group.grades.push({ panelistId, presenterScores: {}, thesisScores: {}, submitted: false });
    } else {
        throw new Error("Panelist not assigned to this group");
    }
  }
  
  const newGradeIndex = group.grades.findIndex(g => g.panelistId === panelistId);
  group.grades[newGradeIndex] = {
      ...group.grades[newGradeIndex],
      presenterScores,
      thesisScores,
      submitted: true,
  };

  const panelistIds = [group.panel1Id, group.panel2Id, group.externalPanelId].filter(Boolean);
  const submittedPanelists = new Set(group.grades.filter(g => g.submitted).map(g => g.panelistId));
  const allSubmitted = panelistIds.every(id => submittedPanelists.has(id));

  if (allSubmitted) {
      group.status = GradingStatus.COMPLETED;
  } else if (group.grades.some(g => g.submitted)) {
      group.status = GradingStatus.IN_PROGRESS;
  }
  
  await updateGroup(group);
  return simulateDelay(group);
};

// System API
export const backupSystem = () => {
    const data = {
        users: mockUsers,
        groups: mockGroups,
    };
    return simulateDelay(data);
};

export const restoreSystem = (data: { users: User[], groups: StudentGroup[] }) => {
    mockUsers = data.users;
    mockGroups = data.groups;
    return simulateDelay({ success: true });
};


export { mockUsers, mockGroups };