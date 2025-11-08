import React from "react";
import { View, Text } from "react-native";
import { colors } from "../theme/colors";

export default function TaskDetails() {
  return (
    <View className="flex-1 p-4" style={{ backgroundColor: colors.background }}>
      <Text className="text-xl font-bold" style={{ color: colors.textPrimary }}>Görev Detayı</Text>
      <Text style={{ color: colors.textSecondary }} className="mt-2">Detay içerikleri burada yer alacak.</Text>
    </View>
  );
}
