import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card } from '@/components/ui/Card';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { getAllTeams, getAllUsers } from '@/services/firestoreService';
import { Team, User, UserRole } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

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
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Kullanıcılar</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {filteredUsers.length} / {users.length} kullanıcı
                </Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Ionicons name="search" size={20} color={colors.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Kullanıcı ara..."
                        placeholderTextColor={colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
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
                                backgroundColor: filterRole === filter.value ? colors.primary : colors.card,
                                borderColor: filterRole === filter.value ? colors.primary : colors.border,
                            },
                        ]}
                        onPress={() => setFilterRole(filter.value)}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                { color: filterRole === filter.value ? '#fff' : colors.text },
                            ]}
                        >
                            {filter.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* User List */}
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
                                    {item.teamId && teams.get(item.teamId) && (
                                        <View style={styles.teamInfo}>
                                            <Ionicons name="people" size={12} color={colors.textSecondary} />
                                            <Text style={[styles.teamText, { color: colors.textSecondary }]}>
                                                {teams.get(item.teamId)?.name}
                                            </Text>
                                        </View>
                                    )}
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.md,
    },
    title: {
        fontSize: Typography.fontSize['2xl'],
        fontWeight: Typography.fontWeight.bold,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: Typography.fontSize.base,
    },
    searchContainer: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
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
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
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
        gap: 4,
        marginTop: 2,
    },
    teamText: {
        fontSize: Typography.fontSize.xs,
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
