import { collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import dbDefault, { db } from "../api/firebaseConfig";

const DB = db || dbDefault; // güvenlik için fallback

const TEAMS = "teams";

export const createTeam = async (teamId, { name, leaderId, memberIds = [] }) => {
  const ref = doc(DB, TEAMS, teamId);
  await setDoc(ref, {
    name,
    leaderId,
    memberIds,
    createdAt: serverTimestamp(),
  });
  return (await getDoc(ref)).data();
};

export const listAllTeams = async () => {
  const s = await getDocs(collection(DB, TEAMS));
  return s.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const createTeamAutoId = async ({ name, leaderId = null, memberIds = [] }) => {
  const id = doc(collection(DB, TEAMS)).id;
  await createTeam(id, { name, leaderId, memberIds });
  const snap = await getDoc(doc(DB, TEAMS, id));
  return { id, ...snap.data() };
};

export const addTeamMember = async (teamId, userId) => {
  const ref = doc(DB, TEAMS, teamId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Team not found");
  const data = snap.data();
  const memberIds = Array.from(new Set([...(data.memberIds || []), userId]));
  await updateDoc(ref, { memberIds });
  return memberIds;
};

export const removeTeamMember = async (teamId, userId) => {
  const ref = doc(DB, TEAMS, teamId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Team not found");
  const data = snap.data();
  const memberIds = (data.memberIds || []).filter((id) => id !== userId);
  await updateDoc(ref, { memberIds });
  return memberIds;
};

export const getTeam = async (teamId) => {
  const ref = doc(DB, TEAMS, teamId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: teamId, ...snap.data() } : null;
};

export const listLeaderTeams = async (leaderId) => {
  const q = query(collection(DB, TEAMS), where("leaderId", "==", leaderId));
  const s = await getDocs(q);
  return s.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const listUserTeams = async (userId) => {
  const q = query(collection(DB, TEAMS), where("memberIds", "array-contains", userId));
  const s = await getDocs(q);
  return s.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const setTeamLeader = async (teamId, leaderId) => {
  const ref = doc(DB, TEAMS, teamId);
  await updateDoc(ref, { leaderId });
};
