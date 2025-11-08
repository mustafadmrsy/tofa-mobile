import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../theme/colors";
import { PlusCircle, Users } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { listLeaderTeams } from "../../services/teams";
import { listTasksByTeamIds } from "../../services/tasks";
import { listUsers } from "../../services/users";
import { listUserTeams } from "../../services/teams";

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
        tms = await listUserTeams(user.uid);
      }
      setTeams(tms);
      const us = await listUsers();
      setUsers(us);
      const teamIds = tms.map(t=>t.id);
      const ts = await listTasksByTeamIds(teamIds);
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

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, paddingBottom: 40 }}>
      {/* Başlık banner */}
      <View style={{ marginBottom: 16 }}>
        <LinearGradient colors={["#14122b", "#0b0d16"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#1f2233" }}>
          <Text style={{ color: "#b39bff", fontSize: 12, letterSpacing: 1 }}>PANEL</Text>
          <Text style={{ color: "#e6e6e6", fontSize: 24, fontWeight: "900", marginTop: 6 }}>Lider Dashboard</Text>
          <Text style={{ color: "#9aa0a6", marginTop: 4 }}>Ekibinin görevlerini yönet</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap:'wrap' }}>
            <View style={{ borderRadius: 999, borderWidth: 1, borderColor: "#2a2e3f", paddingVertical: 6, paddingHorizontal: 10 }}>
              <Text style={{ color: "#a78bfa", fontWeight: '700' }}>Takım: {teams[0]?.name || '-'}</Text>
            </View>
            <View style={{ borderRadius: 999, borderWidth: 1, borderColor: "#2a2e3f", paddingVertical: 6, paddingHorizontal: 10 }}>
              <Text style={{ color: "#67e8f9", fontWeight: '700' }}>Üye: {teams[0]?.memberIds?.length || 0}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* İstatistik kutuları */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
        <NeonCard border="#8b5cf6">
          <Text style={{ color: "#9aa0a6" }}>Toplam Görev</Text>
          <Text style={{ color: "#22d3ee", fontSize: 22, fontWeight: "900", marginTop: 6 }}>{stats.total}</Text>
        </NeonCard>
        <NeonCard border="#2a2e3f">
          <Text style={{ color: "#9aa0a6" }}>Aktif</Text>
          <Text style={{ color: "#e6e6e6", fontSize: 22, fontWeight: "900", marginTop: 6 }}>{stats.active}</Text>
        </NeonCard>
        <NeonCard border="#2a2e3f">
          <Text style={{ color: "#9aa0a6" }}>Tamamlandı</Text>
          <Text style={{ color: "#22c55e", fontSize: 22, fontWeight: "900", marginTop: 6 }}>{stats.done}</Text>
        </NeonCard>
      </View>

      {/* Hızlı aksiyonlar */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
        <LinearGradient colors={["#1a1530", "#0b0d16"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, borderRadius: 14 }}>
          <Pressable onPress={() => navigation.navigate("Görev Oluştur")} style={{ flex: 1, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#2a2e3f", alignItems: "center", justifyContent: "center" }}>
            <PlusCircle color="#e6e6e6" />
            <Text style={{ color: "#e6e6e6", marginTop: 8, fontWeight: "600" }}>Görev Oluştur</Text>
          </Pressable>
        </LinearGradient>
        <LinearGradient colors={["#0c2b33", "#0b0d16"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, borderRadius: 14 }}>
          <Pressable onPress={() => navigation.navigate("Ekibim")} style={{ flex: 1, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#2a2e3f", alignItems: "center", justifyContent: "center" }}>
            <Users color="#e6e6e6" />
            <Text style={{ color: "#e6e6e6", marginTop: 8, fontWeight: "600" }}>Ekibi Yönet</Text>
          </Pressable>
        </LinearGradient>
      </View>

      {/* Görev Listesi */}
      <Text style={{ color: "#9aa0a6", marginBottom: 8 }}>Son Görevler</Text>
      <NeonCard border="#1f2233">
        <View style={{ gap: 12 }}>
          {recentTasks.map(item => (
          <TouchableOpacity key={item.id} activeOpacity={0.92} onPress={()=>navigation.navigate('TaskDetail', { taskId: item.id })} style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#2a2e3f", backgroundColor: "#0d0f1a" }}>
            <Text style={{ color: "#22d3ee", fontWeight: "800" }}>{item.title}</Text>
            {!!item.description && <Text style={{ color: "#9aa0a6", marginTop: 4 }}>{item.description}</Text>}
            <View style={{ flexDirection: 'row', gap: 10, flexWrap:'wrap', marginTop: 8 }}>
              <Text style={{ color: '#9aa0a6' }}>Atanan: <Text style={{ color: '#e6e6e6' }}>{item.assigneeId ? (userMap[item.assigneeId] || item.assigneeId) : '-'}</Text></Text>
              <Text style={{ color: '#9aa0a6' }}>Durum: <Text style={{ color: '#e6e6e6' }}>{item.status}</Text></Text>
              <Text style={{ color: '#9aa0a6' }}>Tarih: <Text style={{ color: '#e6e6e6' }}>{item.dueDate ? new Date(item.dueDate.seconds ? item.dueDate.seconds*1000 : item.dueDate).toLocaleDateString() : '-'}</Text></Text>
            </View>
          </TouchableOpacity>
        ))}
        {(!loading && recentTasks.length===0) && <Text style={{ color: '#9aa0a6' }}>Görev bulunamadı</Text>}
        </View>
      </NeonCard>

      {/* Uyarı eşiği ayarı */}
      <View style={{ marginTop: 20, marginBottom: 8 }}>
        <Text style={{ color: '#9aa0a6', marginBottom: 8 }}>Uyarı Eşiği (Yaklaşan): {warnDays} gün</Text>
        <View style={{ flexDirection:'row', gap: 8 }}>
          {[3,7,14].map(d => (
            <Pressable key={d} onPress={()=>setWarnDays(d)} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: warnDays===d ? '#8b5cf6' : '#2a2e3f', backgroundColor: warnDays===d ? '#111426' : 'transparent' }}>
              <Text style={{ color: '#e6e6e6', fontWeight:'600' }}>{d}g</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Tarihi Geçmiş */}
      <Text style={{ color: '#f87171', marginTop: 12, marginBottom: 8, fontWeight:'700' }}>Tarihi Geçmiş</Text>
      <NeonCard border="#3b1f22" bg="#120b0d">
        <View style={{ gap: 10 }}>
        {overdueAndUpcoming.overdue.map(item => (
          <TouchableOpacity key={item.id} activeOpacity={0.92} onPress={()=>navigation.navigate('TaskDetail', { taskId: item.id })} style={{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#3b1f22', backgroundColor: '#170e10' }}>
            <Text style={{ color: '#fca5a5', fontWeight:'800' }}>{item.title}</Text>
            <Text style={{ color: '#9aa0a6', marginTop: 4 }}>Atanan: <Text style={{ color:'#e6e6e6' }}>{item.assigneeId ? (userMap[item.assigneeId] || item.assigneeId) : '-'}</Text></Text>
            <Text style={{ color: '#9aa0a6' }}>Son Tarih: <Text style={{ color:'#e6e6e6' }}>{item.dueDate ? new Date(item.dueDate.seconds ? item.dueDate.seconds*1000 : item.dueDate).toLocaleDateString() : '-'}</Text></Text>
          </TouchableOpacity>
        ))}
        {(!loading && overdueAndUpcoming.overdue.length===0) && <Text style={{ color:'#9aa0a6' }}>Tarihi geçmiş görev yok</Text>}
        </View>
      </NeonCard>

      {/* Yaklaşan */}
      <Text style={{ color: '#fde68a', marginTop: 16, marginBottom: 8, fontWeight:'700' }}>Yaklaşan</Text>
      <NeonCard border="#3b3321" bg="#14120c">
        <View style={{ gap: 10, marginBottom: 4 }}>
        {overdueAndUpcoming.upcoming.map(item => (
          <TouchableOpacity key={item.id} activeOpacity={0.92} onPress={()=>navigation.navigate('TaskDetail', { taskId: item.id })} style={{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#3b3321', backgroundColor: '#14120c' }}>
            <Text style={{ color: '#fde68a', fontWeight:'800' }}>{item.title}</Text>
            <Text style={{ color: '#9aa0a6', marginTop: 4 }}>Atanan: <Text style={{ color:'#e6e6e6' }}>{item.assigneeId ? (userMap[item.assigneeId] || item.assigneeId) : '-'}</Text></Text>
            <Text style={{ color: '#9aa0a6' }}>Son Tarih: <Text style={{ color:'#e6e6e6' }}>{item.dueDate ? new Date(item.dueDate.seconds ? item.dueDate.seconds*1000 : item.dueDate).toLocaleDateString() : '-'}</Text></Text>
          </TouchableOpacity>
        ))}
        {(!loading && overdueAndUpcoming.upcoming.length===0) && <Text style={{ color:'#9aa0a6' }}>Yaklaşan görev yok</Text>}
        </View>
      </NeonCard>
    </ScrollView>
  );
}
