import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const getHeaderGradient = (colorScheme: 'light' | 'dark'): readonly [string, string, string] => {
    if (colorScheme === 'dark') {
        return ['#1e3a5f', '#2d4a6f', '#1a2f4a'] as const;
    }
    return ['#0066CC', '#0052A3', '#003D7A'] as const;
};

export default function ProfileScreen() {
    const { colorScheme } = useTheme();
    const { user, signOut } = useAuth();
    const colors = Colors[colorScheme];
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleSignOut = async () => {
        setShowLogoutConfirm(true);
    };

    const confirmSignOut = async () => {
        try {
            await signOut();
        } catch (error: any) {
            console.error('Logout error:', error);
        }
        setShowLogoutConfirm(false);
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

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'super_admin':
                return colors.error;
            case 'team_manager':
                return colors.primary;
            case 'user':
                return colors.success;
            default:
                return colors.textSecondary;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Premium Gradient Header */}
            <LinearGradient
                colors={getHeaderGradient(colorScheme)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.headerTitle}>Profil</Text>
                            <Text style={styles.headerSubtitle}>
                                {getRoleLabel(user?.role || '')}
                            </Text>
                        </View>
                        <View style={styles.headerIcon}>
                            <Ionicons name="person" size={32} color="#FFFFFF" />
                        </View>
                    </View>

                    {/* User Avatar Section */}
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatar}>
                                <Ionicons name="person" size={40} color="#FFFFFF" />
                            </View>
                        </View>
                        <Text style={styles.userName}>{user?.name}</Text>
                        <Text style={styles.userEmail}>{user?.email}</Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* User Info Card */}
                <Card>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="information-circle" size={24} color={colors.primary} />
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Kullanıcı Bilgileri
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.infoIconContainer}>
                            <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>İsim</Text>
                            <Text style={[styles.value, { color: colors.text }]}>{user?.name}</Text>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View style={styles.infoRow}>
                        <View style={styles.infoIconContainer}>
                            <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>E-posta</Text>
                            <Text style={[styles.value, { color: colors.text }]}>{user?.email}</Text>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View style={styles.infoRow}>
                        <View style={styles.infoIconContainer}>
                            <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Rol</Text>
                            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user?.role || '') + '20' }]}>
                                <Text style={[styles.roleBadgeText, { color: getRoleColor(user?.role || '') }]}>
                                    {getRoleLabel(user?.role || '')}
                                </Text>
                            </View>
                        </View>
                    </View>
                </Card>

                {/* Settings Card */}
                <Card>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="settings" size={24} color={colors.primary} />
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Ayarlar
                        </Text>
                    </View>

                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="moon-outline" size={20} color={colors.textSecondary} />
                            <Text style={[styles.settingLabel, { color: colors.text }]}>Tema</Text>
                        </View>
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
            </ScrollView>

            {/* Logout Confirmation Modal */}
            <ConfirmationModal
                visible={showLogoutConfirm}
                title="Çıkış Yap"
                message="Çıkış yapmak istediğinizden emin misiniz?"
                confirmText="Çıkış Yap"
                cancelText="İptal"
                onConfirm={confirmSignOut}
                onCancel={() => setShowLogoutConfirm(false)}
                type="warning"
                icon="log-out-outline"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingBottom: Spacing.md,
        borderBottomLeftRadius: BorderRadius['2xl'],
        borderBottomRightRadius: BorderRadius['2xl'],
    },
    headerContent: {
        paddingHorizontal: Spacing.lg,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.md,
    },
    headerTitle: {
        fontSize: Typography.fontSize['3xl'],
        fontWeight: Typography.fontWeight.bold,
        color: '#FFFFFF',
        marginBottom: Spacing.xs,
    },
    headerSubtitle: {
        fontSize: Typography.fontSize.base,
        color: '#FFFFFF',
        opacity: 0.9,
        fontWeight: Typography.fontWeight.medium,
    },
    headerIcon: {
        width: 56,
        height: 56,
        borderRadius: BorderRadius.full,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarSection: {
        alignItems: 'center',
        paddingBottom: Spacing.md,
    },
    avatarContainer: {
        marginBottom: Spacing.sm,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: BorderRadius.full,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    userName: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        color: '#FFFFFF',
        marginBottom: 2,
    },
    userEmail: {
        fontSize: Typography.fontSize.sm,
        color: '#FFFFFF',
        opacity: 0.8,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
    },
    infoIconContainer: {
        width: 40,
        alignItems: 'center',
        marginRight: Spacing.sm,
    },
    infoContent: {
        flex: 1,
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
        marginLeft: 40 + Spacing.sm, // Align with content after icon
    },
    roleBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
        marginTop: Spacing.xs,
    },
    roleBadgeText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    settingLabel: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.medium,
    },
    signOutButton: {
        marginTop: Spacing.lg,
    },
});
