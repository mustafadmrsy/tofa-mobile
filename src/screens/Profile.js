import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { User2, Mail, Shield, Settings, LogOut } from "lucide-react-native";

export default function Profile() {
  const { user, role, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Kullanıcı";
  const email = user?.email || "demo@tofa.app";

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingTop: insets.top + 12, padding: 16, paddingBottom: 40 }}>
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: '#121428', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1f2233' }}>
          <User2 color="#e6e6e6" size={36} />
        </View>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 12 }}>{displayName}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}>
          <Mail color="#9aa0a6" size={16} />
          <Text style={{ color: '#9aa0a6' }}>{email}</Text>
        </View>
        <View style={{ marginTop: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: '#2a2e3f', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Shield color="#a855f7" size={14} />
          <Text style={{ color: '#a855f7', fontWeight: '700', fontSize: 12 }}>{role?.toUpperCase()}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <View style={{ flex: 1, backgroundColor: '#121428', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#1f2233' }}>
          <Text style={{ color: '#9aa0a6' }}>Tamamlanan</Text>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 6 }}>8</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#121428', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#1f2233' }}>
          <Text style={{ color: '#9aa0a6' }}>Aktif</Text>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 6 }}>4</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#121428', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#1f2233' }}>
          <Text style={{ color: '#9aa0a6' }}>Bekleyen</Text>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 6 }}>2</Text>
        </View>
      </View>

      <View style={{ backgroundColor: '#121428', borderRadius: 14, borderWidth: 1, borderColor: '#1f2233', overflow: 'hidden' }}>
        <Pressable style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2233', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: '#e6e6e6', fontWeight: '600' }}>Profili Düzenle</Text>
          <Settings color="#9aa0a6" size={18} />
        </Pressable>
        <Pressable style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2233', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: '#e6e6e6', fontWeight: '600' }}>Şifre Değiştir</Text>
          <Settings color="#9aa0a6" size={18} />
        </Pressable>
        <Pressable onPress={logout} style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: '#f87171', fontWeight: '700' }}>Çıkış Yap</Text>
          <LogOut color="#f87171" size={18} />
        </Pressable>
      </View>
    </ScrollView>
  );
}
