import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Burayı kendi Firebase projenizin değerleriyle doldurun
const firebaseConfig = {
  apiKey: "AIzaSyBl6ndmUBUMckQJPhjYQPsXNf_mxRZeyN8",
  authDomain: "tofa-mobile-1020c.firebaseapp.com",
  projectId: "tofa-mobile-1020c",
  storageBucket: "tofa-mobile-1020c.firebasestorage.app",
  messagingSenderId: "803883848105",
  appId: "1:803883848105:web:f1991737249daf629874b8",
  measurementId: "G-HYEEVR6VCB",
};

const isValid = !!firebaseConfig.apiKey && !!firebaseConfig.appId;

let app = null;
let auth = null;
let db = null;
let storage = null;

if (isValid) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} else {
  console.warn("[Firebase] Yapılandırma eksik. Firebase devre dışı (placeholder). Env değerlerini ekleyin.");
}

export { app as default, auth, db, storage };
export const isFirebaseConfigured = isValid;
