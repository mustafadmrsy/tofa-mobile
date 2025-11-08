import React from "react";
import { ActivityIndicator, View } from "react-native";
import { colors } from "../theme/colors";

export default function Loader() {
  return (
    <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}
