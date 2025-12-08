import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { showToast } from '@/components/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Animations, BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { addTeamMember, getAllUsers, getTeamById, getUsersByTeam, removeTeamMember } from '@/services/firestoreService';
import { Team, User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Animated,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const getHeaderGradient = (colorScheme: 'light' | 'dark'): readonly [string, string, string] => {
    if (colorScheme === 'dark') {
        return ['#1e3a5f', '#2d4a6f', '#1a2f4a'] as const;
    }
    return ['#0066CC', '#0052A3', '#003D7A'] as const;
};

export default function ManageTeamScreen() {
    const { colorScheme } = useTheme();
    const { user } = useAuth();
    const colors = Colors[colorScheme];

    const [team, setTeam] = useState<Team | null>(null);
    const [teamMembers, setTeamMembers] = useState<User[]>([]);
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddUser, setShowAddUser] = useState(false);
    const fadeAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        if (user?.teamId) {
            loadTeam();
        } else {
            setLoading(false);
        }
    }, [user?.teamId]);

    const loadTeam = async () => {
        if (!user?.teamId) return;

        try {
            const teamData = await getTeamById(user.teamId);
            setTeam(teamData);

            if (teamData) {
                const members = await getUsersByTeam(user.teamId);
                setTeamMembers(members);

                const allUsers = await getAllUsers();
                const available = allUsers.filter(
                    (u) => !teamData.memberIds.includes(u.id) && u.role === 'user'
                );
                setAvailableUsers(available);

                // Fade in animation
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: Animations.duration.normal,
                    useNativeDriver: true,
                }).start();
            }
        } catch (error) {
            console.error('Load team error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadTeam();
    };

    const handleAddMember = async (userId: string) => {
        if (!team) return;

        try {
            await addTeamMember(team.id, userId);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            showToast.success('Kullanıcı ekibe eklendi');
            setShowAddUser(false);
            loadTeam();
        } catch (error: any) {
            showToast.error(error.message || 'Kullanıcı eklenemedi');
        }
    };

    const handleRemoveMember = (member: User) => {
        if (!team) return;

        if (member.id === team.managerId) {
            showToast.warning('Ekip yöneticisi ekipten çıkarılamaz');
            return;
        }

        Alert.alert(
            'Üyeyi Çıkar',
            `${member.name} kişisini ekipten çıkarmak istediğinizden emin misiniz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Çıkar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await removeTeamMember(team.id, member.id);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            showToast.success('Kullanıcı ekipten çıkarıldı');
                            loadTeam();
                        } catch (error: any) {
                            showToast.error(error.message || 'Kullanıcı çıkarılamadı');
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    if (!user?.teamId || !team) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <EmptyState
                    icon="people-outline"
                    title="Bir ekibe dahil değilsiniz"
                    message="Ekip yönetimi için bir ekibe dahil olmanız gerekiyor"
                />
            </View>
        );
    }

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
                            <Text style={styles.headerTitle}>{team.name}</Text>
                            <Text style={styles.headerSubtitle}>
                                {teamMembers.length} üye
                            </Text>
                        </View>
                        <View style={styles.headerIcon}>
                            <Ionicons name="people" size={32} color="#FFFFFF" />
                        </View>
                    </View>
                </View>
            </LinearGradient>

            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                <ScrollView
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                        />
                    }
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Team Members Card */}
                    <Card>
                        <View style={styles.cardHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Ekip Üyeleri
                            </Text>
                            <Button
                                title={showAddUser ? "İptal" : "Üye Ekle"}
                                onPress={() => setShowAddUser(!showAddUser)}
                                variant={showAddUser ? "outline" : "primary"}
                                size="sm"
                            />
                        </View>

                        {teamMembers.map((member, index) => (
                            <View
                                key={member.id}
                                style={[
                                    styles.memberItem,
                                    index === teamMembers.length - 1 && styles.memberItemLast,
                                ]}
                            >
                                <View style={styles.memberIconContainer}>
                                    <View style={[styles.memberIcon, { backgroundColor: colors.primary + '20' }]}>
                                        <Ionicons name="person" size={20} color={colors.primary} />
                                    </View>
                                </View>
                                <View style={styles.memberInfo}>
                                    <Text style={[styles.memberName, { color: colors.text }]}>
                                        {member.name}
                                        {member.id === team.managerId && (
                                            <Text style={[styles.managerBadge, { color: colors.primary }]}> • Yönetici</Text>
                                        )}
                                    </Text>
                                    <Text style={[styles.memberEmail, { color: colors.textSecondary }]}>
                                        {member.email}
                                    </Text>
                                </View>
                                {member.id !== team.managerId && (
                                    <TouchableOpacity
                                        onPress={() => handleRemoveMember(member)}
                                        style={styles.removeButton}
                                        activeOpacity={0.6}
                                    >
                                        <Ionicons name="close-circle" size={28} color={colors.error} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </Card>

                    {/* Add User Section */}
                    {showAddUser && availableUsers.length > 0 && (
                        <Card>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Kullanıcı Ekle
                            </Text>
                            {availableUsers.map((availableUser, index) => (
                                <TouchableOpacity
                                    key={availableUser.id}
                                    style={[
                                        styles.availableUserItem,
                                        index === availableUsers.length - 1 && styles.availableUserItemLast,
                                    ]}
                                    onPress={() => handleAddMember(availableUser.id)}
                                    activeOpacity={0.6}
                                >
                                    <View style={styles.memberIconContainer}>
                                        <View style={[styles.memberIcon, { backgroundColor: colors.success + '20' }]}>
                                            <Ionicons name="person-add" size={20} color={colors.success} />
                                        </View>
                                    </View>
                                    <View style={styles.memberInfo}>
                                        <Text style={[styles.memberName, { color: colors.text }]}>
                                            {availableUser.name}
                                        </Text>
                                        <Text style={[styles.memberEmail, { color: colors.textSecondary }]}>
                                            {availableUser.email}
                                        </Text>
                                    </View>
                                    <Ionicons name="add-circle" size={28} color={colors.success} />
                                </TouchableOpacity>
                            ))}
                        </Card>
                    )}

                    {showAddUser && availableUsers.length === 0 && (
                        <EmptyState
                            icon="people-outline"
                            title="Eklenecek kullanıcı yok"
                            message="Tüm kullanıcılar zaten ekipte"
                        />
                    )}
                </ScrollView>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingBottom: Spacing.xl,
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
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    },
    memberItemLast: {
        borderBottomWidth: 0,
    },
    memberIconContainer: {
        marginRight: Spacing.md,
    },
    memberIcon: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: 4,
    },
    managerBadge: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.bold,
    },
    memberEmail: {
        fontSize: Typography.fontSize.sm,
    },
    removeButton: {
        padding: Spacing.xs,
    },
    availableUserItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    },
    availableUserItemLast: {
        borderBottomWidth: 0,
    },
});
