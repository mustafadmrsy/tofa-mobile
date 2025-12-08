import { db } from '@/config/firebaseConfig';
import { Task, TaskDoc, TaskStatus, Team, TeamDoc, User, UserDoc } from '@/types';
import {
    addDoc,
    arrayRemove,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    Timestamp,
    updateDoc,
    where,
} from 'firebase/firestore';

// ============= USER OPERATIONS =============

export const getUserById = async (userId: string): Promise<User | null> => {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) return null;

        const data = userDoc.data() as UserDoc;
        return {
            id: userDoc.id,
            email: data.email,
            name: data.name,
            role: data.role,
            teamId: data.teamId,
            createdAt: data.createdAt.toDate(),
        };
    } catch (error) {
        console.error('Get user error:', error);
        return null;
    }
};

export const getAllUsers = async (): Promise<User[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        return querySnapshot.docs.map((doc) => {
            const data = doc.data() as UserDoc;
            return {
                id: doc.id,
                email: data.email,
                name: data.name,
                role: data.role,
                teamId: data.teamId,
                createdAt: data.createdAt.toDate(),
            };
        });
    } catch (error) {
        console.error('Get all users error:', error);
        return [];
    }
};

export const updateUserRole = async (userId: string, role: string): Promise<void> => {
    try {
        await updateDoc(doc(db, 'users', userId), { role, updatedAt: Timestamp.now() });
    } catch (error) {
        console.error('Update user role error:', error);
        throw error;
    }
};

export const updateUserTeam = async (userId: string, teamId: string | null): Promise<void> => {
    try {
        const updateData: any = { updatedAt: Timestamp.now() };
        if (teamId) {
            updateData.teamId = teamId;
        } else {
            updateData.teamId = null;
        }
        await updateDoc(doc(db, 'users', userId), updateData);
    } catch (error) {
        console.error('Update user team error:', error);
        throw error;
    }
};

export const getUsersByTeam = async (teamId: string): Promise<User[]> => {
    try {
        // Önce ekibi al
        const team = await getTeamById(teamId);
        if (!team || !team.memberIds || team.memberIds.length === 0) {
            return [];
        }

        // Ekipteki her kullanıcıyı memberIds'den al
        const users: User[] = [];
        for (const userId of team.memberIds) {
            const user = await getUserById(userId);
            if (user) {
                users.push(user);
            }
        }

        return users;
    } catch (error) {
        console.error('Get users by team error:', error);
        return [];
    }
};

// ============= TEAM OPERATIONS =============

export const createTeam = async (name: string, managerId: string): Promise<string> => {
    try {
        const teamDoc: TeamDoc = {
            name,
            managerId,
            memberIds: [managerId],
            createdAt: Timestamp.now(),
        };

        const docRef = await addDoc(collection(db, 'teams'), teamDoc);
        await updateUserTeam(managerId, docRef.id);

        return docRef.id;
    } catch (error) {
        console.error('Create team error:', error);
        throw error;
    }
};

export const getTeamById = async (teamId: string): Promise<Team | null> => {
    try {
        const teamDoc = await getDoc(doc(db, 'teams', teamId));
        if (!teamDoc.exists()) return null;

        const data = teamDoc.data() as TeamDoc;
        return {
            id: teamDoc.id,
            name: data.name,
            managerId: data.managerId,
            memberIds: data.memberIds,
            createdAt: data.createdAt.toDate(),
        };
    } catch (error) {
        console.error('Get team error:', error);
        return null;
    }
};

export const getAllTeams = async (): Promise<Team[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, 'teams'));
        return querySnapshot.docs.map((doc) => {
            const data = doc.data() as TeamDoc;
            return {
                id: doc.id,
                name: data.name,
                managerId: data.managerId,
                memberIds: data.memberIds,
                createdAt: data.createdAt.toDate(),
            };
        });
    } catch (error) {
        console.error('Get all teams error:', error);
        return [];
    }
};

export const addTeamMember = async (teamId: string, userId: string): Promise<void> => {
    try {
        // Önce kullanıcıyı ekibe ekle (atomic operation)
        await updateDoc(doc(db, 'teams', teamId), {
            memberIds: arrayUnion(userId),
            updatedAt: Timestamp.now(),
        });

        // Sonra kullanıcının teamId'sini güncelle
        await updateUserTeam(userId, teamId);
    } catch (error) {
        console.error('Add team member error:', error);
        throw error;
    }
};


export const removeTeamMember = async (teamId: string, userId: string): Promise<void> => {
    try {
        // Önce ekipten çıkar (atomic operation)
        await updateDoc(doc(db, 'teams', teamId), {
            memberIds: arrayRemove(userId),
            updatedAt: Timestamp.now(),
        });

        // Sonra kullanıcının teamId'sini temizle
        await updateUserTeam(userId, null);
    } catch (error) {
        console.error('Remove team member error:', error);
        throw error;
    }
};

export const updateTeamManager = async (teamId: string, managerId: string): Promise<void> => {
    try {
        await updateDoc(doc(db, 'teams', teamId), {
            managerId,
            updatedAt: Timestamp.now(),
        });
    } catch (error) {
        console.error('Update team manager error:', error);
        throw error;
    }
};

export const updateTeamName = async (teamId: string, name: string): Promise<void> => {
    try {
        await updateDoc(doc(db, 'teams', teamId), {
            name,
            updatedAt: Timestamp.now(),
        });
    } catch (error) {
        console.error('Update team name error:', error);
        throw error;
    }
};

export const deleteTeam = async (teamId: string): Promise<void> => {
    try {
        // 1. Get team data to find manager
        const team = await getTeamById(teamId);
        if (!team) {
            throw new Error('Team not found');
        }

        // 2. Delete all tasks associated with this team
        const q = query(collection(db, 'tasks'), where('teamId', '==', teamId));
        const tasksSnapshot = await getDocs(q);
        const deleteTaskPromises = tasksSnapshot.docs.map((taskDoc) =>
            deleteDoc(doc(db, 'tasks', taskDoc.id))
        );

        // 3. Update all team members' teamId to null
        const members = await getUsersByTeam(teamId);
        const updateMemberPromises = members.map((member) =>
            updateUserTeam(member.id, null)
        );

        // 4. Update manager's role back to USER
        const updateManagerRole = updateUserRole(team.managerId, 'user');

        // Execute all updates in parallel
        await Promise.all([
            ...deleteTaskPromises,
            ...updateMemberPromises,
            updateManagerRole,
        ]);

        // 5. Finally delete the team
        await deleteDoc(doc(db, 'teams', teamId));
    } catch (error) {
        console.error('Delete team error:', error);
        throw error;
    }
};

// ============= TASK OPERATIONS =============

export const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
        const taskDoc: TaskDoc = {
            title: taskData.title,
            description: taskData.description,
            assignedTo: taskData.assignedTo,
            assignedBy: taskData.assignedBy,
            teamId: taskData.teamId,
            status: taskData.status,
            dueDate: Timestamp.fromDate(taskData.dueDate),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        const docRef = await addDoc(collection(db, 'tasks'), taskDoc);
        return docRef.id;
    } catch (error) {
        console.error('Create task error:', error);
        throw error;
    }
};

export const getTaskById = async (taskId: string): Promise<Task | null> => {
    try {
        const taskDoc = await getDoc(doc(db, 'tasks', taskId));
        if (!taskDoc.exists()) return null;

        const data = taskDoc.data() as TaskDoc;
        return {
            id: taskDoc.id,
            title: data.title,
            description: data.description,
            assignedTo: data.assignedTo,
            assignedBy: data.assignedBy,
            teamId: data.teamId,
            status: data.status,
            dueDate: data.dueDate.toDate(),
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
        };
    } catch (error) {
        console.error('Get task error:', error);
        return null;
    }
};

export const getTasksByUser = async (userId: string): Promise<Task[]> => {
    try {
        const q = query(collection(db, 'tasks'), where('assignedTo', '==', userId));
        const querySnapshot = await getDocs(q);
        const tasks = querySnapshot.docs.map((doc) => {
            const data = doc.data() as TaskDoc;
            return {
                id: doc.id,
                title: data.title,
                description: data.description,
                assignedTo: data.assignedTo,
                assignedBy: data.assignedBy,
                teamId: data.teamId,
                status: data.status,
                dueDate: data.dueDate.toDate(),
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate(),
            };
        });
        return tasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    } catch (error) {
        console.error('Get tasks by user error:', error);
        return [];
    }
};

export const getTasksByTeam = async (teamId: string): Promise<Task[]> => {
    try {
        const q = query(collection(db, 'tasks'), where('teamId', '==', teamId));
        const querySnapshot = await getDocs(q);
        const tasks = querySnapshot.docs.map((doc) => {
            const data = doc.data() as TaskDoc;
            return {
                id: doc.id,
                title: data.title,
                description: data.description,
                assignedTo: data.assignedTo,
                assignedBy: data.assignedBy,
                teamId: data.teamId,
                status: data.status,
                dueDate: data.dueDate.toDate(),
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate(),
            };
        });
        return tasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    } catch (error) {
        console.error('Get tasks by team error:', error);
        return [];
    }
};

export const getAllTasks = async (): Promise<Task[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, 'tasks'));
        const tasks = querySnapshot.docs.map((doc) => {
            const data = doc.data() as TaskDoc;
            return {
                id: doc.id,
                title: data.title,
                description: data.description,
                assignedTo: data.assignedTo,
                assignedBy: data.assignedBy,
                teamId: data.teamId,
                status: data.status,
                dueDate: data.dueDate.toDate(),
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate(),
            };
        });
        return tasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    } catch (error) {
        console.error('Get all tasks error:', error);
        return [];
    }
};

export const updateTaskStatus = async (taskId: string, status: TaskStatus): Promise<void> => {
    try {
        await updateDoc(doc(db, 'tasks', taskId), {
            status,
            updatedAt: Timestamp.now(),
        });
    } catch (error) {
        console.error('Update task status error:', error);
        throw error;
    }
};

export const updateTask = async (
    taskId: string,
    updates: { title?: string; description?: string; dueDate?: Date }
): Promise<void> => {
    try {
        const updateData: any = {
            updatedAt: Timestamp.now(),
        };

        if (updates.title !== undefined) updateData.title = updates.title;
        if (updates.description !== undefined) updateData.description = updates.description;
        if (updates.dueDate !== undefined) updateData.dueDate = Timestamp.fromDate(updates.dueDate);

        await updateDoc(doc(db, 'tasks', taskId), updateData);
    } catch (error) {
        console.error('Update task error:', error);
        throw error;
    }
};

export const deleteTask = async (taskId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, 'tasks', taskId));
    } catch (error) {
        console.error('Delete task error:', error);
        throw error;
    }
};

// ============= REAL-TIME LISTENERS =============

export const subscribeToUserTasks = (
    userId: string,
    callback: (tasks: Task[]) => void
): (() => void) => {
    const q = query(collection(db, 'tasks'), where('assignedTo', '==', userId));

    return onSnapshot(q, (querySnapshot) => {
        const tasks = querySnapshot.docs.map((doc) => {
            const data = doc.data() as TaskDoc;
            return {
                id: doc.id,
                title: data.title,
                description: data.description,
                assignedTo: data.assignedTo,
                assignedBy: data.assignedBy,
                teamId: data.teamId,
                status: data.status,
                dueDate: data.dueDate.toDate(),
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate(),
            };
        });
        const sortedTasks = tasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
        callback(sortedTasks);
    });
};

export const subscribeToTeamTasks = (
    teamId: string,
    callback: (tasks: Task[]) => void
): (() => void) => {
    const q = query(collection(db, 'tasks'), where('teamId', '==', teamId));

    return onSnapshot(q, (querySnapshot) => {
        const tasks = querySnapshot.docs.map((doc) => {
            const data = doc.data() as TaskDoc;
            return {
                id: doc.id,
                title: data.title,
                description: data.description,
                assignedTo: data.assignedTo,
                assignedBy: data.assignedBy,
                teamId: data.teamId,
                status: data.status,
                dueDate: data.dueDate.toDate(),
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate(),
            };
        });
        const sortedTasks = tasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
        callback(sortedTasks);
    });
};
