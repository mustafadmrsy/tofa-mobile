import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../theme/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { listUserTasks } from "../../services/tasks";

export default function WorkerDashboard({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [warnDays, setWarnDays] = useState(7);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const ts = await listUserTasks(user.uid);
      setTasks(ts || []);
    } finally { setLoading(false); }
  };

  useEffect(()=>{ load(); }, [user?.uid]);

  const filtered = useMemo(()=>{
    return tasks.filter(t => filter === 'all' ? true : (filter === 'active' ? (t.status || '').toLowerCase() !== 'done' : (t.status || '').toLowerCase() === 'done'));
  }, [tasks, filter]);

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

  const NeonCard = ({ children, border = "#8b5cf6", bg = "#0b0d16" }) => (
    <View style={{ backgroundColor: bg, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: border, shadowColor: border, shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } }}>
      {children}
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, paddingBottom: 40 }}>
      {/* Başlık banner */}
      <View style={{ marginBottom: 12 }}>
        <LinearGradient colors={["#14122b", "#0b0d16"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#1f2233" }}>
          <Text style={{ color: "#b39bff", fontSize: 12, letterSpacing: 1 }}>PANEL</Text>
          <Text style={{ color: "#e6e6e6", fontSize: 24, fontWeight: "900", marginTop: 6 }}>Görevlerim</Text>
          <Text style={{ color: "#9aa0a6", marginTop: 4 }}>Sana atanan görevlerin listesi</Text>
        </LinearGradient>
      </View>

      {/* Filtre butonları */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        {[
          { k: 'all', label: 'Tümü' },
          { k: 'active', label: 'Aktif' },
          { k: 'done', label: 'Bitti' },
        ].map(btn => (
          <Pressable key={btn.k} onPress={() => setFilter(btn.k)} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: filter === btn.k ? '#111426' : 'transparent', borderWidth: 1, borderColor: filter === btn.k ? '#8b5cf6' : '#2a2e3f' }}>
            <Text style={{ color: '#e6e6e6', fontWeight: '600' }}>{btn.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Görev listesi */}
      <NeonCard border="#1f2233">
        <View style={{ gap: 12 }}>
          {filtered.map(t => (
            <Pressable key={t.id} onPress={() => navigation.navigate('TaskDetail', { taskId: t.id })} style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#2a2e3f', backgroundColor: '#0d0f1a' }}>
              <Text style={{ color: '#22d3ee', fontWeight: '800' }}>{t.title}</Text>
              {!!t.description && <Text style={{ color: '#9aa0a6', marginTop: 4 }}>{t.description}</Text>}
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                <Text style={{ color: '#9aa0a6' }}>Durum: <Text style={{ color: '#e6e6e6' }}>{t.status}</Text></Text>
                <Text style={{ color: '#9aa0a6' }}>Son Tarih: <Text style={{ color:'#e6e6e6' }}>{t.dueDate ? new Date(t.dueDate.seconds ? t.dueDate.seconds*1000 : t.dueDate).toLocaleDateString() : '-'}</Text></Text>
              </View>
            </Pressable>
          ))}
          {(!loading && filtered.length===0) && <Text style={{ color:'#9aa0a6' }}>Görev bulunamadı</Text>}
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
            <Pressable key={item.id} onPress={()=>navigation.navigate('TaskDetail', { taskId: item.id })} style={{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#3b1f22', backgroundColor: '#170e10' }}>
              <Text style={{ color: '#fca5a5', fontWeight:'800' }}>{item.title}</Text>
              <Text style={{ color: '#9aa0a6' }}>Son Tarih: <Text style={{ color:'#e6e6e6' }}>{item.dueDate ? new Date(item.dueDate.seconds ? item.dueDate.seconds*1000 : item.dueDate).toLocaleDateString() : '-'}</Text></Text>
            </Pressable>
          ))}
          {(!loading && overdueAndUpcoming.overdue.length===0) && <Text style={{ color:'#9aa0a6' }}>Tarihi geçmiş görev yok</Text>}
        </View>
      </NeonCard>

      {/* Yaklaşan */}
      <Text style={{ color: '#fde68a', marginTop: 16, marginBottom: 8, fontWeight:'700' }}>Yaklaşan</Text>
      <NeonCard border="#3b3321" bg="#14120c">
        <View style={{ gap: 10, marginBottom: 4 }}>
          {overdueAndUpcoming.upcoming.map(item => (
            <Pressable key={item.id} onPress={()=>navigation.navigate('TaskDetail', { taskId: item.id })} style={{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#3b3321', backgroundColor: '#14120c' }}>
              <Text style={{ color: '#fde68a', fontWeight:'800' }}>{item.title}</Text>
              <Text style={{ color: '#9aa0a6' }}>Son Tarih: <Text style={{ color:'#e6e6e6' }}>{item.dueDate ? new Date(item.dueDate.seconds ? item.dueDate.seconds*1000 : item.dueDate).toLocaleDateString() : '-'}</Text></Text>
            </Pressable>
          ))}
          {(!loading && overdueAndUpcoming.upcoming.length===0) && <Text style={{ color:'#9aa0a6' }}>Yaklaşan görev yok</Text>}
        </View>
      </NeonCard>
    </ScrollView>
  );
}
