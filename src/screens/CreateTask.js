import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TextInput, SegmentedButtons, Snackbar, Portal, Modal, Button } from "react-native-paper";
import NeonButton from "../components/NeonButton";
import { createTaskAutoId } from "../services/tasks";
import { listAllTeams, listLeaderTeams } from "../services/teams";
import { listUsers } from "../services/users";
import { useAuth } from "../context/AuthContext";

export default function CreateTask() {
  const insets = useSafeAreaInsets();
  const { user, role } = useAuth();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [teamId, setTeamId] = useState(null);
  const [assigneeId, setAssigneeId] = useState(null);
  const [due, setDue] = useState(""); // YYYY-MM-DD
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dateOpen, setDateOpen] = useState(false);
  const [y, setY] = useState("");
  const [m, setM] = useState("");
  const [d, setD] = useState("");
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);

  const outlineColor = '#2a2e3f';
  const activeOutlineColor = '#8b5cf6';
  const inputStyle = { backgroundColor: 'transparent', borderRadius: 14 };

  const load = async () => {
    setLoading(true);
    try {
      const teamsData = role === 'leader' && user ? await listLeaderTeams(user.uid) : await listAllTeams();
      setTeams(teamsData);
      const allUsers = await listUsers();
      setUsers(allUsers);
      if (role === 'leader' && teamsData?.length) {
        setTeamId(teamsData[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const selectedTeam = useMemo(() => teams.find(t => t.id === teamId) || null, [teams, teamId]);
  const filteredUsers = useMemo(() => {
    if (!selectedTeam) return users;
    const ids = new Set([selectedTeam.leaderId, ...(selectedTeam.memberIds || [])].filter(Boolean));
    const arr = users.filter(u => ids.has(u.id));
    // Lideri üstte göster
    return arr.sort((a,b) => (a.id === selectedTeam.leaderId ? -1 : b.id === selectedTeam.leaderId ? 1 : 0));
  }, [users, selectedTeam]);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(""); setSuccess("");
      if (!title.trim()) throw new Error('Başlık zorunlu');
      if (!teamId) throw new Error('Takım seçin');
      if (!assigneeId) throw new Error('Atanacak kullanıcı seçin');
      let dueDate = null;
      if (due) {
        const d = new Date(due);
        if (isNaN(d.getTime())) throw new Error('Tarih formatı geçersiz (YYYY-MM-DD)');
        dueDate = d;
      }
      await createTaskAutoId({
        title: title.trim(),
        description: desc.trim(),
        assigneeId,
        teamId,
        status: 'todo',
        dueDate,
        priority,
        creatorId: user?.uid || null,
      });
      setSuccess('Görev oluşturuldu');
      setTitle(""); setDesc(""); setAssigneeId(null); setDue(""); setPriority('medium');
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, paddingBottom: 40 }}>
      {/* Header */}
      <LinearGradient
        colors={["#1f1247", "#241b5a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 18, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: '#312e81' }}
      >
        <Text style={{ color: '#e5e7eb', fontSize: 18, fontWeight: '800', textAlign: 'center' }}>Görev Oluştur</Text>
      </LinearGradient>

      {/* Team select (dropdown) */}
      <View style={{ marginBottom: 14 }}>
        <Text style={{ color: '#9aa0a6', marginBottom: 6 }}>Takım</Text>
        <View style={{ borderRadius: 14, borderWidth: 1, borderColor: '#1f2233', backgroundColor: '#020617' }}>
          <Pressable
            onPress={() => setTeamDropdownOpen((o) => !o)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 12 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {selectedTeam?.color && (
                <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: selectedTeam.color }} />
              )}
              <Text style={{ color: '#e5e7eb', fontWeight: '600' }}>
                {selectedTeam ? selectedTeam.name : (!teams || teams.length === 0) ? 'Takım yok' : 'Takım seç'}
              </Text>
            </View>
            <Text style={{ color: '#9ca3af', fontSize: 12 }}>{teamDropdownOpen ? '▲' : '▼'}</Text>
          </Pressable>

          {teamDropdownOpen && (!teams || teams.length === 0) && !loading && (
            <Text style={{ color: colors.textSecondary, padding: 12, borderTopWidth: 1, borderTopColor: '#111827' }}>Takım bulunamadı</Text>
          )}

          {teamDropdownOpen && !!teams && teams.length > 0 && (
            <View style={{ borderTopWidth: 1, borderTopColor: '#111827' }}>
              {teams.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => {
                    setTeamId(item.id);
                    setAssigneeId(null);
                    setTeamDropdownOpen(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    backgroundColor: teamId === item.id ? '#111426' : 'transparent',
                    borderBottomWidth: 1,
                    borderBottomColor: '#111827',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {item.color && (
                      <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: item.color }} />
                    )}
                    <Text style={{ color: '#e5e7eb', fontWeight: '600' }}>{item.name}</Text>
                  </View>
                  {teamId === item.id && (
                    <Text style={{ color: '#22c55e', fontSize: 12, fontWeight: '700' }}>Seçili</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Task title */}
      <View style={{ marginBottom: 14 }}>
        <Text style={{ color: '#9aa0a6', marginBottom: 6 }}>Görev Başlığı</Text>
        <TextInput
          mode="outlined"
          placeholder="Örn. Sunum hazırlığı"
          value={title}
          onChangeText={setTitle}
          style={[inputStyle]}
          outlineColor={outlineColor}
          activeOutlineColor={activeOutlineColor}
          textColor={'#e6e6e6'}
          placeholderTextColor={'#6b7280'}
        />
      </View>

      {/* Description */}
      <View style={{ marginBottom: 14 }}>
        <Text style={{ color: '#9aa0a6', marginBottom: 6 }}>Açıklama</Text>
        <TextInput
          mode="outlined"
          placeholder="Görev detaylarını yazın"
          value={desc}
          onChangeText={setDesc}
          multiline
          numberOfLines={4}
          style={[inputStyle, { minHeight: 100 }]}
          outlineColor={outlineColor}
          activeOutlineColor={activeOutlineColor}
          textColor={'#e6e6e6'}
          placeholderTextColor={'#6b7280'}
        />
      </View>

      {/* Due date */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: '#9aa0a6', marginBottom: 6 }}>Son Tarih</Text>
        <TouchableOpacity
          onPress={() => {
            setDateOpen(true);
            const dt = due ? new Date(due) : new Date();
            setY(String(dt.getFullYear()));
            setM(String(dt.getMonth() + 1).padStart(2, '0'));
            setD(String(dt.getDate()).padStart(2, '0'));
          }}
          style={{
            paddingVertical: 14,
            paddingHorizontal: 12,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: outlineColor,
            backgroundColor: '#020617',
          }}
        >
          <Text style={{ color: due ? '#e6e6e6' : '#6b7280' }}>{due || 'Tarih seç (YYYY-MM-DD)'}</Text>
        </TouchableOpacity>
      </View>

      {/* Priority */}
      <View style={{ marginBottom: 18 }}>
        <Text style={{ color: '#9aa0a6', marginBottom: 8 }}>Öncelik</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            { value: 'low', label: 'Düşük', bg: '#064e3b' },
            { value: 'medium', label: 'Orta', bg: '#78350f' },
            { value: 'high', label: 'Yüksek', bg: '#7f1d1d' },
          ].map(opt => {
            const active = priority === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setPriority(opt.value)}
                style={{
                  flex: 1,
                  borderRadius: 16,
                  paddingVertical: 10,
                  paddingHorizontal: 8,
                  backgroundColor: active ? opt.bg : '#020617',
                  borderWidth: 1,
                  borderColor: active ? '#fbbf24' : '#1f2937',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#f9fafb', fontWeight: '700' }}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Assignee list (dropdown) */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: '#9aa0a6', marginBottom: 6 }}>Atanacak Kişi</Text>
        <View style={{ borderWidth: 1, borderColor: '#1f2233', borderRadius: 14, backgroundColor: '#020617' }}>
          <Pressable
            onPress={() => setAssigneeDropdownOpen(o => !o)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 12 }}
          >
            <Text style={{ color: '#e5e7eb', fontWeight: '600' }}>
              {assigneeId ? (filteredUsers.find(u => u.id === assigneeId)?.name || filteredUsers.find(u => u.id === assigneeId)?.email || 'Seçili kullanıcı') : 'Kişi seç'}
            </Text>
            <Text style={{ color: '#9ca3af', fontSize: 12 }}>{assigneeDropdownOpen ? '▲' : '▼'}</Text>
          </Pressable>

          {assigneeDropdownOpen && (!filteredUsers || filteredUsers.length === 0) && !loading && (
            <Text style={{ color: colors.textSecondary, padding: 12, borderTopWidth: 1, borderTopColor: '#111827' }}>Kullanıcı bulunamadı</Text>
          )}

          {assigneeDropdownOpen && !!filteredUsers && filteredUsers.length > 0 && (
            <View style={{ maxHeight: 220, borderTopWidth: 1, borderTopColor: '#111827' }}>
              <ScrollView>
                {filteredUsers.map((item) => {
                  const display = item.name || item.email || item.uid;
                  const initials = (display || '').split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase();
                  const selected = assigneeId === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => { setAssigneeId(item.id); setAssigneeDropdownOpen(false); }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        backgroundColor: selected ? '#111426' : 'transparent',
                        borderBottomWidth: 1,
                        borderBottomColor: '#111827',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#6366f1' }}>
                          <Text style={{ color: '#e5e7eb', fontWeight: '800', fontSize: 14 }}>{initials || 'U'}</Text>
                        </View>
                        <View style={{ marginLeft: 10 }}>
                          <Text style={{ color: '#e5e7eb', fontWeight: '600' }}>{display}</Text>
                          {!!item.email && <Text style={{ color: '#9ca3af', fontSize: 11 }}>{item.email}</Text>}
                        </View>
                      </View>
                      {selected && (
                        <Text style={{ color: '#22c55e', fontSize: 12, fontWeight: '700' }}>Seçili</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      {/* Bottom actions */}
      <View style={{ marginTop: 8 }}>
        <NeonButton title="Görevi Oluştur" onPress={handleSubmit} loading={submitting} disabled={submitting} style={{ marginBottom: 10 }} />
        <Pressable
          onPress={() => { setTitle(""); setDesc(""); setAssigneeId(null); setDue(""); setPriority('medium'); }}
          style={{ paddingVertical: 12, borderRadius: 999, borderWidth: 1, borderColor: '#b91c1c', alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: '#fca5a5', fontWeight: '700' }}>İptal</Text>
        </Pressable>
      </View>

      <Snackbar visible={!!error} onDismiss={()=>setError("")} duration={4000} style={{ backgroundColor: '#ef4444', marginTop: 12 }}>{error}</Snackbar>
      <Snackbar visible={!!success} onDismiss={()=>setSuccess("")} duration={3000} style={{ backgroundColor: '#22c55e', marginTop: 12 }}>{success}</Snackbar>

      <Portal>
        <Modal visible={dateOpen} onDismiss={()=>setDateOpen(false)} contentContainerStyle={{ margin: 16, borderRadius: 16, backgroundColor: '#0b0d16', padding: 16, borderWidth: 1, borderColor: '#8b5cf6' }}>
          <Text style={{ color: '#8b5cf6', fontWeight: '900', fontSize: 16 }}>Tarih Seç</Text>
          <View style={{ flexDirection:'row', gap: 8, marginTop: 12 }}>
            <TextInput mode="outlined" label="Yıl" value={y} onChangeText={setY} keyboardType="number-pad" style={{ flex:1 }} />
            <TextInput mode="outlined" label="Ay" value={m} onChangeText={setM} keyboardType="number-pad" style={{ width: 90 }} />
            <TextInput mode="outlined" label="Gün" value={d} onChangeText={setD} keyboardType="number-pad" style={{ width: 90 }} />
          </View>
          <View style={{ flexDirection:'row', gap: 10, marginTop: 12 }}>
            <Button mode="outlined" onPress={()=>{ const t=new Date(); setY(String(t.getFullYear())); setM(String(t.getMonth()+1).padStart(2,'0')); setD(String(t.getDate()).padStart(2,'0')); }}>Bugün</Button>
            <Button mode="outlined" onPress={()=>{ const t=new Date(Date.now()+24*60*60*1000); setY(String(t.getFullYear())); setM(String(t.getMonth()+1).padStart(2,'0')); setD(String(t.getDate()).padStart(2,'0')); }}>Yarın</Button>
            <Button mode="text" onPress={()=>{ setDue(""); setDateOpen(false); }}>Temizle</Button>
          </View>
          <View style={{ flexDirection:'row', justifyContent:'flex-end', gap: 12, marginTop: 14 }}>
            <Button mode="text" onPress={()=>setDateOpen(false)}>İptal</Button>
            <Button mode="contained" onPress={()=>{ const yy=parseInt(y,10); const mm=parseInt(m,10); const dd=parseInt(d,10); const valid = !isNaN(yy)&&!isNaN(mm)&&!isNaN(dd)&&mm>=1&&mm<=12&&dd>=1&&dd<=31; if(valid){ const ds = `${String(yy)}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`; setDue(ds); setDateOpen(false);} }}>Uygula</Button>
          </View>
        </Modal>
      </Portal>
    </ScrollView>
  );
}
