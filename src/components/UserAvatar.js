import React from "react";
import { View, Text } from "react-native";
import { colors } from "../theme/colors";

export default function UserAvatar({ name = "?" }) {
  const initials = name?.split(" ").map(s => s[0]).slice(0,2).join("")?.toUpperCase() || "?";
  return (
    <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary }}>
      <Text className="text-white font-bold">{initials}</Text>
    </View>
  );
}
