import React from "react";
import { ScrollView, Text } from "react-native";
import { colors } from "../../theme/colors";

export default function SuperAdminDashboard() {
  return (
    <ScrollView className="flex-1" style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: 16 }}>
      <Text className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>Adminler</Text>
      <Text style={{ color: colors.textSecondary }}>Tüm adminleri ve ekiplerini görüntüleme alanı.</Text>
    </ScrollView>
  );
}
