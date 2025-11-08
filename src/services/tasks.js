import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, serverTimestamp } from "firebase/firestore";
import dbDefault, { db } from "../api/firebaseConfig";

const DB = db || dbDefault; // fallback

const TASKS = "tasks";

export const createTask = async (taskId, { title, description = "", assigneeId, teamId, status = "todo", dueDate = null, priority = "medium", creatorId = null }) => {
  const ref = doc(DB, TASKS, taskId);
  await setDoc(ref, {
    title,
    description,
    assigneeId,
    teamId,
    status,
    dueDate,
    priority,
    creatorId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const snap = await getDoc(ref);
  return { id: taskId, ...snap.data() };
};

export const createTaskAutoId = async (payload) => {
  const autoId = doc(collection(DB, TASKS)).id;
  const data = await createTask(autoId, payload);
  return { id: autoId, ...data };
};

export const updateTaskStatus = async (taskId, status) => {
  const ref = doc(DB, TASKS, taskId);
  await updateDoc(ref, { status, updatedAt: serverTimestamp() });
}
;

export const assignTask = async (taskId, assigneeId) => {
  const ref = doc(DB, TASKS, taskId);
  await updateDoc(ref, { assigneeId, updatedAt: serverTimestamp() });
};

export const updateTask = async (taskId, payload) => {
  const ref = doc(DB, TASKS, taskId);
  await updateDoc(ref, { ...payload, updatedAt: serverTimestamp() });
};

export const getTask = async (taskId) => {
  const ref = doc(DB, TASKS, taskId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: taskId, ...snap.data() } : null;
};

export const listTeamTasks = async (teamId) => {
  const q = query(collection(DB, TASKS), where("teamId", "==", teamId));
  const s = await getDocs(q);
  return s.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const listUserTasks = async (userId) => {
  const q = query(collection(DB, TASKS), where("assigneeId", "==", userId));
  const s = await getDocs(q);
  return s.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const listAllTasks = async () => {
  const s = await getDocs(collection(DB, TASKS));
  return s.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const listTasksByTeamIds = async (teamIds = []) => {
  if (!teamIds || teamIds.length === 0) return [];
  // Firestore 'in' supports up to 10 values; batch if needed
  const chunks = [];
  for (let i = 0; i < teamIds.length; i += 10) {
    chunks.push(teamIds.slice(i, i + 10));
  }
  const results = [];
  try {
    for (const part of chunks) {
      const qy = query(collection(DB, TASKS), where("teamId", "in", part));
      const s = await getDocs(qy);
      results.push(...s.docs.map((d) => ({ id: d.id, ...d.data() })));
    }
  } catch (e) {
    // Fallback: query each teamId separately (avoids 'in' index requirement)
    for (const id of teamIds) {
      const qy = query(collection(DB, TASKS), where("teamId", "==", id));
      const s = await getDocs(qy);
      results.push(...s.docs.map((d) => ({ id: d.id, ...d.data() })));
    }
  }
  return results;
};
