import React from "react";
import { View } from "react-native";
import { BlurView } from "expo-blur";

export default function GlassCard({ children, style }) {
  return (
    <View style={{ borderRadius: 20, overflow: 'hidden', alignSelf: 'center' }}>
      <BlurView intensity={40} tint="dark" style={{ padding: 20 }}>
        <View style={[{
          backgroundColor: 'rgba(255,255,255,0.06)',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          borderRadius: 20,
          padding: 16,
        }, style]}
        >
          {children}
        </View>
      </BlurView>
    </View>
  );
}
