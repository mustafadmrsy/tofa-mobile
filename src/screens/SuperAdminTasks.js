import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, RefreshControl, TouchableOpacity, TextInput as RNTextInput } from "react-native";
import { colors } from "../theme/colors";
import { listAllTasks, updateTask } from "../services/tasks";
import { listAllTeams } from "../services/teams";
import { listUsers } from "../services/users";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Portal, Modal, Button, RadioButton, Snackbar, TextInput } from "react-native-paper";

export default function SuperAdminTasks() {
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [edit, setEdit] = useState({ title: "", description: "", status: "todo", teamId: null, assigneeId: null, dueDateStr: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const insets = useSafeAreaInsets();

  const teamMap = useMemo(() => {
    const m = {}; teams.forEach(t => { m[t.id] = t.name; }); return m;
  }, [teams]);
  const userMap = useMemo(() => {
    const m = {}; users.forEach(u => { m[u.id] = u.name || u.email || u.uid; }); return m;
  }, [users]);

  const load = async () => {
    setLoading(true);
    try {
      const [ts, t, us] = await Promise.all([listAllTasks(), listAllTeams(), listUsers()]);
      setTasks(ts);
      setTeams(t);
      setUsers(us);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openEdit = (item) => {
    setSelected(item);
    const due = item.dueDate ? (item.dueDate.seconds ? new Date(item.dueDate.seconds*1000) : new Date(item.dueDate)) : null;
    setEdit({
      title: item.title || "",
      description: item.description || "",
      status: item.status || "todo",
      teamId: item.teamId || null,
      assigneeId: item.assigneeId || null,
      dueDateStr: due ? due.toISOString().slice(0,10) : "",
    });
  };

  const saveEdit = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      setError(""); setSuccess("");
      const payload = {
        title: edit.title,
        description: edit.description,
        status: edit.status,
        teamId: edit.teamId || null,
        assigneeId: edit.assigneeId || null,
      };
      if (edit.dueDateStr) {
        const d = new Date(edit.dueDateStr);
        if (!isNaN(d.getTime())) payload.dueDate = d;
      } else {
        payload.dueDate = null;
      }
      await updateTask(selected.id, payload);
      await load();
      setSuccess("Görev güncellendi");
      setSelected(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a,b) => {
      const da = a.dueDate ? (a.dueDate.seconds ? a.dueDate.seconds*1000 : a.dueDate) : Infinity;
      const db = b.dueDate ? (b.dueDate.seconds ? b.dueDate.seconds*1000 : b.dueDate) : Infinity;
      return da - db;
    });
  }, [tasks]);

  const isOverdue = (item) => {
    if (!item.dueDate) return false;
    const dueMs = item.dueDate.seconds ? item.dueDate.seconds*1000 : item.dueDate;
    return item.status !== 'done' && Date.now() > dueMs;
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => openEdit(item)} activeOpacity={0.92} style={{ padding: 14, borderRadius: 16, borderWidth: 1, borderColor: isOverdue(item) ? '#ef4444' : '#1f2233', backgroundColor: '#0b0d16', marginBottom: 12, shadowColor: '#8b5cf6', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }}>
      <Text style={{ color: '#22d3ee', fontWeight: '800', fontSize: 16 }}>{item.title}</Text>
      {!!item.description && <Text style={{ color: colors.textSecondary, marginTop: 4 }}>{item.description}</Text>}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
        <Text style={{ color: colors.textSecondary }}>Team: <Text style={{ color: colors.textPrimary }}>{item.teamId ? (teamMap[item.teamId] || item.teamId) : '-'}</Text></Text>
        <Text style={{ color: colors.textSecondary }}>Assignee: <Text style={{ color: colors.textPrimary }}>{item.assigneeId ? (userMap[item.assigneeId] || item.assigneeId) : '-'}</Text></Text>
        <Text style={{ color: colors.textSecondary }}>Status: <Text style={{ color: colors.textPrimary }}>{item.status}</Text></Text>
        <Text style={{ color: colors.textSecondary }}>Due: <Text style={{ color: isOverdue(item) ? '#ef4444' : colors.textPrimary }}>{item.dueDate ? new Date(item.dueDate.seconds ? item.dueDate.seconds*1000 : item.dueDate).toLocaleDateString() : '-'}</Text></Text>
      </View>
      {isOverdue(item) && <Text style={{ color: '#ef4444', marginTop: 6 }}>Overdue</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 16, paddingTop: 16 + Math.max(insets.top, 8) }}>
      <Text style={{ color: '#8b5cf6', fontSize: 22, fontWeight: '900', marginBottom: 12 }}>Tüm Görevler</Text>
      <FlatList
        data={sortedTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={!loading ? <Text style={{ color: colors.textSecondary }}>Görev bulunamadı</Text> : null}
      />
      <Portal>
        <Modal visible={!!selected} onDismiss={() => setSelected(null)} contentContainerStyle={{ margin: 16, borderRadius: 16, backgroundColor: '#0b0d16', padding: 16, borderWidth: 1, borderColor: '#8b5cf6' }}>
          {selected && (
            <View>
              <Text style={{ color: '#8b5cf6', fontSize: 18, fontWeight: '900' }}>{selected.id}</Text>
              <TextInput label="Başlık" mode="outlined" value={edit.title} onChangeText={(v)=>setEdit(s=>({...s,title:v}))} style={{ marginTop: 12 }} />
              <TextInput label="Açıklama" mode="outlined" value={edit.description} onChangeText={(v)=>setEdit(s=>({...s,description:v}))} style={{ marginTop: 8 }} multiline />

              <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Durum</Text>
              <RadioButton.Group onValueChange={(v)=>setEdit(s=>({...s,status:v}))} value={edit.status}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                  <RadioButton value="todo" />
                  <Text style={{ color: colors.textPrimary }}>todo</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <RadioButton value="in_progress" />
                  <Text style={{ color: colors.textPrimary }}>in_progress</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <RadioButton value="done" />
                  <Text style={{ color: colors.textPrimary }}>done</Text>
                </View>
              </RadioButton.Group>

              <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Takım seç</Text>
              <View style={{ maxHeight: 120, borderWidth: 1, borderColor: '#1f2233', borderRadius: 10 }}>
                <FlatList data={teams} keyExtractor={(t)=>t.id} renderItem={({item}) => (
                  <TouchableOpacity onPress={()=>setEdit(s=>({...s, teamId:item.id}))} style={{ padding: 10, backgroundColor: edit.teamId===item.id ? '#111426' : 'transparent' }}>
                    <Text style={{ color: colors.textPrimary }}>{item.name}</Text>
                  </TouchableOpacity>
                )} />
              </View>

              <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Kullanıcı seç</Text>
              <View style={{ maxHeight: 120, borderWidth: 1, borderColor: '#1f2233', borderRadius: 10 }}>
                <FlatList data={users.filter(u=>!edit.teamId || u.teamId===edit.teamId)} keyExtractor={(u)=>u.id} renderItem={({item}) => (
                  <TouchableOpacity onPress={()=>setEdit(s=>({...s, assigneeId:item.id}))} style={{ padding: 10, backgroundColor: edit.assigneeId===item.id ? '#111426' : 'transparent' }}>
                    <Text style={{ color: colors.textPrimary }}>{item.name || item.email || item.uid}</Text>
                  </TouchableOpacity>
                )} />
              </View>

              <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Bitiş tarihi (YYYY-MM-DD)</Text>
              <RNTextInput value={edit.dueDateStr} onChangeText={(v)=>setEdit(s=>({...s, dueDateStr:v}))} placeholder="2025-12-31" style={{ borderWidth: 1, borderColor: '#1f2233', borderRadius: 10, padding: 10, color: '#e6e6e6', marginTop: 6 }} />

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 14 }}>
                <Button mode="text" onPress={()=>setSelected(null)} disabled={saving}>Kapat</Button>
                <Button mode="contained" onPress={saveEdit} loading={saving} disabled={saving}>Kaydet</Button>
              </View>
            </View>
          )}
        </Modal>
      </Portal>

      <Snackbar visible={!!error} onDismiss={()=>setError("")} duration={4000} style={{ backgroundColor: '#ef4444' }}>{error}</Snackbar>
      <Snackbar visible={!!success} onDismiss={()=>setSuccess("")} duration={3000} style={{ backgroundColor: '#22c55e' }}>{success}</Snackbar>
    </View>
  );
}
