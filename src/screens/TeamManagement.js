import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, TouchableOpacity } from "react-native";
import { colors } from "../theme/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TextInput, Portal, Modal, Button } from "react-native-paper";
import { UserPlus, User2 } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { listLeaderTeams, addTeamMember, removeTeamMember, listAllTeams, listUserTeams } from "../services/teams";
import { listUsers } from "../services/users";
import { listUserTasks, listTeamTasks } from "../services/tasks";

export default function TeamManagement() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addTab, setAddTab] = useState('out');
  const [memberDetail, setMemberDetail] = useState(null);
  const [memberTasks, setMemberTasks] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      setTeam(tms?.[0] || null);
      const us = await listUsers();
      setAllUsers(us);
      const tAll = await listAllTeams();
      setAllTeams(tAll);
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
    const items = ids.map(id => ({ id, name: userMap[id] || id, isLeader: id===team?.leaderId }));
    return items.filter(m => m.name.toLowerCase().includes(query.toLowerCase()));
  }, [memberIdsOrdered, userMap, query, team]);

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

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, paddingBottom: 40 }}>
      {/* Başlık ve CTA */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <View>
          <Text style={{ color: '#8b5cf6', fontSize: 24, fontWeight: '900' }}>Ekibim</Text>
          <Text style={{ color: '#9aa0a6', marginTop: 4 }}>{team ? team.name : 'Takım bulunamadı'}</Text>
        </View>
        <Pressable onPress={openAddMember} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#0d0f1a', borderWidth: 1, borderColor: '#8b5cf6' }}>
          <UserPlus color="#e6e6e6" size={18} />
          <Text style={{ color: '#e6e6e6', fontWeight: '600' }}>Üye Ekle</Text>
        </Pressable>
      </View>

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

      {/* Üye listesi */}
      <View>
        {filteredMembers.map(m => {
          const initials = (m.name||'').split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase();
          return (
            <View key={m.id} style={{ padding: 14, borderRadius: 16, backgroundColor: '#0b0d16', borderWidth: 1, borderColor: '#1f2233', marginBottom: 12, shadowColor: '#8b5cf6', shadowOpacity: 0.2, shadowRadius: 8 }}>
              <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
                <View style={{ flexDirection:'row', alignItems:'center' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#111426', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#8b5cf6' }}>
                    <Text style={{ color: '#8b5cf6', fontWeight: '800' }}>{initials || 'U'}</Text>
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={{ color: '#e6e6e6', fontWeight: '800' }}>{m.name}</Text>
                    <Text style={{ color: '#9aa0a6', fontSize: 12 }}>{m.isLeader ? 'Lider' : 'Üye'}</Text>
                  </View>
                </View>
                <View style={{ flexDirection:'row', gap: 8 }}>
                  <TouchableOpacity onPress={()=>openMemberDetail(m.id)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#2a2e3f' }}>
                    <Text style={{ color: '#e6e6e6' }}>Detay</Text>
                  </TouchableOpacity>
                  {!m.isLeader && (
                    <TouchableOpacity onPress={()=>doRemoveMember(m.id)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#ef4444' }}>
                      <Text style={{ color: '#ef4444' }}>Çıkar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        })}
        {(!loading && filteredMembers.length===0) && (
          <Text style={{ color: colors.textSecondary }}>Üye bulunamadı</Text>
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
