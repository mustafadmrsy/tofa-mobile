import { showToast } from '@/components/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const getHeaderGradient = (colorScheme: 'light' | 'dark'): readonly [string, string, string] => {
    if (colorScheme === 'dark') {
        return ['#1e3a5f', '#2d4a6f', '#1a2f4a'] as const;
    }
    return ['#0066CC', '#0052A3', '#003D7A'] as const;
};

export default function RegisterScreen() {
    const { colorScheme } = useTheme();
    const { signUp } = useAuth();
    const colors = Colors[colorScheme];
    const insets = useSafeAreaInsets();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{
        name?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
    }>({});

    const validate = () => {
        const newErrors: typeof errors = {};

        if (!name.trim()) {
            newErrors.name = 'İsim gerekli';
        } else if (name.trim().length < 2) {
            newErrors.name = 'İsim en az 2 karakter olmalı';
        }

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

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Şifre tekrarı gerekli';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Şifreler eşleşmiyor';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            await signUp(email.trim(), password, name.trim());
            // Navigation'u AuthProvider handle edecek
        } catch (error: any) {
            showToast.error(error.message || 'Kayıt olunamadı');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Premium Gradient Header */}
            <LinearGradient
                colors={getHeaderGradient(colorScheme)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.gradientHeader, { paddingTop: insets.top + Spacing.lg }]}
            >
                <View style={styles.headerContent}>
                    <View style={styles.appIconContainer}>
                        <View style={styles.appIcon}>
                            <Ionicons name="person-add" size={40} color="#FFFFFF" />
                        </View>
                    </View>
                    <Text style={styles.welcomeTitle}>Hesap Oluştur</Text>
                    <Text style={styles.welcomeSubtitle}>Yeni bir hesap oluşturun</Text>
                </View>
            </LinearGradient>

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xl }]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Form */}
                    <View style={styles.form}>
                        <Input
                            label="İsim Soyisim"
                            placeholder="Adınız Soyadınız"
                            value={name}
                            onChangeText={(text) => {
                                setName(text);
                                setErrors({ ...errors, name: undefined });
                            }}
                            autoCapitalize="words"
                            leftIcon="person-outline"
                            error={errors.name}
                        />

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
                            autoComplete="password-new"
                            leftIcon="lock-closed-outline"
                            error={errors.password}
                        />

                        <Input
                            label="Şifre Tekrar"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChangeText={(text) => {
                                setConfirmPassword(text);
                                setErrors({ ...errors, confirmPassword: undefined });
                            }}
                            secureTextEntry
                            autoComplete="password-new"
                            leftIcon="lock-closed-outline"
                            error={errors.confirmPassword}
                        />

                        <Button
                            title="Kayıt Ol"
                            onPress={handleRegister}
                            loading={loading}
                            fullWidth
                            variant="primary"
                            size="lg"
                            style={styles.registerButton}
                        />
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                            Zaten hesabınız var mı?{' '}
                        </Text>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text style={[styles.link, { color: colors.primary }]}>
                                Giriş Yapın
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradientHeader: {
        paddingBottom: Spacing.xl,
        borderBottomLeftRadius: BorderRadius['2xl'],
        borderBottomRightRadius: BorderRadius['2xl'],
    },
    headerContent: {
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
    },
    appIconContainer: {
        marginBottom: Spacing.lg,
    },
    appIcon: {
        width: 80,
        height: 80,
        borderRadius: BorderRadius.full,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    welcomeTitle: {
        fontSize: Typography.fontSize['3xl'],
        fontWeight: Typography.fontWeight.bold,
        color: '#FFFFFF',
        marginBottom: Spacing.xs,
    },
    welcomeSubtitle: {
        fontSize: Typography.fontSize.base,
        color: '#FFFFFF',
        opacity: 0.9,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
    },
    form: {
        marginBottom: Spacing.xl,
    },
    registerButton: {
        marginTop: Spacing.md,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 'auto',
        paddingTop: Spacing.xl,
    },
    footerText: {
        fontSize: Typography.fontSize.base,
    },
    link: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semibold,
    },
});
