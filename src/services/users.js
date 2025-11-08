import { collection, getDocs, doc, updateDoc, query, orderBy } from "firebase/firestore";
import dbDefault, { db } from "../api/firebaseConfig";

const DB = db || dbDefault;

const USERS = "users";

export const listUsers = async () => {
  try {
    const qy = query(collection(DB, USERS), orderBy("createdAt", "desc"));
    const s = await getDocs(qy);
    return s.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    const s = await getDocs(collection(DB, USERS));
    return s.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
};

export const updateUserRole = async (uid, role) => {
  const ref = doc(DB, USERS, uid);
  await updateDoc(ref, { role });
};

export const updateUserTeam = async (uid, teamId) => {
  const ref = doc(DB, USERS, uid);
  await updateDoc(ref, { teamId });
};
