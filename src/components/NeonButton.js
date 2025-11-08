import React from "react";
import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function NeonButton({ title, onPress, loading, disabled, style }) {
  const isDisabled = disabled || loading;
  return (
    <View style={[{ borderRadius: 16, shadowColor: '#ff3bd4', shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 }, style]}>
      <Pressable onPress={onPress} disabled={isDisabled} style={{ borderRadius: 16, overflow: 'hidden' }}>
        <LinearGradient
          colors={["#ff3bd4", "#a855f7"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ paddingVertical: 14, alignItems: 'center', borderRadius: 16, opacity: isDisabled ? 0.7 : 1 }}
        >
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>{title}</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}
