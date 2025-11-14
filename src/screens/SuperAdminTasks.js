import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, RefreshControl, TouchableOpacity, TextInput as RNTextInput, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/colors";
import { listAllTasks, updateTask } from "../services/tasks";
import { listAllTeams } from "../services/teams";
import { listUsers } from "../services/users";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Portal, Modal, Button, RadioButton, Snackbar, TextInput } from "react-native-paper";
import { ArrowLeft, Eye, Pencil } from "lucide-react-native";

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
  const [activeTeam, setActiveTeam] = useState(null);
  const [search, setSearch] = useState("");
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

  const getDueMs = (item) => {
    if (!item.dueDate) return Infinity;
    return item.dueDate.seconds ? item.dueDate.seconds*1000 : item.dueDate;
  };

  const teamTasks = useMemo(() => {
    if (!activeTeam) return [];
    const memberIds = new Set([activeTeam.leaderId, ...(activeTeam.memberIds || [])].filter(Boolean));
    return tasks.filter(t => {
      const belongsToTeam = t.teamId === activeTeam.id;
      const assigneeInTeam = t.assigneeId && memberIds.has(t.assigneeId);
      return belongsToTeam || assigneeInTeam;
    });
  }, [tasks, activeTeam]);

  const filteredTasks = useMemo(() => {
    const base = activeTeam ? teamTasks : tasks;
    const q = search.trim().toLowerCase();
    const filtered = base.filter(t => {
      if (!q) return true;
      const title = (t.title || "").toLowerCase();
      const desc = (t.description || "").toLowerCase();
      const assignee = t.assigneeId ? (userMap[t.assigneeId] || "").toLowerCase() : "";
      const teamName = t.teamId ? (teamMap[t.teamId] || "").toLowerCase() : "";
      return title.includes(q) || desc.includes(q) || assignee.includes(q) || teamName.includes(q);
    });
    return filtered.sort((a,b) => getDueMs(a) - getDueMs(b));
  }, [tasks, teamTasks, activeTeam, search, userMap, teamMap]);

  const isOverdue = (item) => {
    if (!item.dueDate) return false;
    const dueMs = getDueMs(item);
    return item.status !== 'done' && Date.now() > dueMs;
  };

  const renderTaskItem = ({ item }) => {
    const assigneeLabel = item.assigneeId ? (userMap[item.assigneeId] || item.assigneeId) : "Atanmamış";
    const teamLabel = item.teamId ? (teamMap[item.teamId] || item.teamId) : "Takım yok";
    const overdue = isOverdue(item);
    const dueText = item.dueDate
      ? new Date(getDueMs(item)).toLocaleDateString()
      : "-";

    const statusLabel = item.status || "todo";
    const statusColor = statusLabel === "done" ? "#22c55e" : statusLabel === "in_progress" ? "#3b82f6" : "#f97316";

    return (
      <TouchableOpacity
        onPress={() => openEdit(item)}
        activeOpacity={0.93}
        style={{ marginBottom: 12 }}
      >
        <LinearGradient
          colors={["#020617", "#111827"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 18,
            padding: 14,
            borderWidth: 1,
            borderColor: overdue ? "#ef4444" : "#1f2937",
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={{ color: '#f9fafb', fontWeight: '800', fontSize: 15 }} numberOfLines={2}>{item.title}</Text>
              {!!item.description && (
                <Text style={{ color: colors.textSecondary, marginTop: 4 }} numberOfLines={2}>{item.description}</Text>
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center' }}>
                <Eye color="#e5e7eb" size={16} />
              </View>
              <View style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center' }}>
                <Pencil color="#e5e7eb" size={16} />
              </View>
            </View>
          </View>

          <View style={{ marginTop: 8 }}>
            <Text style={{ color: '#e5e7eb', fontSize: 12 }}>
              {assigneeLabel} • {teamLabel}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: statusColor + '33', borderWidth: 1, borderColor: statusColor + '55' }}>
                <Text style={{ color: statusColor, fontSize: 11, fontWeight: '600' }}>{statusLabel}</Text>
              </View>
              {overdue && (
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: '#b91c1c33', borderWidth: 1, borderColor: '#ef444455' }}>
                  <Text style={{ color: '#f97373', fontSize: 11, fontWeight: '600' }}>Overdue</Text>
                </View>
              )}
            </View>
            <Text style={{ color: '#9ca3af', fontSize: 11 }}>Due: <Text style={{ color: overdue ? '#f97373' : '#e5e7eb' }}>{dueText}</Text></Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 16, paddingTop: 16 + Math.max(insets.top, 8) }}>
      <LinearGradient
        colors={["#111827", "#1f2937"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 18, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: '#4b5563' }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {activeTeam && (
              <Pressable onPress={() => setActiveTeam(null)} style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: '#020617', alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
                <ArrowLeft color="#e5e7eb" size={16} />
              </Pressable>
            )}
            <Text style={{ color: '#f9fafb', fontSize: 18, fontWeight: '800' }}>
              {activeTeam ? `${activeTeam.name} Tasks` : 'All Tasks'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <TextInput
        mode="outlined"
        placeholder={activeTeam ? 'Görev ara...' : 'Takım / görev ara...'}
        value={search}
        onChangeText={setSearch}
        style={{ marginBottom: 10 }}
        outlineColor={'#1f2937'}
        activeOutlineColor={'#6366f1'}
        textColor={'#e5e7eb'}
        placeholderTextColor={'#6b7280'}
      />

      {!activeTeam ? (
        <FlatList
          data={teams}
          keyExtractor={(t) => t.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          ListEmptyComponent={!loading ? <Text style={{ color: colors.textSecondary }}>Takım bulunamadı</Text> : null}
          renderItem={({ item }) => {
            const memberIds = Array.from(new Set([item.leaderId, ...(item.memberIds || [])].filter(Boolean)));
            const memberTasks = tasks.filter(t => {
              const belongsToTeam = t.teamId === item.id;
              const assigneeInTeam = t.assigneeId && memberIds.includes(t.assigneeId);
              return belongsToTeam || assigneeInTeam;
            });

            return (
              <Pressable
                onPress={() => setActiveTeam(item)}
                style={{ marginBottom: 10 }}
              >
                <LinearGradient
                  colors={["#1f1247", "#2d0f5f"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#4c1d95' }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: '#f9fafb', fontSize: 15, fontWeight: '800' }}>{item.name}</Text>
                    <Text style={{ color: '#9ca3af', fontSize: 12 }}>{memberTasks.length} görev</Text>
                  </View>
                  <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
                    <View style={{ flex: 1, backgroundColor: '#251457', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 10 }}>
                      <Text style={{ color: '#e5e7eb', fontSize: 11 }}>Members</Text>
                      <Text style={{ color: '#f9fafb', fontSize: 16, fontWeight: '800' }}>{memberIds.length}</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: '#251457', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 10 }}>
                      <Text style={{ color: '#e5e7eb', fontSize: 11 }}>Tasks</Text>
                      <Text style={{ color: '#f9fafb', fontSize: 16, fontWeight: '800' }}>{memberTasks.length}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>
            );
          }}
        />
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTaskItem}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          ListEmptyComponent={!loading ? <Text style={{ color: colors.textSecondary }}>Görev bulunamadı</Text> : null}
        />
      )}
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
