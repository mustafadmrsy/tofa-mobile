import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from "react-native";
import { colors } from "../theme/colors";
import { listUsers, updateUserRole } from "../services/users";
import { listAllTeams } from "../services/teams";
import { listUserTasks } from "../services/tasks";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Portal, Modal, Button, RadioButton, Snackbar } from "react-native-paper";

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

  const renderItem = ({ item }) => {
    const display = item.name || item.email || item.uid;
    const initials = (display || '').split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase();
    return (
      <TouchableOpacity onPress={() => openDetail(item)} activeOpacity={0.9} style={{
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#1f2233',
        backgroundColor: '#0b0d16',
        marginBottom: 12,
        shadowColor: '#8b5cf6',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 0 }
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#111426', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#8b5cf6' }}>
            <Text style={{ color: '#8b5cf6', fontWeight: '800' }}>{initials || 'U'}</Text>
          </View>
          <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 16, marginLeft: 12 }}>{display}</Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
          <Text style={{ color: '#9aa0a6' }}>Role: <Text style={{ color: '#22d3ee' }}>{item.role || 'worker'}</Text></Text>
          <Text style={{ color: '#9aa0a6' }}>Team: <Text style={{ color: '#e6e6e6' }}>{item.teamId ? (teamMap[item.teamId] || item.teamId) : '-'}</Text></Text>
          <Text style={{ color: '#9aa0a6' }}>Verified: <Text style={{ color: item.verified === 1 ? '#22c55e' : '#ef4444' }}>{item.verified === 1 ? '1' : '0'}</Text></Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 16, paddingTop: 16 + Math.max(insets.top, 8) }}>
      <Text style={{ color: '#8b5cf6', fontSize: 22, fontWeight: '900', marginBottom: 12 }}>Kullanıcılar</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={!loading ? <Text style={{ color: colors.textSecondary }}>Kayıt bulunamadı</Text> : null}
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
