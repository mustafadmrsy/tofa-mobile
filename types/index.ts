// TypeScript Type Definitions

export enum UserRole {
    USER = 'user',
    TEAM_MANAGER = 'team_manager',
    SUPER_ADMIN = 'super_admin',
}

export enum TaskStatus {
    TODO = 'todo',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    OVERDUE = 'overdue',
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    teamId?: string;
    createdAt: Date;
    updatedAt?: Date;
}

export interface Team {
    id: string;
    name: string;
    managerId: string;
    memberIds: string[];
    createdAt: Date;
    updatedAt?: Date;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    assignedTo: string; // userId
    assignedBy: string; // userId
    teamId: string;
    status: TaskStatus;
    dueDate: Date;
    createdAt: Date;
    updatedAt: Date;
}

// Firebase document data (without Dates, with Timestamps)
export interface UserDoc {
    email: string;
    name: string;
    role: UserRole;
    teamId?: string;
    createdAt: any; // Firestore Timestamp
    updatedAt?: any;
}

export interface TeamDoc {
    name: string;
    managerId: string;
    memberIds: string[];
    createdAt: any;
    updatedAt?: any;
}

export interface TaskDoc {
    title: string;
    description: string;
    assignedTo: string;
    assignedBy: string;
    teamId: string;
    status: TaskStatus;
    dueDate: any;
    createdAt: any;
    updatedAt: any;
}
