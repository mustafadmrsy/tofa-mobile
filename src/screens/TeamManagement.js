import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TextInput, Portal, Modal, Button } from "react-native-paper";
import { UserPlus, User2 } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { listLeaderTeams, addTeamMember, removeTeamMember, listAllTeams, listUserTeams } from "../services/teams";
import { listUsers } from "../services/users";
import { listUserTasks, listTeamTasks, listAllTasks } from "../services/tasks";

export default function TeamManagement({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [teamTasks, setTeamTasks] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addTab, setAddTab] = useState('out');
  const [memberDetail, setMemberDetail] = useState(null);
  const [memberTasks, setMemberTasks] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const userMap = useMemo(()=>{ const m={}; allUsers.forEach(u=>m[u.id]=u.name||u.email||u.uid); return m; }, [allUsers]);
  const teamMap = useMemo(()=>{ const m={}; allTeams.forEach(t=>m[t.id]=t.name); return m; }, [allTeams]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let tms = await listLeaderTeams(user.uid);
      if (!tms || tms.length === 0) {
        // Lider değilse, üye olduğu ilk takımı göster
        try {
          tms = await listUserTeams(user.uid);
        } catch {}
      }
      if (!tms || tms.length === 0) {
        // Son çare: tüm takımları tarayıp leaderId/memberIds içinde ara
        try {
          const all = await listAllTeams();
          tms = all.filter(t => t.leaderId === user.uid || (t.memberIds || []).includes(user.uid));
        } catch {}
      }
      const currentTeam = tms?.[0] || null;
      setTeam(currentTeam);
      const us = await listUsers();
      setAllUsers(us);
      const tAll = await listAllTeams();
      setAllTeams(tAll);

      if (currentTeam?.id) {
        try {
          // Takım görevlerini hem teamId hem de assigneeId (takım üyeleri) üzerinden hesapla
          const memberIdsSet = new Set([currentTeam.leaderId, ...(currentTeam.memberIds || [])].filter(Boolean));
          let ts = [];
          try {
            const allTasks = await listAllTasks();
            ts = allTasks.filter(t => {
              const inTeam = t.teamId === currentTeam.id;
              const byMember = t.assigneeId && memberIdsSet.has(t.assigneeId);
              return inTeam || byMember;
            });
          } catch {
            try {
              ts = await listTeamTasks(currentTeam.id);
            } catch {
              ts = [];
            }
          }
          setTeamTasks(ts || []);
        } catch {
          setTeamTasks([]);
        }
      } else {
        setTeamTasks([]);
      }
    } finally { setLoading(false); }
  };

  useEffect(()=>{ load(); }, [user?.uid]);

  const memberIdsOrdered = useMemo(()=>{
    if (!team) return [];
    const ids = Array.from(new Set([team.leaderId, ...(team.memberIds||[])]).values()).filter(Boolean);
    return ids;
  }, [team]);

  const filteredMembers = useMemo(()=>{
    const ids = memberIdsOrdered;
    const items = ids.map(id => {
      const u = allUsers.find(x => x.id === id) || null;
      const role = u?.role || 'worker';
      const verified = u?.verified === 1;
      return {
        id,
        name: userMap[id] || id,
        isLeader: id === team?.leaderId,
        role,
        verified,
      };
    });
    return items.filter(m => {
      if (!m.name.toLowerCase().includes(query.toLowerCase())) return false;
      if (roleFilter !== 'all' && (m.role || 'worker') !== roleFilter) return false;
      return true;
    });
  }, [memberIdsOrdered, allUsers, userMap, query, team, roleFilter]);

  const openAddMember = () => setAddOpen(true);
  const doAddMember = async (uid) => {
    if (!team) return;
    try {
      setError(""); setSuccess("");
      await addTeamMember(team.id, uid);
      setSuccess("Üye eklendi");
      setAddOpen(false);
      await load();
    } catch (e) { setError(e.message); }
  };
  const doRemoveMember = async (uid) => {
    if (!team || uid===team.leaderId) return; // lideri burada çıkarmıyoruz
    try {
      setError(""); setSuccess("");
      await removeTeamMember(team.id, uid);
      setSuccess("Üye çıkarıldı");
      await load();
    } catch (e) { setError(e.message); }
  };

  const openMemberDetail = async (uid) => {
    setMemberDetail({ id: uid, name: userMap[uid] || uid });
    setMemberTasks([]);
    try {
      let ts = [];
      try {
        ts = await listUserTasks(uid);
      } catch (e) {
        ts = [];
      }
      if ((!ts || ts.length === 0) && team?.id) {
        try {
          const teamTs = await listTeamTasks(team.id);
          ts = teamTs.filter(t => t.assigneeId === uid);
        } catch {}
      }
      const sorted = (ts||[]).sort((a,b)=>{
        const da = a.createdAt?.seconds ? a.createdAt.seconds*1000 : (a.createdAt||0);
        const db = b.createdAt?.seconds ? b.createdAt.seconds*1000 : (b.createdAt||0);
        return db - da;
      });
      setMemberTasks(sorted);
    } catch {}
  };

  const totalMembers = memberIdsOrdered.length;
  const activeTasksCount = useMemo(() => {
    return (teamTasks || []).filter(t => (t.status || '').toLowerCase() !== 'done').length;
  }, [teamTasks]);

  const activeMembersCount = useMemo(() => {
    const s = new Set();
    (teamTasks || []).forEach(t => {
      if ((t.status || '').toLowerCase() !== 'done' && t.assigneeId) {
        s.add(t.assigneeId);
      }
    });
    return s.size;
  }, [teamTasks]);

  const totalTasksCount = (teamTasks || []).length;

  const recentAssignments = useMemo(() => {
    const sorted = [...(teamTasks || [])].sort((a, b) => {
      const da = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt || 0);
      const db = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt || 0);
      return db - da;
    });
    return sorted.slice(0, 5);
  }, [teamTasks]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, paddingBottom: 40 }}>
      {/* Başlık ve takım kartı */}
      <LinearGradient
        colors={["#3b0764", "#0b0d16"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "#4c1d95", marginBottom: 16 }}
      >
        <View>
          <Text style={{ color: '#e5e7eb', fontSize: 18, fontWeight: '800' }}>Ekibim</Text>
          <Text style={{ color: '#c4b5fd', marginTop: 6 }}>
            {team ? `${team.name} - Lider: ${userMap[team.leaderId] || team.leaderId || '-'}` : 'Takım bulunamadı'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <View style={{ flex: 1, borderRadius: 16, padding: 10, backgroundColor: 'rgba(15,23,42,0.9)', borderWidth: 1, borderColor: '#6366f1' }}>
            <Text style={{ color: '#9ca3af', fontSize: 12 }}>Total Members</Text>
            <Text style={{ color: '#e5e7eb', fontSize: 20, fontWeight: '900', marginTop: 4 }}>{totalMembers}</Text>
          </View>
          <View style={{ flex: 1, borderRadius: 16, padding: 10, backgroundColor: 'rgba(6,78,59,0.9)', borderWidth: 1, borderColor: '#22c55e' }}>
            <Text style={{ color: '#bbf7d0', fontSize: 12 }}>Active Members</Text>
            <Text style={{ color: '#bbf7d0', fontSize: 20, fontWeight: '900', marginTop: 4 }}>{activeMembersCount}</Text>
          </View>
          <View style={{ flex: 1, borderRadius: 16, padding: 10, backgroundColor: 'rgba(127,29,29,0.85)', borderWidth: 1, borderColor: '#f97373' }}>
            <Text style={{ color: '#fecaca', fontSize: 12 }}>Total Tasks</Text>
            <Text style={{ color: '#fecaca', fontSize: 20, fontWeight: '900', marginTop: 4 }}>{totalTasksCount}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <Pressable
            onPress={openAddMember}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 999, backgroundColor: '#ec4899' }}
          >
            <UserPlus color="#f9fafb" size={18} />
            <Text style={{ color: '#f9fafb', fontWeight: '700' }}>Üye Ekle</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation && navigation.navigate ? navigation.navigate('Görev Oluştur') : null}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 999, backgroundColor: '#22c55e' }}
          >
            <Text style={{ color: '#0f172a', fontWeight: '700' }}>Yeni Görev</Text>
          </Pressable>
        </View>
      </LinearGradient>

      {/* Arama */}
      <TextInput
        mode="outlined"
        placeholder="Üye ara"
        value={query}
        onChangeText={setQuery}
        left={<TextInput.Icon icon={() => <User2 color="#9aa0a6" size={18} />} />}
        style={{ backgroundColor: 'transparent', borderRadius: 14, marginBottom: 14 }}
        outlineColor={'#2a2e3f'}
        activeOutlineColor={'#8b5cf6'}
        textColor={'#e6e6e6'}
        placeholderTextColor={'#6b7280'}
      />

      {/* Rol filtreleri */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        {[
          { k: 'all', label: 'Tümü' },
          { k: 'admin', label: 'Admin' },
          { k: 'leader', label: 'Lider' },
          { k: 'worker', label: 'Worker' },
        ].map(btn => (
          <Pressable
            key={btn.k}
            onPress={() => setRoleFilter(btn.k)}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 999,
              backgroundColor: roleFilter === btn.k ? '#111827' : 'transparent',
              borderWidth: 1,
              borderColor: roleFilter === btn.k ? '#6366f1' : '#1f2937'
            }}
          >
            <Text style={{ color: '#e5e7eb', fontSize: 12, fontWeight: '600' }}>{btn.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Üye listesi */}
      <View style={{ marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ color: '#e5e7eb', fontWeight: '700' }}>Team Members</Text>
        </View>
        {filteredMembers.map(m => {
          const initials = (m.name||'').split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase();
          const memberTasks = (teamTasks || []).filter(t => t.assigneeId === m.id);
          const activeCount = memberTasks.filter(t => (t.status || '').toLowerCase() !== 'done').length;
          const recent = memberTasks.slice().sort((a,b)=>{
            const da = a.createdAt?.seconds ? a.createdAt.seconds*1000 : (a.createdAt||0);
            const db = b.createdAt?.seconds ? b.createdAt.seconds*1000 : (b.createdAt||0);
            return db - da;
          })[0];
          const roleLabel = m.role === 'admin' ? 'Admin' : m.isLeader ? 'Leader' : (m.role || 'Worker');
          const roleColor = m.role === 'admin' ? '#6366f1' : m.isLeader ? '#22c55e' : '#0ea5e9';
          const statusLabel = m.verified ? 'Active' : 'Offline';
          const statusColor = m.verified ? '#22c55e' : '#9ca3af';
          return (
            <View key={m.id} style={{ padding: 14, borderRadius: 18, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1f2937', marginBottom: 12, shadowColor: '#8b5cf6', shadowOpacity: 0.2, shadowRadius: 14 }}>
              <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
                <View style={{ flexDirection:'row', alignItems:'center' }}>
                  <View style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#6366f1' }}>
                    <Text style={{ color: '#e5e7eb', fontWeight: '800', fontSize: 16 }}>{initials || 'U'}</Text>
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={{ color: '#e5e7eb', fontWeight: '800' }}>{m.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(15,23,42,0.9)', borderWidth: 1, borderColor: roleColor }}>
                        <Text style={{ color: roleColor, fontSize: 11, fontWeight: '700' }}>{roleLabel}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: statusColor }} />
                        <Text style={{ color: statusColor, fontSize: 11 }}>{statusLabel}</Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={{ flexDirection:'row', gap: 8 }}>
                  <TouchableOpacity onPress={()=>openMemberDetail(m.id)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#4b5563' }}>
                    <Text style={{ color: '#e5e7eb', fontSize: 12 }}>Detay</Text>
                  </TouchableOpacity>
                  {!m.isLeader && (
                    <TouchableOpacity onPress={()=>doRemoveMember(m.id)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#ef4444' }}>
                      <Text style={{ color: '#fca5a5', fontSize: 12 }}>Çıkar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ color: '#9ca3af', fontSize: 12 }}>Atanmış Görev</Text>
                  <Text style={{ color: '#f9fafb', fontWeight: '700', marginTop: 2 }}>{activeCount} aktif</Text>
                </View>
                {recent && (
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={{ color: '#9ca3af', fontSize: 12 }}>Son Görev</Text>
                    <Text numberOfLines={1} style={{ color: '#e5e7eb', marginTop: 2 }}>{recent.title}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
        {(!loading && filteredMembers.length===0) && (
          <Text style={{ color: colors.textSecondary }}>Üye bulunamadı</Text>
        )}
      </View>

      {/* Recent Task Assignments */}
      <View>
        <Text style={{ color: '#e5e7eb', fontWeight: '700', marginBottom: 8 }}>Recent Task Assignments</Text>
        {(recentAssignments || []).map(t => (
          <View key={t.id} style={{ padding: 14, borderRadius: 18, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1f2937', marginBottom: 10 }}>
            <Text style={{ color: '#e5e7eb', fontWeight: '800' }}>{t.title}</Text>
            {!!t.description && <Text style={{ color: '#9ca3af', marginTop: 4 }} numberOfLines={2}>{t.description}</Text>}
            <View style={{ flexDirection: 'row', marginTop: 8, justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: '#9ca3af', fontSize: 12 }}>Status</Text>
                <Text style={{ color: '#e5e7eb', marginTop: 2 }}>{t.status}</Text>
              </View>
              <View>
                <Text style={{ color: '#9ca3af', fontSize: 12 }}>Due</Text>
                <Text style={{ color: '#e5e7eb', marginTop: 2 }}>
                  {t.dueDate ? new Date(t.dueDate.seconds ? t.dueDate.seconds*1000 : t.dueDate).toLocaleDateString() : '-'}
                </Text>
              </View>
            </View>
          </View>
        ))}
        {(!loading && recentAssignments.length === 0) && (
          <Text style={{ color: colors.textSecondary }}>Görev bulunamadı</Text>
        )}
      </View>

      <Portal>
        {/* Üye ekle modal */}
          <Modal visible={addOpen} onDismiss={()=>setAddOpen(false)} contentContainerStyle={{ margin: 16, borderRadius: 16, backgroundColor: '#0b0d16', padding: 16, borderWidth: 1, borderColor: '#8b5cf6' }}>
            <Text style={{ color: '#8b5cf6', fontWeight: '900', fontSize: 16 }}>Üye Ekle</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <Pressable onPress={()=>setAddTab('out')} style={{ flex:1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: addTab==='out' ? '#8b5cf6' : '#2a2e3f', backgroundColor: addTab==='out' ? '#111426' : 'transparent', alignItems:'center' }}>
                <Text style={{ color: '#e6e6e6', fontWeight:'700' }}>Ekipte Olmayanlar</Text>
              </Pressable>
              <Pressable onPress={()=>setAddTab('in')} style={{ flex:1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: addTab==='in' ? '#8b5cf6' : '#2a2e3f', backgroundColor: addTab==='in' ? '#111426' : 'transparent', alignItems:'center' }}>
                <Text style={{ color: '#e6e6e6', fontWeight:'700' }}>Ekiptekiler</Text>
              </Pressable>
            </View>
            <View style={{ maxHeight: 360, marginTop: 10, borderWidth: 1, borderColor: '#1f2233', borderRadius: 12 }}>
              <ScrollView>
                {(addTab==='out' ? allUsers.filter(u => !(team?.memberIds||[]).includes(u.id) && u.id!==team?.leaderId) : allUsers.filter(u => ((team?.memberIds||[]).includes(u.id) || u.id===team?.leaderId))).map(u => {
                  const alreadyMember = !!team?.memberIds?.includes(u.id) || u.id === team?.leaderId;
                  const displayName = u.name || u.email || u.uid;
                  const teamName = u.teamId ? (teamMap[u.teamId] || u.teamId) : '-';
                  const role = u.role || 'worker';
                  return (
                    <TouchableOpacity
                      key={u.id}
                      disabled={alreadyMember}
                      onPress={()=>doAddMember(u.id)}
                      style={{
                        marginHorizontal: 10,
                        marginVertical: 8,
                        padding: 12,
                        borderRadius: 14,
                        backgroundColor: '#0b0d16',
                        borderWidth: 1,
                        borderColor: alreadyMember ? '#253045' : '#2a2e3f',
                        shadowColor: '#8b5cf6',
                        shadowOpacity: 0.15,
                        shadowRadius: 8,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#111426', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#8b5cf6' }}>
                            <Text style={{ color: '#8b5cf6', fontWeight: '800' }}>{(displayName||'U').toString().trim().slice(0,1).toUpperCase()}</Text>
                          </View>
                          <View style={{ marginLeft: 10 }}>
                            <Text style={{ color: '#e6e6e6', fontWeight: '700' }}>{displayName}</Text>
                            <View style={{ flexDirection:'row', marginTop: 6 }}>
                              <Text style={{ color: '#a78bfa', fontSize: 12, backgroundColor: '#1a1530', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginRight: 8 }}>Rol: {role}</Text>
                              <Text style={{ color: '#67e8f9', fontSize: 12, backgroundColor: '#0c2b33', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>Takım: {teamName}</Text>
                            </View>
                          </View>
                        </View>
                        {alreadyMember ? (
                          <Text style={{ color: '#22d3ee', fontWeight: '700' }}>Zaten ekipte</Text>
                        ) : (
                          <Text style={{ color: '#8b5cf6', fontWeight: '700' }}>Ekle</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {allUsers.length===0 && <Text style={{ color: '#9aa0a6', padding: 12 }}>Kullanıcı bulunamadı</Text>}
              </ScrollView>
            </View>
            <View style={{ flexDirection:'row', justifyContent:'flex-end', marginTop: 12 }}>
              <Button mode="text" onPress={()=>setAddOpen(false)}>Kapat</Button>
            </View>
          </Modal>

        {/* Üye detay modal */}
        <Modal visible={!!memberDetail} onDismiss={()=>setMemberDetail(null)} contentContainerStyle={{ margin: 16, borderRadius: 16, backgroundColor: '#0b0d16', padding: 16, borderWidth: 1, borderColor: '#8b5cf6' }}>
          {!!memberDetail && (
            <View>
              <Text style={{ color: '#8b5cf6', fontWeight: '900', fontSize: 16 }}>{memberDetail.name}</Text>
              <Text style={{ color: colors.textSecondary, marginTop: 6 }}>Atandığı Son Görevler</Text>
              <View style={{ maxHeight: 260, marginTop: 6 }}>
                <ScrollView>
                  {memberTasks.map(t => (
                    <View key={t.id} style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#1f2233' }}>
                      <Text style={{ color: '#22d3ee', fontWeight: '700' }}>{t.title}</Text>
                      {!!t.status && <Text style={{ color: colors.textSecondary, marginTop: 2 }}>Durum: {t.status}</Text>}
                      <Text style={{ color: colors.textSecondary, marginTop: 2 }}>Tarih: {t.dueDate ? new Date(t.dueDate.seconds ? t.dueDate.seconds*1000 : t.dueDate).toLocaleDateString() : '-'}</Text>
                    </View>
                  ))}
                  {memberTasks.length===0 && <Text style={{ color: colors.textSecondary, padding: 10 }}>Görev bulunamadı</Text>}
                </ScrollView>
              </View>
              <View style={{ flexDirection:'row', justifyContent:'flex-end', marginTop: 12 }}>
                <Button mode="text" onPress={()=>setMemberDetail(null)}>Kapat</Button>
              </View>
            </View>
          )}
        </Modal>
      </Portal>
    </ScrollView>
  );
}
