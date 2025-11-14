import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TextInput, Button, Snackbar, Portal, Modal } from "react-native-paper";
import { Plus, Eye, Pencil } from "lucide-react-native";
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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [leaderDropdownOpen, setLeaderDropdownOpen] = useState(false);

  const userMap = useMemo(() => {
    const m = {}; users.forEach(u => { m[u.id] = u.name || u.email || u.uid; }); return m;
  }, [users]);

  const filteredTeams = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teams.filter(t => {
      if (q && !(t.name || "").toLowerCase().includes(q)) return false;
      if (filter === "large" && (!t.memberIds || t.memberIds.length < 5)) return false;
      // "active" filtresi için şimdilik ekstra sorgu yok; tüm takımları gösteriyoruz
      return true;
    });
  }, [teams, search, filter]);

  const getInitials = (user) => {
    const base = user?.name || user?.email || "?";
    const parts = base.split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

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
      {/* Header with + button */}
      <LinearGradient
        colors={["#1f1247", "#2d0f5f"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 18, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: '#4c1d95' }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#f9fafb', fontSize: 18, fontWeight: '800' }}>Teams</Text>
          <Pressable
            onPress={() => setCreateOpen(true)}
            style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: '#ec4899', alignItems: 'center', justifyContent: 'center' }}
          >
            <Plus color="#f9fafb" size={18} />
          </Pressable>
        </View>
      </LinearGradient>

      {/* Search */}
      <TextInput
        mode="outlined"
        placeholder="Takım ara..."
        value={search}
        onChangeText={setSearch}
        style={{ marginBottom: 10, backgroundColor: 'transparent', borderRadius: 14 }}
        outlineColor={'#1f2937'}
        activeOutlineColor={'#6366f1'}
        textColor={'#e5e7eb'}
        placeholderTextColor={'#6b7280'}
      />

      {/* Filters */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        {[
          { k: 'all', label: 'All Teams' },
          { k: 'active', label: 'Active' },
          { k: 'large', label: 'Large Teams' },
        ].map(btn => (
          <Pressable
            key={btn.k}
            onPress={() => setFilter(btn.k)}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 999,
              backgroundColor: filter === btn.k ? '#111827' : 'transparent',
              borderWidth: 1,
              borderColor: filter === btn.k ? '#6366f1' : '#1f2937',
            }}
          >
            <Text style={{ color: '#e5e7eb', fontSize: 12, fontWeight: '600' }}>{btn.label}</Text>
          </Pressable>
        ))}
      </View>

      {(!filteredTeams || filteredTeams.length === 0) && !loading ? (
        <Text style={{ color: colors.textSecondary }}>Henüz ekip yok</Text>
      ) : (
        <View>
          {filteredTeams.map(team => {
            const leaderUser = users.find(u => u.id === team.leaderId);
            const memberIds = Array.from(new Set([team.leaderId, ...(team.memberIds || [])].filter(Boolean)));
            const memberUsers = memberIds
              .map(id => users.find(u => u.id === id))
              .filter(Boolean);
            const visibleMembers = memberUsers.slice(0, 3);
            const extraCount = memberUsers.length > 3 ? memberUsers.length - 3 : 0;
            const activeTasksCount = 0; // placeholder

            return (
              <LinearGradient
                key={team.id}
                colors={["#1f1247", "#2d0f5f"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 20,
                  padding: 16,
                  marginBottom: 14,
                  borderWidth: 1,
                  borderColor: "#4c1d95",
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <Text style={{ color: "#f9fafb", fontSize: 16, fontWeight: "800" }}>{team.name}</Text>
                  <View style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: "#4b226b", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: "#e5e7eb", fontSize: 16 }}>⋮</Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: "#111827", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                    <Text style={{ color: "#e5e7eb", fontSize: 12, fontWeight: "700" }}>{leaderUser ? getInitials(leaderUser) : "?"}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ color: "#f9fafb", fontWeight: "600", marginRight: 8 }}>{leaderUser ? (leaderUser.name || leaderUser.email || leaderUser.uid) : "Lider yok"}</Text>
                    {leaderUser && (
                      <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: "#4c1d95" }}>
                        <Text style={{ color: "#e5e7eb", fontSize: 11, fontWeight: "600" }}>Leader</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={{ flexDirection: "row", marginBottom: 12 }}>
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "#251457",
                      borderRadius: 14,
                      paddingVertical: 8,
                      paddingHorizontal: 10,
                      marginRight: 8,
                    }}
                  >
                    <Text style={{ color: "#e5e7eb", fontSize: 11 }}>Members</Text>
                    <Text style={{ color: "#f9fafb", fontSize: 18, fontWeight: "800" }}>{memberIds.length}</Text>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "#251457",
                      borderRadius: 14,
                      paddingVertical: 8,
                      paddingHorizontal: 10,
                    }}
                  >
                    <Text style={{ color: "#e5e7eb", fontSize: 11 }}>Active Tasks</Text>
                    <Text style={{ color: "#f9fafb", fontSize: 18, fontWeight: "800" }}>{activeTasksCount}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                  {visibleMembers.map((u, idx) => (
                    <View
                      key={u.id}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        backgroundColor: "#111827",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: idx === visibleMembers.length - 1 ? 0 : -8,
                        borderWidth: 2,
                        borderColor: "#1f1247",
                      }}
                    >
                      <Text style={{ color: "#e5e7eb", fontSize: 11, fontWeight: "700" }}>{getInitials(u)}</Text>
                    </View>
                  ))}
                  {extraCount > 0 && (
                    <Text style={{ color: "#e5e7eb", marginLeft: 8, fontSize: 12, fontWeight: "600" }}>+{extraCount}</Text>
                  )}
                </View>

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Pressable
                    onPress={() => {
                      setSelectedTeam(team);
                      setDetailsOpen(true);
                      setLeaderDropdownOpen(false);
                    }}
                    style={{
                      flex: 1,
                      borderRadius: 999,
                      overflow: "hidden",
                      marginRight: 10,
                    }}
                  >
                    <LinearGradient
                      colors={["#ec4899", "#6366f1"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ paddingVertical: 10, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 }}
                    >
                      <Eye color="#f9fafb" size={16} />
                      <Text style={{ color: "#f9fafb", fontWeight: "700", fontSize: 13 }}>View Details</Text>
                    </LinearGradient>
                  </Pressable>

                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: "#4b226b",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#1e103a",
                    }}
                  >
                    <Pencil color="#e5e7eb" size={18} />
                  </View>
                </View>
              </LinearGradient>
            );
          })}
        </View>
      )}

      <Snackbar visible={!!error} onDismiss={()=>setError("")} duration={4000} style={{ backgroundColor: '#ef4444', marginTop: 12 }}>{error}</Snackbar>
      <Snackbar visible={!!success} onDismiss={()=>setSuccess("")} duration={3000} style={{ backgroundColor: '#22c55e', marginTop: 12 }}>{success}</Snackbar>

      <Portal>
        <Modal
          visible={createOpen}
          onDismiss={() => setCreateOpen(false)}
          contentContainerStyle={{ margin: 16, borderRadius: 16, backgroundColor: '#0b0d16', padding: 16, borderWidth: 1, borderColor: '#8b5cf6' }}
        >
          <Text style={{ color: '#f9fafb', fontSize: 16, fontWeight: '800', marginBottom: 8 }}>Yeni Ekip Oluştur</Text>
          <TextInput
            mode="outlined"
            placeholder="Ekip adı"
            value={name}
            onChangeText={setName}
            style={{ marginBottom: 12 }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
            <Button mode="text" onPress={() => { setCreateOpen(false); }}>İptal</Button>
            <Button mode="contained" onPress={handleCreate} loading={creating} disabled={creating}>Oluştur</Button>
          </View>
        </Modal>

        <Modal
          visible={!!selectedTeam && detailsOpen}
          onDismiss={() => { setDetailsOpen(false); setSelectedTeam(null); setLeaderDropdownOpen(false); }}
          contentContainerStyle={{ margin: 16, borderRadius: 18, backgroundColor: '#020617', padding: 16, borderWidth: 1, borderColor: '#4c1d95' }}
        >
          {selectedTeam && (
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: selectedTeam.color || '#8b5cf6', marginRight: 8 }} />
                  <Text style={{ color: '#f9fafb', fontSize: 16, fontWeight: '800' }}>{selectedTeam.name}</Text>
                </View>
              </View>

              <Text style={{ color: colors.textSecondary, marginBottom: 6 }}>Lider ata</Text>
              <Pressable
                onPress={() => setLeaderDropdownOpen(!leaderDropdownOpen)}
                style={{
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#4c1d95',
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  backgroundColor: '#020617',
                  marginBottom: 6,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: '#e5e7eb' }}>
                    {selectedTeam.leaderId ? (userMap[selectedTeam.leaderId] || selectedTeam.leaderId) : 'Lider seç'}
                  </Text>
                  <Text style={{ color: '#9ca3af', fontSize: 12 }}>{leaderDropdownOpen ? '▲' : '▼'}</Text>
                </View>
              </Pressable>
              {leaderDropdownOpen && (
                <View style={{ maxHeight: 180, borderRadius: 12, borderWidth: 1, borderColor: '#1f2937', marginBottom: 12 }}>
                  <ScrollView>
                    {users.map(u => (
                      <Pressable
                        key={u.id}
                        onPress={async () => {
                          await handleSetLeader(selectedTeam, u.id);
                          setLeaderDropdownOpen(false);
                        }}
                        style={{ paddingVertical: 10, paddingHorizontal: 12, backgroundColor: selectedTeam.leaderId === u.id ? '#111827' : 'transparent' }}
                      >
                        <Text style={{ color: '#e5e7eb' }}>{u.name || u.email || u.uid}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}

              <Text style={{ color: colors.textSecondary, marginBottom: 6 }}>Üyeler</Text>
              <View style={{ maxHeight: 200, borderRadius: 12, borderWidth: 1, borderColor: '#1f2937', marginBottom: 12 }}>
                <ScrollView>
                  {(() => {
                    const memberIdsInner = Array.from(new Set([selectedTeam.leaderId, ...(selectedTeam.memberIds || [])].filter(Boolean)));
                    return memberIdsInner.map(uid => (
                      <View
                        key={uid}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: '#111827',
                        }}
                      >
                        <Text style={{ color: uid === selectedTeam.leaderId ? '#22d3ee' : '#e5e7eb', fontWeight: uid === selectedTeam.leaderId ? '800' : '600' }}>
                          {userMap[uid] || uid}{uid === selectedTeam.leaderId ? ' (Lider)' : ''}
                        </Text>
                        {uid !== selectedTeam.leaderId && (
                          <Button mode="text" compact onPress={() => handleRemoveMember(selectedTeam, uid)}>
                            Çıkar
                          </Button>
                        )}
                      </View>
                    ));
                  })()}
                </ScrollView>
              </View>

              <Text style={{ color: colors.textSecondary, marginBottom: 6 }}>Üye ekle</Text>
              <View style={{ maxHeight: 200, borderRadius: 12, borderWidth: 1, borderColor: '#1f2937' }}>
                <ScrollView>
                  {users
                    .filter(u => !((selectedTeam.memberIds || []).includes(u.id)) && u.id !== selectedTeam.leaderId)
                    .map(u => (
                      <Pressable
                        key={u.id}
                        onPress={() => handleAddMember(selectedTeam, u.id)}
                        style={{ paddingVertical: 10, paddingHorizontal: 12 }}
                      >
                        <Text style={{ color: '#e5e7eb' }}>{u.name || u.email || u.uid}</Text>
                      </Pressable>
                    ))}
                </ScrollView>
              </View>
            </View>
          )}
        </Modal>
      </Portal>
    </ScrollView>
  );
}
