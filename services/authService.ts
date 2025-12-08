import { auth, db } from '@/config/firebaseConfig';
import { User, UserDoc, UserRole } from '@/types';
import {
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    User as FirebaseUser,
    onAuthStateChanged,
    signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

/**
 * Firebase hata kodlarını Türkçe mes ajlara çevir
 */
const getErrorMessage = (error: any): string => {
    const errorCode = error.code;

    switch (errorCode) {
        case 'auth/invalid-email':
            return 'Geçersiz e-posta adresi';
        case 'auth/user-disabled':
            return 'Bu hesap devre dışı bırakılmış';
        case 'auth/user-not-found':
            return 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı';
        case 'auth/wrong-password':
            return 'Hatalı şifre';
        case 'auth/email-already-in-use':
            return 'Bu e-posta adresi zaten kullanımda';
        case 'auth/weak-password':
            return 'Şifre çok zayıf, en az 6 karakter olmalı';
        case 'auth/invalid-credential':
            return 'E-posta veya şifre hatalı';
        case 'auth/too-many-requests':
            return 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin';
        case 'auth/network-request-failed':
            return 'Bağlantı hatası. İnternet bağlantınızı kontrol edin';
        default:
            return error.message || 'Bir hata oluştu';
    }
};

/**
 * Yeni kullanıcı kaydı
 */
export const signUp = async (
    email: string,
    password: string,
    name: string,
    role: UserRole = UserRole.USER
): Promise<User> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Firestore'da kullanıcı profili oluştur
        const userDoc: UserDoc = {
            email: firebaseUser.email!,
            name,
            role,
            createdAt: Timestamp.now(),
        };

        await setDoc(doc(db, 'users', firebaseUser.uid), userDoc);

        return {
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            name,
            role,
            createdAt: new Date(),
        };
    } catch (error: any) {
        throw new Error(getErrorMessage(error));
    }
};

/**
 * Email ve şifre ile giriş
 */
export const signIn = async (email: string, password: string): Promise<User> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Kullanıcı profilini Firestore'dan al
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            throw new Error('Kullanıcı profili bulunamadı');
        }

        const userData = userDocSnap.data() as UserDoc;

        return {
            id: firebaseUser.uid,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            teamId: userData.teamId,
            createdAt: userData.createdAt.toDate(),
        };
    } catch (error: any) {
        throw new Error(getErrorMessage(error));
    }
};

/**
 * Çıkış
 */
export const signOut = async (): Promise<void> => {
    try {
        await firebaseSignOut(auth);
    } catch (error: any) {
        throw new Error(getErrorMessage(error));
    }
};

/**
 * Mevcut kullanıcıyı getir
 */
export const getCurrentUser = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            return null;
        }

        const userData = userDocSnap.data() as UserDoc;

        return {
            id: firebaseUser.uid,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            teamId: userData.teamId,
            createdAt: userData.createdAt.toDate(),
        };
    } catch (error: any) {
        console.error('Get current user error:', error);
        return null;
    }
};

/**
 * Auth state değişikliklerini dinle
 */
export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
};
