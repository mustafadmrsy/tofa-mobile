import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TaskDetailModal } from '@/components/modals/TaskDetailModal';
import { TaskCard } from '@/components/TaskCard';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { getAllTasks, getUserById } from '@/services/firestoreService';
import { Task, TaskStatus } from '@/types';
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

    useEffect(() => {
        loadTasks();
    }, []);

    useEffect(() => {
        filterTasks();
    }, [searchQuery, filterStatus, tasks]);

    const loadTasks = async () => {
        try {
            const allTasks = await getAllTasks();
            setTasks(allTasks);

            // Load assignee names
            const assigneeNames = new Map<string, string>();
            for (const task of allTasks) {
                if (!assigneeNames.has(task.assignedTo)) {
                    const assignee = await getUserById(task.assignedTo);
                    if (assignee) {
                        assigneeNames.set(task.assignedTo, assignee.name);
                    }
                }
            }
            setAssigneeMap(assigneeNames);
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
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Tüm Görevler</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {filteredTasks.length} / {tasks.length} görev
                </Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Ionicons name="search" size={20} color={colors.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Görev ara..."
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

            {/* Status Filter */}
            <View style={styles.filterContainer}>
                {[
                    { label: 'Tümü', value: null },
                    { label: 'Yapılacak', value: TaskStatus.TODO },
                    { label: 'Devam Ediyor', value: TaskStatus.IN_PROGRESS },
                    { label: 'Tamamlandı', value: TaskStatus.COMPLETED },
                ].map((filter) => (
                    <TouchableOpacity
                        key={filter.label}
                        style={[
                            styles.filterChip,
                            {
                                backgroundColor: filterStatus === filter.value ? colors.primary : colors.card,
                                borderColor: filterStatus === filter.value ? colors.primary : colors.border,
                            },
                        ]}
                        onPress={() => setFilterStatus(filter.value)}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                { color: filterStatus === filter.value ? '#fff' : colors.text },
                            ]}
                        >
                            {filter.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Task List */}
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
});
