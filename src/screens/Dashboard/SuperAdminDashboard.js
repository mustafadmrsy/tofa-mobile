import React from "react";
import { ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../theme/colors";

export default function SuperAdminDashboard() {
  const NeonCard = ({ children, border = "#8b5cf6", bg = "#0b0d16" }) => (
    <View style={{ backgroundColor: bg, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: border, shadowColor: border, shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, marginBottom: 12 }}>
      {children}
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Başlık banner */}
      <LinearGradient colors={["#14122b", "#0b0d16"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#1f2233", marginBottom: 16 }}>
        <Text style={{ color: "#b39bff", fontSize: 12, letterSpacing: 1 }}>PANEL</Text>
        <Text style={{ color: "#e6e6e6", fontSize: 24, fontWeight: "900", marginTop: 6 }}>Süper Admin Dashboard</Text>
        <Text style={{ color: "#9aa0a6", marginTop: 4 }}>Kullanıcılar, takımlar ve görevler üzerinde tam yetki</Text>
      </LinearGradient>

      {/* Özet kartları */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
        <NeonCard border="#8b5cf6">
          <Text style={{ color: '#9aa0a6' }}>Kullanıcılar</Text>
          <Text style={{ color: '#22d3ee', fontSize: 22, fontWeight: '900', marginTop: 6 }}>—</Text>
        </NeonCard>
        <NeonCard border="#2a2e3f">
          <Text style={{ color: '#9aa0a6' }}>Takımlar</Text>
          <Text style={{ color: '#e6e6e6', fontSize: 22, fontWeight: '900', marginTop: 6 }}>—</Text>
        </NeonCard>
        <NeonCard border="#2a2e3f">
          <Text style={{ color: '#9aa0a6' }}>Görevler</Text>
          <Text style={{ color: '#22c55e', fontSize: 22, fontWeight: '900', marginTop: 6 }}>—</Text>
        </NeonCard>
      </View>

      <NeonCard border="#1f2233">
        <Text style={{ color: '#e6e6e6', fontWeight: '800' }}>Hızlı Bilgiler</Text>
        <Text style={{ color: '#9aa0a6', marginTop: 6 }}>Adminler, ekipler ve görevler için üst menüden ilgili sekmelere geçebilirsiniz.</Text>
      </NeonCard>
    </ScrollView>
  );
}
