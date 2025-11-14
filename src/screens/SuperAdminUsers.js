import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, RefreshControl, TouchableOpacity, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/colors";
import { listUsers, updateUserRole } from "../services/users";
import { listAllTeams } from "../services/teams";
import { listUserTasks } from "../services/tasks";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Portal, Modal, Button, RadioButton, Snackbar, TextInput as PaperTextInput } from "react-native-paper";
import { UserPlus } from "lucide-react-native";

export default function SuperAdminUsers() {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [roleSel, setRoleSel] = useState("worker");
  const [userTasks, setUserTasks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const insets = useSafeAreaInsets();

  const teamMap = useMemo(() => {
    const m = {};
    teams.forEach(t => { m[t.id] = t.name; });
    return m;
  }, [teams]);

  const load = async () => {
    setLoading(true);
    try {
      const [u, t] = await Promise.all([listUsers(), listAllTeams()]);
      setUsers(u);
      setTeams(t);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openDetail = async (item) => {
    setSelected(item);
    setRoleSel(item.role || "worker");
    setUserTasks([]);
    try {
      setLoading(true);
      const ts = await listUserTasks(item.id);
      setUserTasks(ts);
    } finally {
      setLoading(false);
    }
  };

  const saveRole = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await updateUserRole(selected.id, roleSel);
      await load();
      setSuccess("Rol güncellendi");
      setSelected(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter(u => (u.role || "worker") === "leader").length;
    const superAdmins = users.filter(u => (u.role || "worker") === "superadmin").length;
    return { total, admins, superAdmins };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(u => {
      if (roleFilter !== "all" && (u.role || "worker") !== roleFilter) return false;
      if (!q) return true;
      const display = (u.name || u.email || u.uid || "").toLowerCase();
      return display.includes(q);
    });
  }, [users, search, roleFilter]);

  const renderItem = ({ item }) => {
    const display = item.name || item.email || item.uid;
    const initials = (display || '').split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase();
    const role = item.role || 'worker';
    const roleColor = role === 'superadmin' ? '#fb7185' : role === 'leader' ? '#38bdf8' : '#a3e635';
    const statusLabel = item.verified === 1 ? 'Active' : 'Unverified';
    const statusColor = item.verified === 1 ? '#22c55e' : '#facc15';
    return (
      <TouchableOpacity
        onPress={() => openDetail(item)}
        activeOpacity={0.92}
        style={{
          padding: 14,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: '#1f2937',
          backgroundColor: '#020617',
          marginBottom: 12,
          shadowColor: '#22d3ee',
          shadowOpacity: 0.25,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 0 }
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent:'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#6366f1' }}>
              <Text style={{ color: '#e5e7eb', fontWeight: '800', fontSize: 16 }}>{initials || 'U'}</Text>
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 16 }}>{display}</Text>
              {!!item.email && (
                <Text style={{ color: '#9ca3af', fontSize: 12 }}>{item.email}</Text>
              )}
            </View>
          </View>
          {/* sağ tarafta basit bir aksiyon placeholder'ı (detay için dokunma zaten tüm karta bağlı) */}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(15,23,42,0.9)', borderWidth: 1, borderColor: roleColor }}>
            <Text style={{ color: roleColor, fontSize: 11, fontWeight: '700' }}>{role}</Text>
          </View>
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(15,23,42,0.9)', borderWidth: 1, borderColor: statusColor }}>
            <Text style={{ color: statusColor, fontSize: 11, fontWeight: '700' }}>{statusLabel}</Text>
          </View>
          {item.teamId && (
            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(15,23,42,0.9)', borderWidth: 1, borderColor: '#4b5563' }}>
              <Text style={{ color: '#e5e7eb', fontSize: 11 }}>Team: {teamMap[item.teamId] || item.teamId}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 16, paddingTop: 16 + Math.max(insets.top, 8) }}>
      {/* Header + stats */}
      <LinearGradient
        colors={["#1e1b4b", "#022c22"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "#4c1d95", marginBottom: 16 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: '#f9fafb', fontSize: 20, fontWeight: '900' }}>Super Admin</Text>
            <Text style={{ color: '#c4b5fd', marginTop: 4 }}>User Overview</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <View style={{ flex: 1, borderRadius: 16, padding: 12, backgroundColor: 'rgba(15,23,42,0.85)', borderWidth: 1, borderColor: '#6366f1' }}>
            <Text style={{ color: '#9ca3af', fontSize: 12 }}>Total Users</Text>
            <Text style={{ color: '#e5e7eb', fontSize: 22, fontWeight: '900', marginTop: 4 }}>{stats.total}</Text>
          </View>
          <View style={{ flex: 1, borderRadius: 16, padding: 12, backgroundColor: 'rgba(15,23,42,0.85)', borderWidth: 1, borderColor: '#22c55e' }}>
            <Text style={{ color: '#9ca3af', fontSize: 12 }}>Admins</Text>
            <Text style={{ color: '#e5e7eb', fontSize: 22, fontWeight: '900', marginTop: 4 }}>{stats.admins}</Text>
          </View>
          <View style={{ flex: 1, borderRadius: 16, padding: 12, backgroundColor: 'rgba(15,23,42,0.85)', borderWidth: 1, borderColor: '#f97316' }}>
            <Text style={{ color: '#9ca3af', fontSize: 12 }}>Super Admins</Text>
            <Text style={{ color: '#e5e7eb', fontSize: 22, fontWeight: '900', marginTop: 4 }}>{stats.superAdmins}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* User Management header + Add User */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <View>
          <Text style={{ color: '#e5e7eb', fontSize: 16, fontWeight: '800' }}>User Management</Text>
          <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>Manage roles and status</Text>
        </View>
        <Pressable
          onPress={() => { /* ileride kullanıcı oluşturma ekranına yönlendirilebilir */ }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#6366f1' }}
        >
          <UserPlus color="#f9fafb" size={16} />
          <Text style={{ color: '#f9fafb', fontWeight: '700', fontSize: 12 }}>Add User</Text>
        </Pressable>
      </View>

      {/* Search */}
      <PaperTextInput
        mode="outlined"
        placeholder="Search users..."
        value={search}
        onChangeText={setSearch}
        style={{ marginBottom: 10, backgroundColor: 'transparent', borderRadius: 14 }}
        outlineColor={'#1f2937'}
        activeOutlineColor={'#6366f1'}
        textColor={'#e5e7eb'}
        placeholderTextColor={'#6b7280'}
      />

      {/* Role filters */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        {[
          { k: 'all', label: 'All' },
          { k: 'worker', label: 'Workers' },
          { k: 'leader', label: 'Admins' },
          { k: 'superadmin', label: 'Super Admins' },
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

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={!loading ? <Text style={{ color: colors.textSecondary }}>Kayıt bulunamadı</Text> : null}
        contentContainerStyle={{ paddingBottom: 16 }}
      />

      <Portal>
        <Modal visible={!!selected} onDismiss={() => setSelected(null)} contentContainerStyle={{ margin: 16, borderRadius: 18, backgroundColor: '#0b0d16', padding: 16, borderWidth: 1, borderColor: '#8b5cf6' }}>
          {selected && (
            <View>
              <Text style={{ color: '#8b5cf6', fontSize: 18, fontWeight: '900' }}>{selected.name || selected.email || selected.uid}</Text>
              <Text style={{ color: colors.textSecondary, marginTop: 4 }}>Rolü değiştir</Text>
              <RadioButton.Group onValueChange={setRoleSel} value={roleSel}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <RadioButton value="superadmin" />
                  <Text style={{ color: colors.textPrimary }}>superadmin</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <RadioButton value="leader" />
                  <Text style={{ color: colors.textPrimary }}>leader</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <RadioButton value="worker" />
                  <Text style={{ color: colors.textPrimary }}>worker</Text>
                </View>
              </RadioButton.Group>

              <Text style={{ color: colors.textSecondary, marginTop: 12, marginBottom: 6 }}>Kullanıcının görevleri</Text>
              <View style={{ maxHeight: 240 }}>
                <FlatList
                  data={userTasks}
                  keyExtractor={(t) => t.id}
                  renderItem={({ item }) => (
                    <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1f2233' }}>
                      <Text style={{ color: '#22d3ee', fontWeight: '700' }}>{item.title}</Text>
                      {!!item.status && <Text style={{ color: colors.textSecondary, marginTop: 2 }}>Status: {item.status}</Text>}
                    </View>
                  )}
                  ListEmptyComponent={!loading ? <Text style={{ color: colors.textSecondary }}>Görevi yok</Text> : null}
                />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 14 }}>
                <Button mode="text" onPress={() => setSelected(null)} disabled={saving}>Kapat</Button>
                <Button mode="contained" onPress={saveRole} loading={saving} disabled={saving}>Kaydet</Button>
              </View>
            </View>
          )}
        </Modal>
      </Portal>

      <Snackbar visible={!!error} onDismiss={() => setError("")} duration={4000} style={{ backgroundColor: '#ef4444' }}>{error}</Snackbar>
      <Snackbar visible={!!success} onDismiss={() => setSuccess("")} duration={3000} style={{ backgroundColor: '#22c55e' }}>{success}</Snackbar>
    </View>
  );
}
