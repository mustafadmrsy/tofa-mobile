import React, { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { colors } from "../theme/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TextInput, SegmentedButtons } from "react-native-paper";
import NeonButton from "../components/NeonButton";

export default function CreateTask() {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [assignee, setAssignee] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState("medium");

  const outlineColor = '#2a2e3f';
  const activeOutlineColor = '#8b5cf6';
  const inputStyle = { backgroundColor: 'transparent', borderRadius: 14 };

  const handleSubmit = () => {
    // TODO: Firestore’a yazılacak; şimdilik sadece log
    console.log({ title, desc, assignee, due, priority });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, paddingBottom: 40 }}>
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800' }}>Görev Oluştur</Text>
        <Text style={{ color: '#9aa0a6', marginTop: 4 }}>Başlık, açıklama ve atama bilgilerini gir</Text>
      </View>

      <Text style={{ color: '#9aa0a6' }}>Başlık</Text>
      <TextInput
        mode="outlined"
        placeholder="Örn. Sunum hazırlığı"
        value={title}
        onChangeText={setTitle}
        style={[inputStyle, { marginTop: 6, marginBottom: 12 }]}
        outlineColor={outlineColor}
        activeOutlineColor={activeOutlineColor}
        textColor={'#e6e6e6'}
        placeholderTextColor={'#6b7280'}
      />

      <Text style={{ color: '#9aa0a6' }}>Açıklama</Text>
      <TextInput
        mode="outlined"
        placeholder="Görev detaylarını yazın"
        value={desc}
        onChangeText={setDesc}
        multiline
        numberOfLines={4}
        style={[inputStyle, { marginTop: 6, marginBottom: 12 }]}
        outlineColor={outlineColor}
        activeOutlineColor={activeOutlineColor}
        textColor={'#e6e6e6'}
        placeholderTextColor={'#6b7280'}
      />

      <Text style={{ color: '#9aa0a6' }}>Atanacak Kişi</Text>
      <TextInput
        mode="outlined"
        placeholder="Ekip üyesi adı"
        value={assignee}
        onChangeText={setAssignee}
        style={[inputStyle, { marginTop: 6, marginBottom: 12 }]}
        outlineColor={outlineColor}
        activeOutlineColor={activeOutlineColor}
        textColor={'#e6e6e6'}
        placeholderTextColor={'#6b7280'}
      />

      <Text style={{ color: '#9aa0a6' }}>Son Tarih</Text>
      <TextInput
        mode="outlined"
        placeholder="YYYY-MM-DD"
        value={due}
        onChangeText={setDue}
        style={[inputStyle, { marginTop: 6, marginBottom: 12 }]}
        outlineColor={outlineColor}
        activeOutlineColor={activeOutlineColor}
        textColor={'#e6e6e6'}
        placeholderTextColor={'#6b7280'}
      />

      <Text style={{ color: '#9aa0a6', marginBottom: 6 }}>Öncelik</Text>
      <SegmentedButtons
        value={priority}
        onValueChange={setPriority}
        buttons={[
          { value: 'low', label: 'Düşük' },
          { value: 'medium', label: 'Orta' },
          { value: 'high', label: 'Yüksek' },
        ]}
        style={{ marginBottom: 16 }}
      />

      <NeonButton title="Görevi Oluştur" onPress={handleSubmit} />
    </ScrollView>
  );
}
