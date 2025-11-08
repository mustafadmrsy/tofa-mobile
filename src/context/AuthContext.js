import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "../api/firebaseConfig";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // "worker" | "admin" | "superadmin"
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (isDemo) {
      // Demo modunda Firebase dinleyicisini çalıştırma
      setLoading(false);
      return;
    }
    if (!isFirebaseConfigured || !auth || !db) {
      setUser(null);
      setRole(null);
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          setUser(fbUser);
          const userRef = doc(db, "users", fbUser.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data();
            setRole(data.role || "worker");
          } else {
            setRole("worker");
          }
        } else {
          setUser(null);
          setRole(null);
        }
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [isDemo]);

  const login = (email, password) => {
    if (!isFirebaseConfigured || !auth) throw new Error("Auth devre dışı: Firebase yapılandırmasını ekleyin.");
    return signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (name, email, password, role = "worker", teamId = null) => {
    if (!isFirebaseConfigured || !auth || !db) throw new Error("Kayıt devre dışı: Firebase yapılandırmasını ekleyin.");
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(cred.user, { displayName: name });
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      name: name || email,
      role,
      teamId: teamId || null,
    });
    return cred.user;
  };

  const logout = () => {
    setIsDemo(false);
    if (!isFirebaseConfigured || !auth) {
      setUser(null);
      setRole(null);
      return Promise.resolve();
    }
    return signOut(auth);
  };

  const resetPassword = async (email) => {
    if (!isFirebaseConfigured || !auth) throw new Error("Şifre sıfırlama devre dışı: Firebase yapılandırmasını ekleyin.");
    return sendPasswordResetEmail(auth, email);
  };

  const demoLogin = async (demoRole = "worker") => {
    setIsDemo(true);
    setUser({ uid: "demo-user", displayName: demoRole === "admin" ? "Admin" : "Worker" });
    setRole(demoRole);
    setLoading(false);
  };

  const value = useMemo(() => ({ user, role, loading, login, register, logout, resetPassword, demoLogin }), [user, role, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
