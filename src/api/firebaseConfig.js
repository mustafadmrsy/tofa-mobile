import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Burayı kendi Firebase projenizin değerleriyle doldurun
const firebaseConfig = {
  apiKey: "AIzaSyAL63xPKcnwrnKUX4fOhDeDzLHCxDLE-Fs",
  authDomain: "tofa-mobile.firebaseapp.com",
  projectId: "tofa-mobile",
  storageBucket: "tofa-mobile.firebasestorage.app",
  messagingSenderId: "723015493589",
  appId: "1:723015493589:web:b222dcec0b31c23b9fbf5c",
  measurementId: "G-K7L9V2TT0F",
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
