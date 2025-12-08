import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card } from '@/components/ui/Card';
import { Animations, BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getTeamById, getUsersByTeam } from '@/services/firestoreService';
import { Team, User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Animated, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

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
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
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

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    if (!user?.teamId || !team) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <EmptyState
                    icon="people-outline"
                    title="Bir ekibe dahil değilsiniz"
                    message="Ekip bilgilerini görmek için bir ekibe dahil olmanız gerekiyor"
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
                    <Card>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Ekip Üyeleri
                        </Text>

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
                            </View>
                        ))}
                    </Card>
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
    sectionTitle: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        marginBottom: Spacing.md,
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
});
