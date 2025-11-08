import React from "react";
import { View, SafeAreaView, KeyboardAvoidingView, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function AuthContainer({ children }) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <LinearGradient
            colors={["#0b0d16", "#0f1121"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View style={{ flex: 1, justifyContent: "flex-start", paddingHorizontal: 16, paddingTop: 64 }}>
            <View style={{ width: "100%", maxWidth: 420, alignSelf: "center" }}>
              {children}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
