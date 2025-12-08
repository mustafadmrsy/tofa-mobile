import * as authService from '@/services/authService';
import { User, UserRole } from '@/types';
import { User as FirebaseUser } from 'firebase/auth';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, name: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    signIn: async () => { },
    signUp: async () => { },
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Firebase auth state listener
        let unsubscribeFirestore: (() => void) | null = null;

        const unsubscribeAuth = authService.onAuthChange(async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                // Get initial user data
                const userData = await authService.getCurrentUser(firebaseUser);
                setUser(userData);

                // Subscribe to Firestore updates for this user
                const { onSnapshot, doc } = await import('firebase/firestore');
                const { db } = await import('@/config/firebaseConfig');

                unsubscribeFirestore = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setUser({
                            id: docSnap.id,
                            email: data.email,
                            name: data.name,
                            role: data.role,
                            teamId: data.teamId || null,
                            createdAt: data.createdAt.toDate(),
                        });
                    }
                });
            } else {
                if (unsubscribeFirestore) {
                    unsubscribeFirestore();
                    unsubscribeFirestore = null;
                }
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeFirestore) {
                unsubscribeFirestore();
            }
        };
    }, []);

    const signIn = async (email: string, password: string) => {
        try {
            const userData = await authService.signIn(email, password);
            setUser(userData);
        } catch (error: any) {
            throw error;
        }
    };

    const signUp = async (email: string, password: string, name: string) => {
        try {
            const userData = await authService.signUp(email, password, name, UserRole.USER);
            setUser(userData);
        } catch (error: any) {
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await authService.signOut();
            setUser(null);
        } catch (error: any) {
            throw error;
        }
    };

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
