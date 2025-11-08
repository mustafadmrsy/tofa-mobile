import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { colors } from "../theme/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getTask } from "../services/tasks";

export default function TaskDetail() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const passedTask = route.params?.task || null;
  const taskId = route.params?.taskId || passedTask?.id || null;
  const [task, setTask] = useState(passedTask || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (task || !taskId) return;
      setLoading(true);
      try {
        const t = await getTask(taskId);
        setTask(t || null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [taskId]);

  const status = task?.status || 'pending';
  const statusColor = status === 'done' ? '#10b981' : status === 'in_progress' ? '#f59e0b' : '#3b82f6';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, paddingBottom: 40 }}>
      <Pressable onPress={() => navigation.goBack()} style={{ marginBottom: 12 }}>
        <Text style={{ color: '#9aa0a6' }}>{'< Geri'}</Text>
      </Pressable>

      <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800' }}>{task?.title || 'Görev'}</Text>
      <View style={{ marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, borderColor: '#2a2e3f', backgroundColor: 'rgba(255,255,255,0.06)' }}>
        <Text style={{ color: statusColor, fontWeight: '700' }}>{status}</Text>
      </View>

      {loading && (
        <View style={{ marginTop: 16 }}>
          <ActivityIndicator color="#8b5cf6" />
        </View>
      )}

      {!!task?.description && (
        <Text style={{ color: '#e6e6e6', marginTop: 12 }}>{task.description}</Text>
      )}

      <View style={{ flexDirection: 'row', gap: 18, marginTop: 16 }}>
        {(!!task?.assignee || !!task?.assigneeId) ? (
          <Text style={{ color: '#9aa0a6' }}>Atanan: <Text style={{ color: '#e6e6e6' }}>{task.assignee || task.assigneeId}</Text></Text>
        ) : null}
        {(!!task?.due || !!task?.dueDate) ? (
          <Text style={{ color: '#9aa0a6' }}>Son Tarih: <Text style={{ color: '#e6e6e6' }}>{task.due ? task.due : (task.dueDate ? new Date(task.dueDate.seconds ? task.dueDate.seconds*1000 : task.dueDate).toLocaleDateString() : '-')}</Text></Text>
        ) : null}
      </View>

      <View style={{ height: 1, backgroundColor: '#1f2233', marginVertical: 20 }} />

      <Text style={{ color: '#9aa0a6', marginBottom: 8 }}>Aktivite</Text>
      <View style={{ backgroundColor: '#121428', borderRadius: 14, borderWidth: 1, borderColor: '#1f2233', padding: 14 }}>
        <Text style={{ color: '#e6e6e6' }}>Henüz aktivite yok.</Text>
      </View>
    </ScrollView>
  );
}
