import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, sendPasswordResetEmail, sendEmailVerification } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "../api/firebaseConfig";
import { SUPERADMIN_EMAIL } from "../constants/bootstrap";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // "worker" | "admin" | "superadmin"
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (isDemo) {
      // Demo modunda Firebase dinleyicisini çalıştırma
      setLoading(false);
      return;
    }
    if (!isFirebaseConfigured || !auth || !db) {
      setUser(null);
      setRole(null);
      setVerified(false);
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          try { await fbUser.reload(); } catch {}
          try { await fbUser.getIdToken(true); } catch {}
          const userRef = doc(db, "users", fbUser.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data();
            const isSuper = fbUser.email && fbUser.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase();
            // Firebase emailVerified true ise (veya superadmin ise) navigasyona izin ver
            const vFlag = isSuper || !!fbUser.emailVerified || data.verified === 1;
            setVerified(vFlag);
            if (vFlag) {
              setUser(fbUser);
              setRole(data.role || (isSuper ? "superadmin" : "worker"));
            } else {
              // Doğrulanmamışsa ana akışa yönlenmesin
              setUser(null);
              setRole(null);
            }
            if ((fbUser.emailVerified || isSuper) && data.verified !== 1) {
              try {
                await updateDoc(userRef, { verified: 1, verifiedAt: serverTimestamp() });
              } catch (e) {
                try {
                  await setDoc(userRef, { verified: 1, verifiedAt: serverTimestamp() }, { merge: true });
                } catch (e2) {
                  console.warn('[Auth] setDoc merge verified->1 failed:', e2?.code || e2?.message || e2);
                }
              }
            }
          } else {
            // Kullanıcı belgesi yoksa, doğrulama akışı tamamlanana kadar navigasyonu engelle
            const isSuper = fbUser.email && fbUser.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase();
            setVerified(isSuper || !!fbUser.emailVerified);
            if (isSuper || !!fbUser.emailVerified) {
              // Doc yoksa oluştur ve verified=1 olarak işaretle
              try {
                await setDoc(userRef, {
                  uid: fbUser.uid,
                  name: fbUser.displayName || fbUser.email,
                  role: (fbUser.email && fbUser.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()) ? "superadmin" : "worker",
                  teamId: null,
                  verified: 1,
                  createdAt: serverTimestamp(),
                  verifiedAt: serverTimestamp(),
                }, { merge: true });
              } catch (e) { console.warn('[Auth] setDoc create verified user failed:', e?.code || e?.message || e); }
              setUser(fbUser);
              setRole((fbUser.email && fbUser.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()) ? "superadmin" : "worker");
            } else {
              setUser(null);
              setRole(null);
            }
          }
        } else {
          setUser(null);
          setRole(null);
          setVerified(false);
        }
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [isDemo]);

  const login = async (email, password) => {
    if (!isFirebaseConfigured || !auth || !db) throw new Error("Auth devre dışı: Firebase yapılandırmasını ekleyin.");
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const fbUser = cred.user;
    try { await fbUser.reload(); } catch {}
    const userRef = doc(db, "users", fbUser.uid);
    const snap = await getDoc(userRef);
    const isSuper = fbUser.email && fbUser.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase();
    let verifiedFlag = isSuper || (snap.exists() ? snap.data().verified === 1 : false);
    if ((fbUser.emailVerified || isSuper) && !verifiedFlag) {
      try {
        await updateDoc(userRef, { verified: 1, verifiedAt: serverTimestamp() });
        verifiedFlag = true;
      } catch (e) {
        try {
          await setDoc(userRef, { verified: 1, verifiedAt: serverTimestamp() }, { merge: true });
          verifiedFlag = true;
        } catch {}
      }
    }
    // Firebase'de emailVerified true ise girişe izin ver, users.verified henüz 1 değilse arkada güncellemeyi dene
    if (!fbUser.emailVerified && !isSuper) {
      await signOut(auth);
      throw new Error("E-posta doğrulanmadı. Lütfen e-postadaki bağlantıyı onaylayın.");
    }
    return cred;
  };

  const register = async (name, email, password) => {
    if (!isFirebaseConfigured || !auth || !db) throw new Error("Kayıt devre dışı: Firebase yapılandırmasını ekleyin.");
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(cred.user, { displayName: name });
    const assignedRole = (email && email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()) ? "superadmin" : "worker";
    const forceVerified = assignedRole === "superadmin";
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      name: name || email,
      role: assignedRole,
      teamId: null,
      verified: forceVerified ? 1 : 0,
      createdAt: serverTimestamp(),
    });
    if (!forceVerified) {
      try { await sendEmailVerification(cred.user); } catch (e) { console.warn('[Auth] sendEmailVerification failed:', e?.code || e?.message || e); }
    }
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
    setVerified(true);
    setLoading(false);
  };

  const resendVerification = async () => {
    if (!auth || !auth.currentUser) throw new Error("Oturum bulunamadı");
    await sendEmailVerification(auth.currentUser);
  };

  const resendVerificationBySignIn = async (email, password) => {
    if (!isFirebaseConfigured || !auth) throw new Error("Firebase yapılandırması eksik");
    const cred = await signInWithEmailAndPassword(auth, email, password);
    try {
      await sendEmailVerification(cred.user);
    } finally {
      await signOut(auth);
    }
  };

  const value = useMemo(() => ({ user, role, verified, loading, login, register, logout, resetPassword, demoLogin, resendVerification, resendVerificationBySignIn }), [user, role, verified, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
