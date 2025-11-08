import React from "react";
import { View, Text } from "react-native";
import { colors } from "../theme/colors";

export default function Header({ title }) {
  return (
    <View className="py-4 px-5" style={{ backgroundColor: colors.card }}>
      <Text className="text-xl font-bold" style={{ color: colors.textPrimary }}>{title}</Text>
    </View>
  );
}
