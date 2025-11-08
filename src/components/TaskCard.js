import React from "react";
import { View, Text, Pressable } from "react-native";
import { colors } from "../theme/colors";

const statusMap = {
  in_progress: { label: "In Progress", color: "#f59e0b" },
  pending: { label: "Pending", color: "#3b82f6" },
  done: { label: "Done", color: "#10b981" },
  default: { label: "Task", color: colors.primary },
};

export default function TaskCard({ title, description, status, assignee, due, onPress }) {
  const meta = statusMap[status] || statusMap.default;
  return (
    <Pressable onPress={onPress} style={{ marginBottom: 12 }}>
      <View style={{ backgroundColor: "#121428", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#1f2233" }}>
        {/* Üst satır: başlık + durum etiketi */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }} numberOfLines={1}>{title}</Text>
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "#2a2e3f" }}>
            <Text style={{ color: meta.color, fontWeight: '600', fontSize: 12 }}>{meta.label}</Text>
          </View>
        </View>

        {!!description && (
          <Text style={{ color: colors.textSecondary, marginTop: 6 }} numberOfLines={2}>{description}</Text>
        )}

        {(assignee || due) && (
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
            {!!assignee && <Text style={{ color: '#9aa0a6', fontSize: 12 }}>Atanan: <Text style={{ color: '#e6e6e6' }}>{assignee}</Text></Text>}
            {!!due && <Text style={{ color: '#9aa0a6', fontSize: 12 }}>Son Tarih: <Text style={{ color: '#e6e6e6' }}>{due}</Text></Text>}
          </View>
        )}
      </View>
    </Pressable>
  );
}
