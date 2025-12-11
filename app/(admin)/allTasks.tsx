import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { CreateTaskModal } from '@/components/modals/CreateTaskModal';
import { TaskDetailModal } from '@/components/modals/TaskDetailModal';
import { TaskCard } from '@/components/TaskCard';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { Animations, BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getAllTasks, getAllTeams, getUserById } from '@/services/firestoreService';
import { Task, TaskStatus, Team } from '@/types';
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

export default function AllTasksScreen() {
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    const [tasks, setTasks] = useState<Task[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [assigneeMap, setAssigneeMap] = useState<Map<string, string>>(new Map());
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<TaskStatus | null>(null);
    const fadeAnim = useState(new Animated.Value(0))[0];
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        loadTasks();
        loadTeams();
    }, []);

    useEffect(() => {
        filterTasks();
    }, [searchQuery, filterStatus, tasks]);

    const loadTasks = async () => {
        try {
            const tasksData = await getAllTasks();

            // Otomatik overdue işaretleme
            const tasksWithOverdue = tasksData.map(task => {
                const isOverdue = task.status !== TaskStatus.COMPLETED &&
                    task.dueDate < new Date();
                return {
                    ...task,
                    status: isOverdue ? TaskStatus.OVERDUE : task.status
                };
            });

            setTasks(tasksWithOverdue);

            // Load assignee names
            const assignees = new Map<string, string>();
            for (const task of tasksWithOverdue) {
                if (!assignees.has(task.assignedTo)) {
                    try {
                        const assignee = await getUserById(task.assignedTo);
                        if (assignee) {
                            assignees.set(task.assignedTo, assignee.name);
                        }
                    } catch (error) {
                        console.error('Get user error:', error);
                    }
                }
            }
            setAssigneeMap(assignees);

            // Start fade-in animation
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: Animations.duration.normal,
                useNativeDriver: true,
            }).start();
        } catch (error) {
            console.error('Load tasks error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filterTasks = () => {
        let filtered = tasks;

        // Search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(task =>
                task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                assigneeMap.get(task.assignedTo)?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Status filter
        if (filterStatus) {
            filtered = filtered.filter(task => task.status === filterStatus);
        }

        setFilteredTasks(filtered);
    };

    const loadTeams = async () => {
        try {
            const teamsData = await getAllTeams();
            setTeams(teamsData);
            if (teamsData.length > 0) {
                setSelectedTeam(teamsData[0]); // İlk ekibi varsayılan olarak seç
            }
        } catch (error) {
            console.error('Load teams error:', error);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadTasks();
    };

    const getStatusLabel = (status: TaskStatus) => {
        switch (status) {
            case TaskStatus.TODO:
                return 'Yapılacak';
            case TaskStatus.IN_PROGRESS:
                return 'Devam Ediyor';
            case TaskStatus.COMPLETED:
                return 'Tamamlandı';
            default:
                return status;
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
                            <Text style={styles.headerTitle}>Tüm Görevler</Text>
                            <Text style={styles.headerSubtitle}>
                                {filteredTasks.length} / {tasks.length} görev
                            </Text>
                        </View>
                        <View style={styles.headerIcon}>
                            <Ionicons name="clipboard" size={32} color="#FFFFFF" />
                        </View>
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <View style={[styles.searchBar, { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.3)' }]}>
                            <Ionicons name="search" size={20} color="#FFFFFF" />
                            <TextInput
                                style={[styles.searchInput, { color: '#FFFFFF' }]}
                                placeholder="Görev ara..."
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

                    {/* Status Filter */}
                    <View style={styles.filterContainer}>
                        {[
                            { label: 'Tümü', value: null },
                            { label: 'Yapılacak', value: TaskStatus.TODO },
                            { label: 'Devam Ediyor', value: TaskStatus.IN_PROGRESS },
                            { label: 'Tamamlandı', value: TaskStatus.COMPLETED },
                            { label: 'Tarihi Geçmişler', value: TaskStatus.OVERDUE },
                        ].map((filter) => (
                            <TouchableOpacity
                                key={filter.label}
                                style={[
                                    styles.filterChip,
                                    {
                                        backgroundColor: filterStatus === filter.value ? '#FFFFFF' : 'rgba(255, 255, 255, 0.2)',
                                        borderColor: filterStatus === filter.value ? '#FFFFFF' : 'rgba(255, 255, 255, 0.3)',
                                    },
                                ]}
                                onPress={() => setFilterStatus(filter.value)}
                            >
                                <Text
                                    style={[
                                        styles.filterText,
                                        { color: filterStatus === filter.value ? colors.primary : '#FFFFFF' },
                                    ]}
                                >
                                    {filter.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </LinearGradient>

            {/* Task List */}
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                {filteredTasks.length === 0 ? (
                    <EmptyState
                        icon="checkbox-outline"
                        title={searchQuery ? 'Görev bulunamadı' : 'Henüz görev yok'}
                        message={searchQuery ? 'Farklı bir arama terimi deneyin' : 'Sistemde henüz görev bulunmuyor'}
                    />
                ) : (
                    <FlatList
                        data={filteredTasks}
                        renderItem={({ item }) => (
                            <TaskCard
                                task={item}
                                onPress={() => setSelectedTask(item)}
                                showAssignee
                                assigneeName={assigneeMap.get(item.assignedTo)}
                            />
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

            <FloatingActionButton
                onPress={() => setShowCreateModal(true)}
                icon="add"
            />

            {selectedTeam && user && (
                <CreateTaskModal
                    visible={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        loadTasks();
                    }}
                    teamId={selectedTeam.id}
                    managerId={user.id}
                />
            )}

            {/* Task Detail Modal */}
            <TaskDetailModal
                visible={selectedTask !== null}
                task={selectedTask}
                onClose={() => setSelectedTask(null)}
                onUpdated={loadTasks}
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
});
