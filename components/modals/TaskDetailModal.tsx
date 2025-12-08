import { showToast } from '@/components/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { deleteTask, getUserById, updateTask, updateTaskStatus } from '@/services/firestoreService';
import { Task, TaskStatus, UserRole } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface TaskDetailModalProps {
    visible: boolean;
    task: Task | null;
    onClose: () => void;
    onUpdated: () => void;
}

export function TaskDetailModal({
    visible,
    task,
    onClose,
    onUpdated,
}: TaskDetailModalProps) {
    const { colorScheme } = useTheme();
    const { user } = useAuth();
    const colors = Colors[colorScheme];

    const [loading, setLoading] = useState(false);
    const [assignedUser, setAssignedUser] = useState<string>('');
    const [editing, setEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');
    const [editedDescription, setEditedDescription] = useState('');
    const [editedDueDate, setEditedDueDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        if (task) {
            loadAssignedUser();
            setEditedTitle(task.title);
            setEditedDescription(task.description || '');
            setEditedDueDate(task.dueDate);
        }
    }, [task]);

    const loadAssignedUser = async () => {
        if (!task) return;
        const assignedUserData = await getUserById(task.assignedTo);
        setAssignedUser(assignedUserData?.name || 'Bilinmiyor');
    };

    const handleStatusChange = async (newStatus: TaskStatus) => {
        if (!task) return;

        setLoading(true);
        try {
            await updateTaskStatus(task.id, newStatus);
            onUpdated();
            onClose(); // Modal'ı otomatik kapat
        } catch (error: any) {
            showToast.error('Hata', error.message || 'Durum güncellenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!task) return;

        if (!editedTitle.trim()) {
            showToast.error('Hata', 'Görev başlığı boş olamaz');
            return;
        }

        setLoading(true);
        try {
            await updateTask(task.id, {
                title: editedTitle.trim(),
                description: editedDescription.trim(),
                dueDate: editedDueDate,
            });
            showToast.success('Başarılı', 'Görev güncellendi');
            setEditing(false);
            onUpdated();
        } catch (error: any) {
            showToast.error('Hata', error.message || 'Görev güncellenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        if (!task) return;

        Alert.alert(
            'Görevi Sil',
            'Bu görevi silmek istediğinizden emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await deleteTask(task.id);
                            showToast.success('Başarılı', 'Görev silindi');
                            onUpdated();
                            onClose();
                        } catch (error: any) {
                            showToast.error('Hata', error.message || 'Görev silinemedi');
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setEditedDueDate(selectedDate);
        }
    };

    const getStatusColor = (status: TaskStatus) => {
        switch (status) {
            case TaskStatus.TODO:
                return colors.taskTodo;
            case TaskStatus.IN_PROGRESS:
                return colors.taskInProgress;
            case TaskStatus.COMPLETED:
                return colors.taskCompleted;
            default:
                return colors.textSecondary;
        }
    };

    const getStatusText = (status: TaskStatus) => {
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

    const canEdit = user?.role === UserRole.TEAM_MANAGER || user?.role === UserRole.SUPER_ADMIN;

    if (!task) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <View style={styles.headerLeft}>
                            <Ionicons name="checkbox" size={24} color={colors.primary} />
                            <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>
                                {editing ? 'Görevi Düzenle' : 'Görev Detayı'}
                            </Text>
                        </View>
                        <View style={styles.headerRight}>
                            {canEdit && !editing && (
                                <TouchableOpacity onPress={() => setEditing(true)} style={styles.editButton}>
                                    <Ionicons name="pencil" size={20} color={colors.primary} />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        {/* Task Info */}
                        <Card>
                            {editing ? (
                                <>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>Başlık</Text>
                                    <TextInput
                                        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                                        value={editedTitle}
                                        onChangeText={setEditedTitle}
                                        placeholder="Görev başlığı"
                                        placeholderTextColor={colors.textSecondary}
                                    />

                                    <Text style={[styles.label, { color: colors.textSecondary }]}>Açıklama</Text>
                                    <TextInput
                                        style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border }]}
                                        value={editedDescription}
                                        onChangeText={setEditedDescription}
                                        placeholder="Görev açıklaması"
                                        placeholderTextColor={colors.textSecondary}
                                        multiline
                                        numberOfLines={4}
                                    />

                                    <Text style={[styles.label, { color: colors.textSecondary }]}>Bitiş Tarihi</Text>
                                    <TouchableOpacity
                                        style={[styles.dateButton, { borderColor: colors.border }]}
                                        onPress={() => setShowDatePicker(true)}
                                    >
                                        <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                                        <Text style={[styles.dateText, { color: colors.text }]}>
                                            {editedDueDate.toLocaleDateString('tr-TR')}
                                        </Text>
                                    </TouchableOpacity>

                                    {showDatePicker && (
                                        <DateTimePicker
                                            value={editedDueDate}
                                            mode="date"
                                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                            onChange={onDateChange}
                                            minimumDate={new Date()}
                                        />
                                    )}
                                </>
                            ) : (
                                <>
                                    <Text style={[styles.taskTitle, { color: colors.text }]}>
                                        {task.title}
                                    </Text>
                                    {task.description && (
                                        <Text style={[styles.taskDescription, { color: colors.textSecondary }]}>
                                            {task.description}
                                        </Text>
                                    )}

                                    <View style={styles.infoRow}>
                                        <Ionicons name="person" size={16} color={colors.textSecondary} />
                                        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                                            Atanan: {assignedUser}
                                        </Text>
                                    </View>

                                    <View style={styles.infoRow}>
                                        <Ionicons name="calendar" size={16} color={colors.textSecondary} />
                                        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                                            Bitiş: {task.dueDate.toLocaleDateString('tr-TR')}
                                        </Text>
                                    </View>

                                    <View style={styles.infoRow}>
                                        <Ionicons name="time" size={16} color={colors.textSecondary} />
                                        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                                            Oluşturulma: {task.createdAt.toLocaleDateString('tr-TR')}
                                        </Text>
                                    </View>
                                </>
                            )}
                        </Card>

                        {/* Status Section */}
                        {!editing && (
                            <Card>
                                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                                    Durum
                                </Text>

                                <View style={styles.statusButtons}>
                                    {Object.values(TaskStatus).map((status) => (
                                        <TouchableOpacity
                                            key={status}
                                            style={[
                                                styles.statusButton,
                                                {
                                                    backgroundColor:
                                                        task.status === status
                                                            ? getStatusColor(status) + '20'
                                                            : colors.backgroundSecondary,
                                                    borderColor:
                                                        task.status === status
                                                            ? getStatusColor(status)
                                                            : colors.border,
                                                },
                                            ]}
                                            onPress={() => handleStatusChange(status)}
                                            disabled={loading}
                                        >
                                            <Text
                                                style={[
                                                    styles.statusButtonText,
                                                    {
                                                        color:
                                                            task.status === status
                                                                ? getStatusColor(status)
                                                                : colors.textSecondary,
                                                    },
                                                ]}
                                            >
                                                {getStatusText(status)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </Card>
                        )}

                        {/* Delete Section (Only for managers and admins) */}
                        {canEdit && !editing && (
                            <Card>
                                <Text style={[styles.sectionTitle, { color: colors.error }]}>
                                    Tehlikeli Bölge
                                </Text>
                                <Button
                                    title="Görevi Sil"
                                    onPress={handleDelete}
                                    variant="outline"
                                    style={[styles.deleteButton, { borderColor: colors.error }]}
                                    loading={loading}
                                />
                            </Card>
                        )}
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.modalFooter}>
                        {editing ? (
                            <>
                                <Button
                                    title="İptal"
                                    onPress={() => {
                                        setEditing(false);
                                        setEditedTitle(task.title);
                                        setEditedDescription(task.description || '');
                                        setEditedDueDate(task.dueDate);
                                    }}
                                    variant="outline"
                                    style={{ flex: 1 }}
                                />
                                <Button
                                    title="Kaydet"
                                    onPress={handleSaveEdit}
                                    loading={loading}
                                    style={{ flex: 1 }}
                                />
                            </>
                        ) : (
                            <Button
                                title="Kapat"
                                onPress={onClose}
                                variant="primary"
                            />
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    editButton: {
        padding: Spacing.xs,
    },
    modalTitle: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        flex: 1,
    },
    modalBody: {
        padding: Spacing.lg,
    },
    label: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
        marginBottom: Spacing.xs,
        marginTop: Spacing.md,
    },
    input: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        fontSize: Typography.fontSize.base,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
        paddingTop: Spacing.sm,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
    },
    dateText: {
        fontSize: Typography.fontSize.base,
    },
    taskTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        marginBottom: Spacing.sm,
    },
    taskDescription: {
        fontSize: Typography.fontSize.base,
        marginBottom: Spacing.md,
        lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.sm,
        gap: Spacing.xs,
    },
    infoText: {
        fontSize: Typography.fontSize.sm,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing.md,
        textTransform: 'uppercase',
    },
    statusButtons: {
        gap: Spacing.sm,
    },
    statusButton: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.md,
        borderWidth: 2,
        alignItems: 'center',
    },
    statusButtonText: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semibold,
    },
    deleteButton: {
        marginTop: Spacing.sm,
    },
    modalFooter: {
        flexDirection: 'row',
        padding: Spacing.lg,
        gap: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.1)',
    },
    footerButton: {
        flex: 1,
    },
});
