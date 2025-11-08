import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
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
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800' }}>Görev Oluştur</Text>
        <Text style={{ color: '#9aa0a6', marginTop: 4 }}>Başlık, açıklama ve atama bilgilerini gir</Text>
      </View>

      <Text style={{ color: '#9aa0a6' }}>Başlık</Text>
      <TextInput
        mode="outlined"
        placeholder="Örn. Sunum hazırlığı"
        value={title}
        onChangeText={setTitle}
        style={[inputStyle, { marginTop: 6, marginBottom: 12 }]}
        outlineColor={outlineColor}
        activeOutlineColor={activeOutlineColor}
        textColor={'#e6e6e6'}
        placeholderTextColor={'#6b7280'}
      />

      <Text style={{ color: '#9aa0a6' }}>Açıklama</Text>
      <TextInput
        mode="outlined"
        placeholder="Görev detaylarını yazın"
        value={desc}
        onChangeText={setDesc}
        multiline
        numberOfLines={4}
        style={[inputStyle, { marginTop: 6, marginBottom: 12 }]}
        outlineColor={outlineColor}
        activeOutlineColor={activeOutlineColor}
        textColor={'#e6e6e6'}
        placeholderTextColor={'#6b7280'}
      />

      <Text style={{ color: '#9aa0a6', marginTop: 6 }}>Takım Seç</Text>
      <View style={{ maxHeight: 140, borderWidth: 1, borderColor: '#1f2233', borderRadius: 12, marginTop: 6, marginBottom: 12 }}>
        {(!teams || teams.length === 0) && !loading ? (
          <Text style={{ color: colors.textSecondary, padding: 12 }}>Takım bulunamadı</Text>
        ) : (
          <View>
            {teams.map((item) => (
              <TouchableOpacity key={item.id} onPress={()=>{ setTeamId(item.id); setAssigneeId(null); }} style={{ padding: 12, backgroundColor: teamId===item.id ? '#111426' : 'transparent' }}>
                <Text style={{ color: colors.textPrimary }}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <Text style={{ color: '#9aa0a6' }}>Atanacak Kişi</Text>
      <View style={{ maxHeight: 160, borderWidth: 1, borderColor: '#1f2233', borderRadius: 12, marginTop: 6, marginBottom: 12 }}>
        {(!filteredUsers || filteredUsers.length === 0) && !loading ? (
          <Text style={{ color: colors.textSecondary, padding: 12 }}>Kullanıcı bulunamadı</Text>
        ) : (
          <View>
            {filteredUsers.map((item) => (
              <TouchableOpacity key={item.id} onPress={()=>setAssigneeId(item.id)} style={{ padding: 12, backgroundColor: assigneeId===item.id ? '#111426' : 'transparent' }}>
                <Text style={{ color: colors.textPrimary }}>{item.name || item.email || item.uid}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <Text style={{ color: '#9aa0a6' }}>Son Tarih</Text>
      <TouchableOpacity onPress={()=>{ setDateOpen(true); const dt = due ? new Date(due) : new Date(); setY(String(dt.getFullYear())); setM(String(dt.getMonth()+1).padStart(2,'0')); setD(String(dt.getDate()).padStart(2,'0')); }} style={{ marginTop: 6, marginBottom: 12, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: outlineColor, backgroundColor: 'transparent' }}>
        <Text style={{ color: due ? '#e6e6e6' : '#6b7280' }}>{due || 'Tarih seç'}</Text>
      </TouchableOpacity>

      <Text style={{ color: '#9aa0a6', marginBottom: 6 }}>Öncelik</Text>
      <SegmentedButtons
        value={priority}
        onValueChange={setPriority}
        buttons={[
          { value: 'low', label: 'Düşük' },
          { value: 'medium', label: 'Orta' },
          { value: 'high', label: 'Yüksek' },
        ]}
        style={{ marginBottom: 16 }}
      />

      <NeonButton title="Görevi Oluştur" onPress={handleSubmit} loading={submitting} disabled={submitting} />

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
