import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { TextInput, SegmentedButtons } from "react-native-paper";
import AuthContainer from "../components/AuthContainer";
import NeonButton from "../components/NeonButton";
import { Mail, Lock, User as UserIcon, Eye, EyeOff } from "lucide-react-native";

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("worker");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    try {
      setSubmitting(true);
      setError("");
      await register(name.trim(), email.trim(), password, role);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthContainer>
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <Text style={{ color: '#fff', fontSize: 36, fontWeight: '800' }}>TofaHub</Text>
        <Text style={{ color: '#9aa0a6', marginTop: 6 }}>Create your account</Text>
      </View>

      {!!error && (
        <Text style={{ color: colors.danger, marginBottom: 8 }}>{error}</Text>
      )}

      <View style={{ gap: 12 }}>
        <Text style={{ color: '#9aa0a6', marginBottom: 4 }}>Name</Text>
        <TextInput
          mode="outlined"
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
          outlineColor={'#33384a'}
          activeOutlineColor={'#6741ff'}
          textColor={'#e6e6e6'}
          left={<TextInput.Icon icon={() => <UserIcon color="#9aa0a6" size={18} />} />}
        />

        <Text style={{ color: '#9aa0a6', marginBottom: 4, marginTop: 4 }}>Email</Text>
        <TextInput
          mode="outlined"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          outlineColor={'#33384a'}
          activeOutlineColor={'#6741ff'}
          textColor={'#e6e6e6'}
          left={<TextInput.Icon icon={() => <Mail color="#9aa0a6" size={18} />} />}
        />

        <Text style={{ color: '#9aa0a6', marginTop: 8 }}>Password</Text>
        <TextInput
          mode="outlined"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          outlineColor={'#33384a'}
          activeOutlineColor={'#6741ff'}
          textColor={'#e6e6e6'}
          left={<TextInput.Icon icon={() => <Lock color="#9aa0a6" size={18} />} />}
          right={<TextInput.Icon onPress={() => setShowPassword((s)=>!s)} icon={() => showPassword ? <EyeOff color="#9aa0a6" size={18} /> : <Eye color="#9aa0a6" size={18} />} />}
        />

        <SegmentedButtons
          value={role}
          onValueChange={setRole}
          buttons={[
            { value: "worker", label: "Görevli" },
            { value: "admin", label: "Admin" },
          ]}
          style={{ marginTop: 12 }}
        />

        <NeonButton title="Create account" onPress={handleRegister} loading={submitting} disabled={submitting} style={{ marginTop: 16 }} />

        <View style={{ alignItems: 'center', marginTop: 18 }}>
          <Text style={{ color: '#9aa0a6' }}>Already have an account?</Text>
          <Pressable onPress={() => navigation.navigate('Login')}>
            <Text style={{ color: '#2DD4FD', marginTop: 4 }}>Login</Text>
          </Pressable>
        </View>
      </View>
    </AuthContainer>
  );
}
