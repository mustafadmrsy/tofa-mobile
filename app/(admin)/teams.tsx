import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { CreateTeamModal } from '@/components/modals/CreateTeamModal';
import { TeamDetailModal } from '@/components/modals/TeamDetailModal';
import { Card } from '@/components/ui/Card';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { Animations, BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { getAllTeams, getUserById } from '@/services/firestoreService';
import { Team, User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    FlatList,
    RefreshControl,
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

export default function TeamsScreen() {
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    const [teams, setTeams] = useState<Team[]>([]);
    const [managers, setManagers] = useState<Map<string, User>>(new Map());
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const fadeAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        loadTeams();
    }, []);

    const loadTeams = async () => {
        try {
            const allTeams = await getAllTeams();
            setTeams(allTeams);

            // Load managers
            const managerMap = new Map<string, User>();
            for (const team of allTeams) {
                const manager = await getUserById(team.managerId);
                if (manager) {
                    managerMap.set(team.managerId, manager);
                }
            }
            setManagers(managerMap);

            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: Animations.duration.normal,
                useNativeDriver: true,
            }).start();
        } catch (error) {
            console.error('Load teams error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadTeams();
    };

    const renderTeamCard = ({ item }: { item: Team }) => {
        const manager = managers.get(item.managerId);

        return (
            <TouchableOpacity
                onPress={() => setSelectedTeam(item)}
                activeOpacity={0.7}
            >
                <Card style={styles.teamCard}>
                    <View style={styles.teamHeader}>
                        <View style={[styles.teamIconContainer, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons
                                name="people"
                                size={28}
                                color={colors.primary}
                            />
                        </View>
                        <View style={styles.teamInfo}>
                            <Text style={[styles.teamName, { color: colors.text }]}>
                                {item.name}
                            </Text>
                            <Text style={[styles.teamManager, { color: colors.textSecondary }]}>
                                👤 {manager?.name || 'Yükleniyor...'}
                            </Text>
                        </View>
                        <View style={styles.teamStats}>
                            <View style={[styles.memberBadge, { backgroundColor: colors.primary + '20' }]}>
                                <Ionicons name="people" size={16} color={colors.primary} />
                                <Text style={[styles.memberCount, { color: colors.primary }]}>
                                    {item.memberIds.length}
                                </Text>
                            </View>
                        </View>
                    </View>
                </Card>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return <LoadingSpinner fullScreen />;
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
                            <Text style={styles.headerTitle}>Ekipler</Text>
                            <Text style={styles.headerSubtitle}>
                                {teams.length} ekip
                            </Text>
                        </View>
                        <View style={styles.headerIcon}>
                            <Ionicons name="people-circle" size={32} color="#FFFFFF" />
                        </View>
                    </View>
                </View>
            </LinearGradient>

            {/* Team List */}
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                {teams.length === 0 ? (
                    <EmptyState
                        icon="people-circle-outline"
                        title="Henüz ekip yok"
                        message="Yeni bir ekip oluşturmak için + butonuna tıklayın"
                    />
                ) : (
                    <FlatList
                        data={teams}
                        renderItem={renderTeamCard}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={colors.primary}
                                colors={[colors.primary]}
                            />
                        }
                    />
                )}
            </Animated.View>

            {/* FAB */}
            <FloatingActionButton
                onPress={() => setCreateModalVisible(true)}
                icon="add"
            />

            {/* Create Team Modal */}
            <CreateTeamModal
                visible={createModalVisible}
                onClose={() => setCreateModalVisible(false)}
                onSuccess={loadTeams}
            />

            {/* Team Detail Modal */}
            <TeamDetailModal
                visible={selectedTeam !== null}
                team={selectedTeam}
                onClose={() => setSelectedTeam(null)}
                onDeleted={loadTeams}
                onUpdated={loadTeams}
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
    listContent: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: 100,
    },
    teamCard: {
        marginBottom: Spacing.md,
    },
    teamHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    teamIconContainer: {
        width: 56,
        height: 56,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    teamInfo: {
        flex: 1,
    },
    teamName: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        marginBottom: 4,
    },
    teamManager: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    teamStats: {
        alignItems: 'center',
    },
    memberBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        gap: 6,
    },
    memberCount: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.bold,
    },
});
