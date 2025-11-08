import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { colors } from "../theme/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TextInput, Button, Snackbar } from "react-native-paper";
import { createTeamAutoId, listAllTeams, setTeamLeader, addTeamMember, removeTeamMember } from "../services/teams";
import { listUsers, updateUserRole, updateUserTeam } from "../services/users";

export default function SuperAdminTeams() {
  const insets = useSafeAreaInsets();
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);

  const userMap = useMemo(() => {
    const m = {}; users.forEach(u => { m[u.id] = u.name || u.email || u.uid; }); return m;
  }, [users]);

  const load = async () => {
    setLoading(true);
    try {
      const [t, u] = await Promise.all([listAllTeams(), listUsers()]);
      setTeams(t);
      setUsers(u);
      if (selectedTeam) {
        const updated = t.find(x => x.id === selectedTeam.id);
        setSelectedTeam(updated || null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    try {
      setCreating(true);
      setError(""); setSuccess("");
      if (!name.trim()) throw new Error("Ekip adı zorunlu");
      await createTeamAutoId({ name: name.trim(), leaderId: null, memberIds: [] });
      setName("");
      setSuccess("Ekip oluşturuldu");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleSetLeader = async (team, leaderId) => {
    try {
      setError(""); setSuccess("");
      // Önce önceki lideri worker yap (varsa)
      if (team.leaderId && team.leaderId !== leaderId) {
        try { await updateUserRole(team.leaderId, 'worker'); } catch {}
      }
      await setTeamLeader(team.id, leaderId);
      await updateUserRole(leaderId, 'leader');
      // Lider takım üyesi değilse ekle ve teamId ata
      if (!team.memberIds || !team.memberIds.includes(leaderId)) {
        try { await addTeamMember(team.id, leaderId); } catch {}
      }
      try { await updateUserTeam(leaderId, team.id); } catch {}
      setSuccess("Ekip lideri atandı");
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleAddMember = async (team, userId) => {
    try {
      setError(""); setSuccess("");
      await addTeamMember(team.id, userId);
      await updateUserTeam(userId, team.id);
      setSuccess("Üye eklendi");
      await load();
    } catch (e) { setError(e.message); }
  };

  const handleRemoveMember = async (team, userId) => {
    try {
      setError(""); setSuccess("");
      await removeTeamMember(team.id, userId);
      await updateUserTeam(userId, null);
      // Eğer çıkarılan kişi lider ise rolünü worker yap ve lideri kaldır
      if (team.leaderId === userId) {
        try { await updateUserRole(userId, 'worker'); } catch {}
        await setTeamLeader(team.id, null);
      }
      setSuccess("Üye çıkarıldı");
      await load();
    } catch (e) { setError(e.message); }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, paddingBottom: 40 }}>
      <Text style={{ color: '#8b5cf6', fontSize: 22, fontWeight: '900', marginBottom: 12 }}>Ekipler</Text>

      <View style={{ borderWidth: 1, borderColor: '#8b5cf6', borderRadius: 14, padding: 12, marginBottom: 16, backgroundColor: '#0b0d16', shadowColor: '#8b5cf6', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }}>
        <Text style={{ color: '#8b5cf6', fontWeight: '900', marginBottom: 6 }}>Yeni Ekip Oluştur</Text>
        <TextInput mode="outlined" placeholder="Ekip adı" value={name} onChangeText={setName} style={{ marginBottom: 8 }} />
        <Button mode="contained" onPress={handleCreate} loading={creating} disabled={creating}>Oluştur</Button>
      </View>

      <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Mevcut Ekipler</Text>
      {(!teams || teams.length === 0) && !loading ? (
        <Text style={{ color: colors.textSecondary }}>Henüz ekip yok</Text>
      ) : (
        <View>
          {teams.map(team => (
            <View key={team.id} style={{ padding: 14, borderWidth: 1, borderColor: '#1f2233', borderRadius: 16, marginBottom: 12, backgroundColor: '#0b0d16', shadowColor: '#8b5cf6', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }}>
              <TouchableOpacity onPress={() => setSelectedTeam(team)}>
                <Text style={{ color: '#22d3ee', fontWeight: '800', fontSize: 16 }}>{team.name}</Text>
                <Text style={{ color: colors.textSecondary, marginTop: 4 }}>Lider: <Text style={{ color: '#e6e6e6' }}>{team.leaderId ? (userMap[team.leaderId] || team.leaderId) : '-'}</Text></Text>
                <Text style={{ color: colors.textSecondary }}>Üye sayısı: <Text style={{ color: colors.textPrimary }}>{team.memberIds ? team.memberIds.length : 0}</Text></Text>
              </TouchableOpacity>
              {selectedTeam && selectedTeam.id === team.id && (
                <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: '#1f2233', paddingTop: 10 }}>
                  <Text style={{ color: colors.textSecondary, marginBottom: 6 }}>Lider ata</Text>
                  <View style={{ maxHeight: 160, borderWidth: 1, borderColor: '#8b5cf6', borderRadius: 12 }}>
                    <ScrollView>
                      {users.map(u => (
                        <TouchableOpacity key={u.id} onPress={() => handleSetLeader(team, u.id)} style={{ padding: 10, backgroundColor: (team.leaderId===u.id) ? '#111426' : 'transparent' }}>
                          <Text style={{ color: '#e6e6e6' }}>{u.name || u.email || u.uid}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <Text style={{ color: colors.textSecondary, marginTop: 12, marginBottom: 6 }}>Üyeler</Text>
                  <View style={{ borderWidth: 1, borderColor: '#1f2233', borderRadius: 12 }}>
                    <ScrollView>
                      {(() => {
                        const memberIds = Array.from(new Set([team.leaderId, ...(team.memberIds || [])].filter(Boolean)));
                        return memberIds.map(uid => (
                          <View key={uid} style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#1f2233', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ color: uid===team.leaderId ? '#22d3ee' : '#e6e6e6', fontWeight: uid===team.leaderId ? '800' : '600' }}>{userMap[uid] || uid}{uid===team.leaderId ? ' (Lider)' : ''}</Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                              {uid!==team.leaderId && (
                                <Button compact mode="outlined" onPress={() => handleRemoveMember(team, uid)}>Çıkar</Button>
                              )}
                            </View>
                          </View>
                        ));
                      })()}
                    </ScrollView>
                  </View>

                  <Text style={{ color: colors.textSecondary, marginTop: 12, marginBottom: 6 }}>Üye ekle</Text>
                  <View style={{ borderWidth: 1, borderColor: '#1f2233', borderRadius: 12 }}>
                    <ScrollView>
                      {users.filter(u => !(team.memberIds||[]).includes(u.id) && u.id !== team.leaderId).map(u => (
                        <TouchableOpacity key={u.id} onPress={() => handleAddMember(team, u.id)} style={{ padding: 10 }}>
                          <Text style={{ color: '#e6e6e6' }}>{u.name || u.email || u.uid}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      <Snackbar visible={!!error} onDismiss={()=>setError("")} duration={4000} style={{ backgroundColor: '#ef4444', marginTop: 12 }}>{error}</Snackbar>
      <Snackbar visible={!!success} onDismiss={()=>setSuccess("")} duration={3000} style={{ backgroundColor: '#22c55e', marginTop: 12 }}>{success}</Snackbar>
    </ScrollView>
  );
}
