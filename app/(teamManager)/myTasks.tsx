import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TaskDetailModal } from '@/components/modals/TaskDetailModal';
import { TaskCard } from '@/components/TaskCard';
import { Animations, BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getTasksByUser, subscribeToUserTasks } from '@/services/firestoreService';
import { Task, TaskStatus } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';

type FilterType = 'all' | 'active' | 'completed';

// Enhanced gradients for better dark mode support
const getHeaderGradient = (colorScheme: 'light' | 'dark'): readonly [string, string, string] => {
    if (colorScheme === 'dark') {
        // Softer, more harmonious dark mode gradient
        return ['#1e3a5f', '#2d4a6f', '#1a2f4a'] as const;
    }
    // Light mode gradient
    return ['#0066CC', '#0052A3', '#003D7A'] as const;
};

export default function MyTasksScreen() {
    const { colorScheme } = useTheme();
    const { user } = useAuth();
    const colors = Colors[colorScheme];

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [filter, setFilter] = useState<FilterType>('all');
    const fadeAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        if (user) {
            // Real-time listener
            const unsubscribe = subscribeToUserTasks(user.id, (updatedTasks) => {
                setTasks(updatedTasks);
                setLoading(false);

                // Fade in animation
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: Animations.duration.normal,
                    useNativeDriver: true,
                }).start();
            });

            return unsubscribe;
        }
    }, [user]);

    const loadTasks = async () => {
        if (!user) return;

        try {
            const userTasks = await getTasksByUser(user.id);
            setTasks(userTasks);
        } catch (error) {
            console.error('Load tasks error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadTasks();
    };

    const getFilteredTasks = () => {
        switch (filter) {
            case 'active':
                return tasks.filter(t => t.status !== TaskStatus.COMPLETED);
            case 'completed':
                return tasks.filter(t => t.status === TaskStatus.COMPLETED);
            default:
                return tasks;
        }
    };

    const filteredTasks = getFilteredTasks();
    const activeCount = tasks.filter(t => t.status !== TaskStatus.COMPLETED).length;
    const completedCount = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    const renderFilterChip = (type: FilterType, label: string, count: number) => {
        const isActive = filter === type;
        return (
            <View
                style={[
                    styles.filterChip,
                    isActive && styles.filterChipActive,
                    {
                        backgroundColor: isActive ? colors.primary : colors.backgroundSecondary,
                        borderColor: isActive ? colors.primary : colors.border,
                    },
                ]}
                onTouchEnd={() => setFilter(type)}
            >
                <Text
                    style={[
                        styles.filterChipText,
                        { color: isActive ? '#FFFFFF' : colors.textSecondary },
                        isActive && styles.filterChipTextActive,
                    ]}
                >
                    {label}
                </Text>
                <View
                    style={[
                        styles.filterBadge,
                        { backgroundColor: isActive ? '#FFFFFF20' : colors.border },
                    ]}
                >
                    <Text
                        style={[
                            styles.filterBadgeText,
                            { color: isActive ? '#FFFFFF' : colors.textTertiary },
                        ]}
                    >
                        {count}
                    </Text>
                </View>
            </View>
        );
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
                            <Text style={styles.headerTitle}>Görevlerim</Text>
                            <Text style={styles.headerSubtitle}>
                                {tasks.length} görev • {activeCount} aktif
                            </Text>
                        </View>
                        <View style={styles.headerIcon}>
                            <Ionicons name="checkbox-outline" size={32} color="#FFFFFF" />
                        </View>
                    </View>

                    {/* Filter Chips */}
                    <View style={styles.filterContainer}>
                        {renderFilterChip('all', 'Tümü', tasks.length)}
                        {renderFilterChip('active', 'Aktif', activeCount)}
                        {renderFilterChip('completed', 'Tamamlanan', completedCount)}
                    </View>
                </View>
            </LinearGradient>

            {/* Task List */}
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                {filteredTasks.length === 0 ? (
                    <EmptyState
                        icon={filter === 'completed' ? 'checkmark-done-circle-outline' : 'checkbox-outline'}
                        title={
                            filter === 'completed'
                                ? 'Henüz tamamlanan görev yok'
                                : 'Henüz görev yok'
                        }
                        message={
                            filter === 'completed'
                                ? 'Görevleri tamamladıkça burada görünecekler'
                                : 'Size henüz bir görev atanmamış'
                        }
                    />
                ) : (
                    <FlatList
                        data={filteredTasks}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item, index }) => (
                            <Animated.View
                                style={{
                                    opacity: fadeAnim,
                                    transform: [
                                        {
                                            translateY: fadeAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [50, 0],
                                            }),
                                        },
                                    ],
                                }}
                            >
                                <TaskCard task={item} onPress={() => setSelectedTask(item)} />
                            </Animated.View>
                        )}
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

            {/* Task Detail Modal */}
            <TaskDetailModal
                visible={selectedTask !== null}
                task={selectedTask}
                onClose={() => setSelectedTask(null)}
                onUpdated={onRefresh}
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
        marginBottom: Spacing.lg,
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
    filterContainer: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        gap: Spacing.xs,
    },
    filterChipActive: {
        // Active state styling applied inline
    },
    filterChipText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
    },
    filterChipTextActive: {
        fontWeight: Typography.fontWeight.bold,
    },
    filterBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
        minWidth: 24,
        alignItems: 'center',
    },
    filterBadgeText: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.bold,
    },
    content: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
});
