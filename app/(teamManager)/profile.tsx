import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

export default function ProfileScreen() {
    const { colorScheme } = useTheme();
    const { user, signOut } = useAuth();
    const colors = Colors[colorScheme];

    const handleSignOut = async () => {
        Alert.alert(
            'Çıkış Yap',
            'Çıkış yapmak istediğinizden emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Çıkış Yap',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut();
                        } catch (error: any) {
                            Alert.alert('Hata', error.message || 'Çıkış yapılamadı');
                        }
                    },
                },
            ]
        );
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'super_admin':
                return 'Süper Admin';
            case 'team_manager':
                return 'Ekip Yöneticisi';
            case 'user':
                return 'Kullanıcı';
            default:
                return role;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Profil</Text>
            </View>

            {/* User Info Card */}
            <Card>
                <View style={styles.infoRow}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>İsim</Text>
                    <Text style={[styles.value, { color: colors.text }]}>{user?.name}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.infoRow}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>E-posta</Text>
                    <Text style={[styles.value, { color: colors.text }]}>{user?.email}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.infoRow}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Rol</Text>
                    <Text style={[styles.value, { color: colors.primary }]}>
                        {getRoleLabel(user?.role || '')}
                    </Text>
                </View>
            </Card>

            {/* Theme Toggle */}
            <Card>
                <View style={styles.settingRow}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>Tema</Text>
                    <ThemeToggle />
                </View>
            </Card>

            {/* Sign Out Button */}
            <Button
                title="Çıkış Yap"
                onPress={handleSignOut}
                variant="outline"
                fullWidth
                style={styles.signOutButton}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
    },
    header: {
        paddingVertical: Spacing.xl,
    },
    title: {
        fontSize: Typography.fontSize['2xl'],
        fontWeight: Typography.fontWeight.bold,
    },
    infoRow: {
        paddingVertical: Spacing.md,
    },
    label: {
        fontSize: Typography.fontSize.sm,
        marginBottom: Spacing.xs,
    },
    value: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.medium,
    },
    divider: {
        height: 1,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    settingLabel: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.medium,
    },
    signOutButton: {
        marginTop: Spacing.xl,
    },
});
