import React, { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { colors } from "../../theme/colors";
import TaskCard from "../../components/TaskCard";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const tasks = [
  { id: 't1', title: 'Form tasarımını güncelle', description: 'Login ekranındaki input stilleri', status: 'in_progress', assignee: 'Sen', due: 'Bugün' },
  { id: 't2', title: 'API testleri', description: 'Görev listesi endpointleri', status: 'pending', assignee: 'Sen', due: 'Yarın' },
  { id: 't3', title: 'Dokümantasyon', description: 'Readme ve kurulum notlarını güncelle', status: 'done', assignee: 'Sen', due: '3 gün' },
];

export default function WorkerDashboard({ navigation }) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('all');
  const filtered = tasks.filter(t => filter === 'all' ? true : (filter === 'active' ? t.status !== 'done' : t.status === 'done'));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, paddingBottom: 40 }}>
      {/* Başlık */}
      <View style={{ marginBottom: 12 }}>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800' }}>Görevlerim</Text>
        <Text style={{ color: '#9aa0a6', marginTop: 4 }}>Sana atanan görevlerin listesi</Text>
      </View>

      {/* Filtre butonları */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        {[
          { k: 'all', label: 'Tümü' },
          { k: 'active', label: 'Aktif' },
          { k: 'done', label: 'Bitti' },
        ].map(btn => (
          <Pressable key={btn.k} onPress={() => setFilter(btn.k)} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: filter === btn.k ? '#1b1e2f' : 'transparent', borderWidth: 1, borderColor: '#2a2e3f' }}>
            <Text style={{ color: '#e6e6e6', fontWeight: '600' }}>{btn.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Görev listesi */}
      <View style={{ gap: 12 }}>
        {filtered.map(t => (
          <TaskCard key={t.id} title={t.title} description={t.description} status={t.status} assignee={t.assignee} due={t.due} onPress={() => navigation.navigate('TaskDetail', { task: t })} />
        ))}
      </View>
    </ScrollView>
  );
}
