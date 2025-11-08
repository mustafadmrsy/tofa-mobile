import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { TextInput, Divider } from "react-native-paper";
import AuthContainer from "../components/AuthContainer";
import NeonButton from "../components/NeonButton";
import { Mail, Lock, Eye, EyeOff, Fingerprint, Smile } from "lucide-react-native";

export default function LoginScreen({ navigation }) {
  const { login, demoLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const inputStyle = { backgroundColor: 'transparent', borderRadius: 14 };
  const outlineColor = '#2a2e3f';
  const activeOutlineColor = '#8b5cf6';
  const placeholderColor = '#6b7280';

  const handleLogin = async () => {
    try {
      setSubmitting(true);
      setError("");
      await login(email.trim(), password);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthContainer>
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ color: '#fff', fontSize: 36, fontWeight: '800' }}>TofaHub</Text>
        <Text style={{ color: '#9aa0a6', marginTop: 6 }}>Welcome back</Text>
      </View>

      {!!error && (
        <Text style={{ color: colors.danger, marginBottom: 8 }}>{error}</Text>
      )}

      <View style={{ gap: 12, width: '100%', maxWidth: 420, alignSelf: 'center' }}>
        <Text style={{ color: '#9aa0a6', marginBottom: 4 }}>Email</Text>
        <TextInput
          mode="outlined"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={inputStyle}
          outlineColor={outlineColor}
          activeOutlineColor={activeOutlineColor}
          textColor={'#e6e6e6'}
          placeholderTextColor={placeholderColor}
          left={<TextInput.Icon icon={() => <Mail color="#9aa0a6" size={18} />} />}
        />

        <Text style={{ color: '#9aa0a6', marginTop: 8 }}>Password</Text>
        <TextInput
          mode="outlined"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          style={inputStyle}
          outlineColor={outlineColor}
          activeOutlineColor={activeOutlineColor}
          textColor={'#e6e6e6'}
          placeholderTextColor={placeholderColor}
          left={<TextInput.Icon icon={() => <Lock color="#9aa0a6" size={18} />} />}
          right={<TextInput.Icon onPress={() => setShowPassword((s)=>!s)} icon={() => showPassword ? <EyeOff color="#9aa0a6" size={18} /> : <Eye color="#9aa0a6" size={18} />} />}
        />

        <View style={{ alignItems: 'flex-end', marginTop: 6 }}>
          <Pressable onPress={async () => {
            try {
              setError('');
              if (!email) throw new Error('Enter your email first');
              // optional: useAuth.resetPassword
            } catch (e) {
              setError(e.message);
            }
          }}>
            <Text style={{ color: '#9aa0a6' }}>Forgot password?</Text>
          </Pressable>
        </View>

        <NeonButton title="Login" onPress={handleLogin} loading={submitting} disabled={submitting} style={{ marginTop: 8 }} />

        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: '#2b2f3e' }} />
          <Text style={{ color: '#6b7280', marginHorizontal: 12 }}>OR</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: '#2b2f3e' }} />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
          <Pressable onPress={() => demoLogin('worker')} style={{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#2a2e3f', backgroundColor: 'transparent' }}>
            <Text style={{ color: '#e6e6e6', fontWeight: '600' }}>Demo: Worker</Text>
          </Pressable>
          <Pressable onPress={() => demoLogin('admin')} style={{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#2a2e3f', backgroundColor: 'transparent' }}>
            <Text style={{ color: '#e6e6e6', fontWeight: '600' }}>Demo: Admin</Text>
          </Pressable>
        </View>

        <View style={{ alignItems: 'center', marginTop: 18 }}>
          <Text style={{ color: '#9aa0a6' }}>Don't have an account?</Text>
          <Pressable onPress={() => navigation.navigate('Register')}>
            <Text style={{ color: '#2DD4FD', marginTop: 4 }}>Create account</Text>
          </Pressable>
        </View>

        <View style={{ alignItems: 'center', marginTop: 18 }}>
          <Text style={{ color: '#6b7280' }}>By continuing, you agree to our</Text>
          <Text style={{ color: '#9aa0a6', marginTop: 4 }}>Terms • Privacy Policy</Text>
        </View>
      </View>
    </AuthContainer>
  );
}
