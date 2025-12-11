import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card } from '@/components/ui/Card';
import { Animations, BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { getAllTeams, getAllUsers } from '@/services/firestoreService';
import { Team, User, UserRole } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const getHeaderGradient = (colorScheme: 'light' | 'dark'): readonly [string, string, string] => {
    if (colorScheme === 'dark') {
        return ['#1e3a5f', '#2d4a6f', '#1a2f4a'] as const;
    }
    return ['#0066CC', '#0052A3', '#003D7A'] as const;
};

export default function UsersScreen() {
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [teams, setTeams] = useState<Map<string, Team>>(new Map());
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState<string | null>(null);
    const fadeAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [searchQuery, filterRole, users]);

    const loadData = async () => {
        try {
            const [allUsers, allTeams] = await Promise.all([
                getAllUsers(),
                getAllTeams(),
            ]);

            setUsers(allUsers);

            // Create team map
            const teamMap = new Map<string, Team>();
            allTeams.forEach(team => teamMap.set(team.id, team));
            setTeams(teamMap);

            // Fade in animation
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: Animations.duration.normal,
                useNativeDriver: true,
            }).start();
        } catch (error) {
            console.error('Load data error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filterUsers = () => {
        let filtered = users;

        // Search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(user =>
                user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Role filter
        if (filterRole) {
            filtered = filtered.filter(user => user.role === filterRole);
        }

        setFilteredUsers(filtered);
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case UserRole.SUPER_ADMIN:
                return 'Süper Admin';
            case UserRole.TEAM_MANAGER:
                return 'Ekip Yöneticisi';
            case UserRole.USER:
                return 'Kullanıcı';
            default:
                return role;
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case UserRole.SUPER_ADMIN:
                return colors.error;
            case UserRole.TEAM_MANAGER:
                return colors.primary;
            case UserRole.USER:
                return colors.textSecondary;
            default:
                return colors.textSecondary;
        }
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
                            <Text style={styles.headerTitle}>Kullanıcılar</Text>
                            <Text style={styles.headerSubtitle}>
                                {filteredUsers.length} / {users.length} kullanıcı
                            </Text>
                        </View>
                        <View style={styles.headerIcon}>
                            <Ionicons name="people-circle" size={32} color="#FFFFFF" />
                        </View>
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <View style={[styles.searchBar, { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.3)' }]}>
                            <Ionicons name="search" size={20} color="#FFFFFF" />
                            <TextInput
                                style={[styles.searchInput, { color: '#FFFFFF' }]}
                                placeholder="Kullanıcı ara..."
                                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Role Filter */}
                    <View style={styles.filterContainer}>
                        {[
                            { label: 'Tümü', value: null },
                            { label: 'Admin', value: UserRole.SUPER_ADMIN },
                            { label: 'Yönetici', value: UserRole.TEAM_MANAGER },
                            { label: 'Kullanıcı', value: UserRole.USER },
                        ].map((filter) => (
                            <TouchableOpacity
                                key={filter.label}
                                style={[
                                    styles.filterChip,
                                    {
                                        backgroundColor: filterRole === filter.value ? '#FFFFFF' : 'rgba(255, 255, 255, 0.2)',
                                        borderColor: filterRole === filter.value ? '#FFFFFF' : 'rgba(255, 255, 255, 0.3)',
                                    },
                                ]}
                                onPress={() => setFilterRole(filter.value)}
                            >
                                <Text
                                    style={[
                                        styles.filterText,
                                        { color: filterRole === filter.value ? colors.primary : '#FFFFFF' },
                                    ]}
                                >
                                    {filter.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </LinearGradient>

            {/* User List */}
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                {filteredUsers.length === 0 ? (
                    <EmptyState
                        icon="people-outline"
                        title={searchQuery ? 'Kullanıcı bulunamadı' : 'Henüz kullanıcı yok'}
                        message={searchQuery ? 'Farklı bir arama terimi deneyin' : 'Sistemde henüz kullanıcı bulunmuyor'}
                    />
                ) : (
                    <FlatList
                        data={filteredUsers}
                        renderItem={({ item }) => (
                            <Card>
                                <View style={styles.userItem}>
                                    <View style={styles.userInfo}>
                                        <Text style={[styles.userName, { color: colors.text }]}>
                                            {item.name}
                                        </Text>
                                        <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                                            {item.email}
                                        </Text>
                                        <View style={styles.teamInfo}>
                                            <Ionicons
                                                name={item.teamId && teams.get(item.teamId) ? "people" : "people-outline"}
                                                size={14}
                                                color={item.teamId && teams.get(item.teamId) ? colors.primary : colors.textSecondary}
                                            />
                                            <Text style={[
                                                styles.teamText,
                                                {
                                                    color: item.teamId && teams.get(item.teamId) ? colors.primary : colors.textSecondary,
                                                    fontWeight: item.teamId && teams.get(item.teamId) ? '600' : '400'
                                                }
                                            ]}>
                                                {item.teamId && teams.get(item.teamId)
                                                    ? teams.get(item.teamId)?.name
                                                    : 'Ekip yok'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) + '20' }]}>
                                        <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
                                            {getRoleLabel(item.role)}
                                        </Text>
                                    </View>
                                </View>
                            </Card>
                        )}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={colors.primary}
                            />
                        }
                    />
                )}
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
    searchContainer: {
        marginTop: Spacing.lg,
        marginBottom: Spacing.md,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        fontSize: Typography.fontSize.base,
        paddingVertical: Spacing.xs,
    },
    filterContainer: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    content: {
        flex: 1,
    },
    filterChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    filterText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    listContent: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    userItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: 2,
    },
    userEmail: {
        fontSize: Typography.fontSize.sm,
        marginBottom: 4,
    },
    teamInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 6,
    },
    teamText: {
        fontSize: Typography.fontSize.sm,
    },
    roleBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: 4,
    },
    roleText: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.semibold,
    },
});
