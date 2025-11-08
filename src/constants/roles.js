export const ROLES = Object.freeze({
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  LEADER: "leader",
  WORKER: "worker",
});

export const isSuperAdmin = (role) => role === ROLES.SUPERADMIN;
export const isAdmin = (role) => role === ROLES.ADMIN || role === ROLES.SUPERADMIN;
export const isLeader = (role) => role === ROLES.LEADER;
export const isWorker = (role) => role === ROLES.WORKER;

export const canManageAll = (role) => isSuperAdmin(role) || isAdmin(role);
export const canManageTeam = (role) => isLeader(role) || canManageAll(role);
