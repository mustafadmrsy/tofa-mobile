import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { colors } from "../theme/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TextInput } from "react-native-paper";
import { UserPlus, User2 } from "lucide-react-native";
import NeonButton from "../components/NeonButton";

const dummyMembers = [
  { id: "1", name: "Ece Yılmaz", role: "worker" },
  { id: "2", name: "Ali Demir", role: "worker" },
  { id: "3", name: "Mert Kaya", role: "worker" },
];

function MemberItem({ name, role }) {
  const initials = name.split(" ").map(p => p[0]).slice(0,2).join("");
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: '#121428', borderWidth: 1, borderColor: '#1f2233', marginBottom: 10 }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#0d0f1a', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2a2e3f', marginRight: 12 }}>
        <Text style={{ color: '#e6e6e6', fontWeight: '700' }}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>{name}</Text>
        <Text style={{ color: '#9aa0a6', fontSize: 12 }}>{role === 'worker' ? 'Görevli' : role}</Text>
      </View>
      <Pressable style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderColor: '#2a2e3f', borderWidth: 1 }}>
        <Text style={{ color: '#e6e6e6' }}>Detay</Text>
      </Pressable>
    </View>
  );
}

export default function TeamManagement() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const filtered = dummyMembers.filter(m => m.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, paddingBottom: 40 }}>
      {/* Başlık ve CTA */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <View>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800' }}>Ekibim</Text>
          <Text style={{ color: '#9aa0a6', marginTop: 4 }}>Üyeleri görüntüle ve yönet</Text>
        </View>
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#0d0f1a', borderWidth: 1, borderColor: '#2a2e3f' }}>
          <UserPlus color="#e6e6e6" size={18} />
          <Text style={{ color: '#e6e6e6', fontWeight: '600' }}>Üye Ekle</Text>
        </Pressable>
      </View>

      {/* Arama */}
      <TextInput
        mode="outlined"
        placeholder="Üye ara"
        value={query}
        onChangeText={setQuery}
        left={<TextInput.Icon icon={() => <User2 color="#9aa0a6" size={18} />} />}
        style={{ backgroundColor: 'transparent', borderRadius: 14, marginBottom: 14 }}
        outlineColor={'#2a2e3f'}
        activeOutlineColor={'#8b5cf6'}
        textColor={'#e6e6e6'}
        placeholderTextColor={'#6b7280'}
      />

      {/* Üye listesi */}
      <View>
        {filtered.map(m => (
          <MemberItem key={m.id} name={m.name} role={m.role} />
        ))}
      </View>
    </ScrollView>
  );
}
