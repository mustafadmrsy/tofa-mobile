import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../theme/colors";
import { PlusCircle, Users } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { listLeaderTeams, listUserTeams, listAllTeams } from "../../services/teams";
import { listTasksByTeamIds, listAllTasks } from "../../services/tasks";
import { listUsers } from "../../services/users";

export default function AdminDashboard({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [warnDays, setWarnDays] = useState(7);

  const userMap = useMemo(() => { const m={}; users.forEach(u=>m[u.id]=u.name||u.email||u.uid); return m; }, [users]);

  // Basit neon kart bileşeni
  const NeonCard = ({ children, border = "#8b5cf6", bg = "#0b0d16" }) => (
    <View style={{ backgroundColor: bg, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: border, shadowColor: border, shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } }}>
      {children}
    </View>
  );

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let tms = await listLeaderTeams(user.uid);
      if (!tms || tms.length === 0) {
        // Fallback: kullanıcı bir takımda üye olabilir
        try {
          tms = await listUserTeams(user.uid);
        } catch {}
      }
      if (!tms || tms.length === 0) {
        // Son çare: tüm takımları çekip leaderId/memberIds içinde arama
        try {
          const all = await listAllTeams();
          tms = all.filter(t => t.leaderId === user.uid || (t.memberIds || []).includes(user.uid));
        } catch {}
      }
      setTeams(tms);
      const us = await listUsers();
      setUsers(us);

      // Takım görevlerini hem teamId hem de assigneeId (takım üyeleri) üzerinden topla
      const teamIds = (tms || []).map(t=>t.id);
      const memberIdSet = new Set();
      (tms || []).forEach(t => {
        if (t.leaderId) memberIdSet.add(t.leaderId);
        (t.memberIds || []).forEach(id => memberIdSet.add(id));
      });

      let ts = [];
      try {
        const allTasks = await listAllTasks();
        ts = allTasks.filter(task => {
          const inTeam = task.teamId && teamIds.includes(task.teamId);
          const byMember = task.assigneeId && memberIdSet.has(task.assigneeId);
          return inTeam || byMember;
        });
      } catch {
        // Fallback: eski davranışa dön, sadece teamId üzerinden çek
        if (teamIds.length > 0) {
          ts = await listTasksByTeamIds(teamIds);
        }
      }
      setTasks(ts);
    } finally { setLoading(false); }
  };

  useEffect(()=>{ load(); }, [user?.uid]);

  const stats = useMemo(()=>{
    const total = tasks.length;
    const active = tasks.filter(t=>t.status!=="done").length;
    const done = tasks.filter(t=>t.status==="done").length;
    return { total, active, done };
  }, [tasks]);

  const recentTasks = useMemo(()=>{
    const sorted = [...tasks].sort((a,b)=>{
      const da = a.createdAt?.seconds ? a.createdAt.seconds*1000 : (a.createdAt||0);
      const db = b.createdAt?.seconds ? b.createdAt.seconds*1000 : (b.createdAt||0);
      return db - da;
    });
    return sorted.slice(0, 10);
  }, [tasks]);

  const overdueAndUpcoming = useMemo(()=>{
    const now = Date.now();
    const endUpcoming = now + warnDays*24*60*60*1000;
    const toMs = (d)=> d ? (d.seconds ? d.seconds*1000 : d) : null;
    const isDone = (t)=> (t.status||'').toLowerCase()==='done';
    const overdue = tasks.filter(t=>{
      const due = toMs(t.dueDate);
      return !isDone(t) && due != null && due < now;
    }).sort((a,b)=> (toMs(a.dueDate)||0) - (toMs(b.dueDate)||0));
    const upcoming = tasks.filter(t=>{
      const due = toMs(t.dueDate);
      return !isDone(t) && due != null && due >= now && due <= endUpcoming;
    }).sort((a,b)=> (toMs(a.dueDate)||0) - (toMs(b.dueDate)||0));
    return { overdue, upcoming };
  }, [tasks, warnDays]);

  const overdueCount = overdueAndUpcoming.overdue.length;

  // Ekip durumu için: mevcut takımdaki üyeleri bul ve aktif görev sayılarını hesapla
  const primaryTeam = teams[0] || null;
  const teamMemberIds = primaryTeam ? Array.from(new Set([primaryTeam.leaderId, ...(primaryTeam.memberIds || [])].filter(Boolean))) : [];
  const teamMembers = teamMemberIds.map(id => ({ id, name: userMap[id] || id }));
  const memberSummaries = teamMembers.map(m => {
    const assigned = tasks.filter(t => t.assigneeId === m.id);
    const active = assigned.filter(t => (t.status || '').toLowerCase() !== 'done').length;
    return { ...m, active };
  }).sort((a,b) => b.active - a.active).slice(0, 4);

  const formatDueDiff = (task) => {
    if (!task.dueDate) return null;
    const dueMs = task.dueDate.seconds ? task.dueDate.seconds*1000 : task.dueDate;
    const diffDays = Math.round((dueMs - Date.now()) / (24*60*60*1000));
    if (isNaN(diffDays)) return null;
    if (diffDays === 0) return 'Son: bugün';
    if (diffDays > 0) return `Son: ${diffDays} gün`;
    return `Son: ${Math.abs(diffDays)} gün önce`;
  };

  const getPriorityLabel = (t) => (t.priority || '').toLowerCase();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, paddingBottom: 40 }}>
      {/* Başlık banner */}
      <LinearGradient
        colors={["#18122b", "#240046"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "#312e81", marginBottom: 16 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: '#f9fafb', fontSize: 22, fontWeight: '900' }}>{user?.displayName || user?.email || 'Admin'}</Text>
            <Text style={{ color: '#c4b5fd', marginTop: 4 }}>Ekip Yönetimi</Text>
          </View>
          {/* Profil avatar placeholder */}
          <View style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#6366f1' }}>
            <Text style={{ color: '#e5e7eb', fontWeight: '800' }}>{(user?.displayName || user?.email || 'A').charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <View style={{ flex: 1, borderRadius: 16, padding: 12, backgroundColor: 'rgba(15,23,42,0.85)', borderWidth: 1, borderColor: '#22c55e' }}>
            <Text style={{ color: '#9ca3af', fontSize: 12 }}>Aktif</Text>
            <Text style={{ color: '#bbf7d0', fontSize: 22, fontWeight: '900', marginTop: 4 }}>{stats.active}</Text>
          </View>
          <View style={{ flex: 1, borderRadius: 16, padding: 12, backgroundColor: 'rgba(24,16,32,0.95)', borderWidth: 1, borderColor: '#f97373' }}>
            <Text style={{ color: '#fecaca', fontSize: 12 }}>Gecikmiş</Text>
            <Text style={{ color: '#fecaca', fontSize: 22, fontWeight: '900', marginTop: 4 }}>{overdueCount}</Text>
          </View>
          <View style={{ flex: 1, borderRadius: 16, padding: 12, backgroundColor: 'rgba(15,23,42,0.85)', borderWidth: 1, borderColor: '#4ade80' }}>
            <Text style={{ color: '#bbf7d0', fontSize: 12 }}>Tamamlanan</Text>
            <Text style={{ color: '#bbf7d0', fontSize: 22, fontWeight: '900', marginTop: 4 }}>{stats.done}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Son Görevler */}
      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ color: '#e5e7eb', fontWeight: '700' }}>Son Görevler</Text>
          <Text style={{ color: '#a855f7', fontSize: 12 }}>Tümünü Gör</Text>
        </View>
        <NeonCard border="#272448" bg="#0f172a">
          <View style={{ gap: 10 }}>
            {recentTasks.slice(0, 3).map(item => {
              const assigneeName = item.assigneeId ? (userMap[item.assigneeId] || item.assigneeId) : '-';
              const dueText = formatDueDiff(item);
              const priority = getPriorityLabel(item);
              const priorityColor = priority === 'high' ? '#f97373' : priority === 'low' ? '#4ade80' : '#facc15';
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.92}
                  onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
                  style={{ padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#1f2937', backgroundColor: '#020617' }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#e5e7eb', fontWeight: '800' }}>{item.title}</Text>
                      <Text style={{ color: '#9ca3af', marginTop: 2, fontSize: 12 }}>{assigneeName}’a atandı</Text>
                    </View>
                    {/* Durum ikonu yerine renkli nokta */}
                    <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: (item.status || '').toLowerCase() === 'done' ? '#22c55e' : '#f97316' }} />
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    {!!priority && (
                      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(15,23,42,0.9)', borderWidth: 1, borderColor: priorityColor }}>
                        <Text style={{ color: priorityColor, fontSize: 11, fontWeight: '700' }}>{priority === 'high' ? 'Yüksek' : priority === 'low' ? 'Düşük' : 'Orta'}</Text>
                      </View>
                    )}
                    {!!dueText && (
                      <Text style={{ color: '#9ca3af', fontSize: 11 }}>{dueText}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
            {(!loading && recentTasks.length === 0) && (
              <Text style={{ color: '#9aa0a6' }}>Görev bulunamadı</Text>
            )}
          </View>
        </NeonCard>
      </View>

      {/* Ekip Durumu */}
      <View style={{ marginBottom: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ color: '#e5e7eb', fontWeight: '700' }}>Ekip Durumu</Text>
          <Text style={{ color: '#a855f7', fontSize: 12 }}>Detay</Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {memberSummaries.map(m => {
            const initials = (m.name || '').split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase() || 'U';
            return (
              <View key={m.id} style={{ width: '48%', borderRadius: 16, padding: 10, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1f2937' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#6366f1' }}>
                    <Text style={{ color: '#e5e7eb', fontWeight: '800', fontSize: 13 }}>{initials}</Text>
                  </View>
                  <View>
                    <Text style={{ color: '#e5e7eb', fontSize: 13, fontWeight: '700' }}>{m.name}</Text>
                    <Text style={{ color: '#9ca3af', fontSize: 11 }}>{m.active} aktif görev</Text>
                  </View>
                </View>
              </View>
            );
          })}
          {(!loading && memberSummaries.length === 0) && (
            <Text style={{ color: '#9aa0a6' }}>Bu ekip için üye bulunamadı.</Text>
          )}
        </View>
      </View>

      {/* Hızlı İşlemler */}
      <View>
        <Text style={{ color: '#e5e7eb', fontWeight: '700', marginBottom: 8 }}>Hızlı İşlemler</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <LinearGradient colors={["#f973c6", "#fb7185"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, borderRadius: 18 }}>
            <Pressable
              onPress={() => navigation.navigate('Görev Oluştur')}
              style={{ flex: 1, borderRadius: 18, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' }}
            >
              <PlusCircle color="#f9fafb" />
              <Text style={{ color: '#f9fafb', marginTop: 6, fontWeight: '700' }}>Yeni Görev</Text>
            </Pressable>
          </LinearGradient>
          <LinearGradient colors={["#22c1c3", "#0ea5e9"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, borderRadius: 18 }}>
            <Pressable
              onPress={() => navigation.navigate('Ekibim')}
              style={{ flex: 1, borderRadius: 18, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' }}
            >
              <Users color="#0f172a" />
              <Text style={{ color: '#0f172a', marginTop: 6, fontWeight: '700' }}>Ekip Ekranı</Text>
            </Pressable>
          </LinearGradient>
        </View>
      </View>
    </ScrollView>
  );
}
