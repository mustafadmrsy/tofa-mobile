import { showToast } from '@/components/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function LoginScreen() {
    const { colorScheme } = useTheme();
    const { signIn } = useAuth();
    const colors = Colors[colorScheme];

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const validate = () => {
        const newErrors: { email?: string; password?: string } = {};

        if (!email.trim()) {
            newErrors.email = 'E-posta adresi gerekli';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Geçerli bir e-posta adresi girin';
        }

        if (!password) {
            newErrors.password = 'Şifre gerekli';
        } else if (password.length < 6) {
            newErrors.password = 'Şifre en az 6 karakter olmalı';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            await signIn(email.trim(), password);
            // Navigation'u AuthProvider handle edecek
        } catch (error: any) {
            showToast.error(error.message || 'Giriş yapılamadı');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                style={{ backgroundColor: colors.background }}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>
                        Hoş Geldiniz
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Hesabınıza giriş yapın
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <Input
                        label="E-posta"
                        placeholder="ornek@email.com"
                        value={email}
                        onChangeText={(text) => {
                            setEmail(text);
                            setErrors({ ...errors, email: undefined });
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        leftIcon="mail-outline"
                        error={errors.email}
                    />

                    <Input
                        label="Şifre"
                        placeholder="••••••••"
                        value={password}
                        onChangeText={(text) => {
                            setPassword(text);
                            setErrors({ ...errors, password: undefined });
                        }}
                        secureTextEntry
                        autoComplete="password"
                        leftIcon="lock-closed-outline"
                        error={errors.password}
                    />

                    <Button
                        title="Giriş Yap"
                        onPress={handleLogin}
                        loading={loading}
                        fullWidth
                        variant="primary"
                        size="lg"
                        style={styles.loginButton}
                    />
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                        Hesabınız yok mu?{' '}
                    </Text>
                    <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                        <Text style={[styles.link, { color: colors.primary }]}>
                            Kayıt Olun
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing['4xl'],
        paddingBottom: Spacing['2xl'],
    },
    header: {
        marginBottom: Spacing['3xl'],
    },
    title: {
        fontSize: Typography.fontSize['3xl'],
        fontWeight: Typography.fontWeight.bold,
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: Typography.fontSize.lg,
    },
    form: {
        marginBottom: Spacing.xl,
    },
    loginButton: {
        marginTop: Spacing.md,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        fontSize: Typography.fontSize.base,
    },
    link: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semibold,
    },
});
