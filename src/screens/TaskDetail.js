import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { colors } from "../theme/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function TaskDetail() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const task = route.params?.task || {};

  const statusColor = task.status === 'done' ? '#10b981' : task.status === 'in_progress' ? '#f59e0b' : '#3b82f6';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, paddingBottom: 40 }}>
      <Pressable onPress={() => navigation.goBack()} style={{ marginBottom: 12 }}>
        <Text style={{ color: '#9aa0a6' }}>{'< Geri'}</Text>
      </Pressable>

      <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800' }}>{task.title || 'Görev'}</Text>
      <View style={{ marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, borderColor: '#2a2e3f', backgroundColor: 'rgba(255,255,255,0.06)' }}>
        <Text style={{ color: statusColor, fontWeight: '700' }}>{task.status}</Text>
      </View>

      {!!task.description && (
        <Text style={{ color: '#e6e6e6', marginTop: 12 }}>{task.description}</Text>
      )}

      <View style={{ flexDirection: 'row', gap: 18, marginTop: 16 }}>
        {!!task.assignee && (
          <Text style={{ color: '#9aa0a6' }}>Atanan: <Text style={{ color: '#e6e6e6' }}>{task.assignee}</Text></Text>
        )}
        {!!task.due && (
          <Text style={{ color: '#9aa0a6' }}>Son Tarih: <Text style={{ color: '#e6e6e6' }}>{task.due}</Text></Text>
        )}
      </View>

      <View style={{ height: 1, backgroundColor: '#1f2233', marginVertical: 20 }} />

      <Text style={{ color: '#9aa0a6', marginBottom: 8 }}>Aktivite</Text>
      <View style={{ backgroundColor: '#121428', borderRadius: 14, borderWidth: 1, borderColor: '#1f2233', padding: 14 }}>
        <Text style={{ color: '#e6e6e6' }}>Henüz aktivite yok.</Text>
      </View>
    </ScrollView>
  );
}
