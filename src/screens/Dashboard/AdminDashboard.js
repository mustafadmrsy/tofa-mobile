import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { colors } from "../../theme/colors";
import TaskCard from "../../components/TaskCard";
import { PlusCircle, Users } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AdminDashboard({ navigation }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, paddingBottom: 40 }}>
      {/* Başlık */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: "#fff", fontSize: 28, fontWeight: "800" }}>Admin Dashboard</Text>
        <Text style={{ color: "#9aa0a6", marginTop: 4 }}>Takımını ve görevlerini yönet</Text>
      </View>

      {/* İstatistik kutuları */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
        <View style={{ flex: 1, backgroundColor: "#121428", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#1f2233" }}>
          <Text style={{ color: "#9aa0a6" }}>Toplam Görev</Text>
          <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 6 }}>12</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: "#121428", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#1f2233" }}>
          <Text style={{ color: "#9aa0a6" }}>Aktif</Text>
          <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 6 }}>4</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: "#121428", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#1f2233" }}>
          <Text style={{ color: "#9aa0a6" }}>Tamamlandı</Text>
          <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 6 }}>8</Text>
        </View>
      </View>

      {/* Hızlı aksiyonlar */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
        <Pressable onPress={() => navigation.navigate("Görev Oluştur")} style={{ flex: 1, backgroundColor: "#0d0f1a", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#2a2e3f", alignItems: "center", justifyContent: "center" }}>
          <PlusCircle color="#e6e6e6" />
          <Text style={{ color: "#e6e6e6", marginTop: 8, fontWeight: "600" }}>Görev Oluştur</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate("Ekibim")} style={{ flex: 1, backgroundColor: "#0d0f1a", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#2a2e3f", alignItems: "center", justifyContent: "center" }}>
          <Users color="#e6e6e6" />
          <Text style={{ color: "#e6e6e6", marginTop: 8, fontWeight: "600" }}>Ekibi Yönet</Text>
        </Pressable>
      </View>

      {/* Görev Listesi */}
      <Text style={{ color: "#9aa0a6", marginBottom: 8 }}>Son Görevler</Text>
      <View style={{ gap: 12 }}>
        <TaskCard title="Toplantı sunumu" description="Yarınki kickoff için slaytları güncelle" status="in_progress" assignee="Me" due="Yarın" />
        <TaskCard title="API Testleri" description="Yeni endpointleri Postman ile test et" status="pending" assignee="Ece" due="Bugün" />
        <TaskCard title="Rapor" description="Haftalık raporları PDF olarak yükle" status="done" assignee="Ali" due="2 gün" />
      </View>
    </ScrollView>
  );
}
