import { Card } from '@/components/ui/Card';
import { BorderRadius, Colors, ShadowsEnhanced, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { Task, TaskStatus } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TaskCardProps {
    task: Task;
    onPress?: () => void;
    showAssignee?: boolean;
    assigneeName?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({
    task,
    onPress,
    showAssignee = false,
    assigneeName,
}) => {
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress?.();
    };

    const getStatusColor = () => {
        switch (task.status) {
            case TaskStatus.TODO:
                return colors.taskTodo;
            case TaskStatus.IN_PROGRESS:
                return colors.taskInProgress;
            case TaskStatus.COMPLETED:
                return colors.taskCompleted;
            case TaskStatus.OVERDUE:
                return colors.taskOverdue;
            default:
                return colors.textTertiary;
        }
    };

    const getStatusLabel = () => {
        switch (task.status) {
            case TaskStatus.TODO:
                return 'Yapılacak';
            case TaskStatus.IN_PROGRESS:
                return 'Devam Ediyor';
            case TaskStatus.COMPLETED:
                return 'Tamamlandı';
            case TaskStatus.OVERDUE:
                return 'Süresi Geçti';
            default:
                return '';
        }
    };

    const getStatusIcon = () => {
        switch (task.status) {
            case TaskStatus.TODO:
                return 'ellipse-outline';
            case TaskStatus.IN_PROGRESS:
                return 'hourglass-outline';
            case TaskStatus.COMPLETED:
                return 'checkmark-circle';
            case TaskStatus.OVERDUE:
                return 'alert-circle';
            default:
                return 'ellipse-outline';
        }
    };

    const isOverdue = task.status === TaskStatus.OVERDUE ||
        (task.status !== TaskStatus.COMPLETED && task.dueDate < new Date());

    const formatDate = (date: Date) => {
        const now = new Date();
        const diff = date.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days < 0) {
            return `${Math.abs(days)} gün önce`;
        } else if (days === 0) {
            return 'Bugün';
        } else if (days === 1) {
            return 'Yarın';
        } else {
            return `${days} gün sonra`;
        }
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.8}
            style={styles.touchable}
        >
            <Card noPadding>
                <View style={[
                    styles.container,
                    ShadowsEnhanced.md[colorScheme]
                ]}>
                    {/* Sol taraf - Premium gradient status göstergesi */}
                    <View
                        style={[
                            styles.statusIndicator,
                            { backgroundColor: getStatusColor() }
                        ]}
                    />

                    {/* Ana içerik */}
                    <View style={styles.content}>
                        {/* Başlık ve durum badge */}
                        <View style={styles.header}>
                            <Text
                                style={[
                                    styles.title,
                                    { color: colors.text },
                                    task.status === TaskStatus.COMPLETED && styles.completedText,
                                ]}
                                numberOfLines={2}
                            >
                                {task.title}
                            </Text>
                        </View>

                        {/* Premium Status Badge */}
                        <View
                            style={[
                                styles.statusBadge,
                                {
                                    backgroundColor: getStatusColor() + '15',
                                    borderColor: getStatusColor() + '40',
                                },
                            ]}
                        >
                            <Ionicons
                                name={getStatusIcon()}
                                size={16}
                                color={getStatusColor()}
                            />
                            <Text style={[styles.statusText, { color: getStatusColor() }]}>
                                {getStatusLabel()}
                            </Text>
                        </View>

                        {/* Açıklama */}
                        {task.description && (
                            <Text
                                style={[styles.description, { color: colors.textSecondary }]}
                                numberOfLines={2}
                            >
                                {task.description}
                            </Text>
                        )}

                        {/* Alt bilgiler - Premium Icons */}
                        <View style={styles.footer}>
                            {/* Tarih */}
                            <View style={[
                                styles.footerItem,
                                isOverdue && styles.overdueItem
                            ]}>
                                <View style={[
                                    styles.iconContainer,
                                    { backgroundColor: isOverdue ? colors.error + '15' : colors.backgroundSecondary }
                                ]}>
                                    <Ionicons
                                        name="calendar-outline"
                                        size={16}
                                        color={isOverdue ? colors.error : colors.primary}
                                    />
                                </View>
                                <Text
                                    style={[
                                        styles.footerText,
                                        { color: isOverdue ? colors.error : colors.textSecondary },
                                        isOverdue && styles.overdueText
                                    ]}
                                >
                                    {formatDate(task.dueDate)}
                                </Text>
                            </View>

                            {/* Atanan kişi */}
                            {showAssignee && assigneeName && (
                                <View style={styles.footerItem}>
                                    <View style={[
                                        styles.iconContainer,
                                        { backgroundColor: colors.backgroundSecondary }
                                    ]}>
                                        <Ionicons
                                            name="person-outline"
                                            size={16}
                                            color={colors.primary}
                                        />
                                    </View>
                                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                                        {assigneeName}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </Card>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    touchable: {
        marginBottom: Spacing.md,
    },
    container: {
        flexDirection: 'row',
        overflow: 'hidden',
    },
    statusIndicator: {
        width: 6,
    },
    content: {
        flex: 1,
        padding: Spacing.lg,
        gap: Spacing.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    title: {
        flex: 1,
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        lineHeight: Typography.lineHeight.tight * Typography.fontSize.lg,
    },
    completedText: {
        textDecorationLine: 'line-through',
        opacity: 0.5,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        gap: Spacing.xs,
    },
    statusText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
    },
    description: {
        fontSize: Typography.fontSize.sm,
        lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.sm,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginTop: Spacing.xs,
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    overdueItem: {
        // Additional styling for overdue items if needed
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    overdueText: {
        fontWeight: Typography.fontWeight.semibold,
    },
});
