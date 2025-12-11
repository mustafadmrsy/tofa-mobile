import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { showToast } from '@/components/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { deleteTask, getUserById, updateTask, updateTaskStatus } from '@/services/firestoreService';
import { Task, TaskStatus, UserRole } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(false);
    const [assignedUser, setAssignedUser] = useState<string>('');
    const [editing, setEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');
    const [editedDescription, setEditedDescription] = useState('');
    const [editedDueDate, setEditedDueDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
            onClose(); // Modal'� kapat
            onClose(); // Modal'� kapat
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
            onClose(); // Modal'� kapat
            onClose(); // Modal'� kapat
        } catch (error: any) {
            showToast.error('Hata', error.message || 'Görev güncellenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        if (!task) return;
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!task) return;

        setLoading(true);
        setShowDeleteConfirm(false);
        try {
            await deleteTask(task.id);
            showToast.success('Başarılı', 'Görev silindi');
            onUpdated();
            onClose(); // Modal'� kapat
            onClose(); // Modal'� kapat
            onClose();
        } catch (error: any) {
            showToast.error('Hata', error.message || 'Görev silinemedi');
        } finally {
            setLoading(false);
        }
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
            case TaskStatus.OVERDUE:
                return 'Süresi Geçti';
            default:
                return status;
        }
    };

    const getStatusIcon = (status: TaskStatus) => {
        switch (status) {
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

    const canEdit = user?.role === UserRole.TEAM_MANAGER || user?.role === UserRole.SUPER_ADMIN;

    if (!task) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={[styles.modalOverlay, { paddingTop: insets.top }]}>
                <View style={[styles.modalContent, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
                    {/* Simple Header */}
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <View style={styles.headerLeft}>
                            <View style={[styles.statusDot, { backgroundColor: getStatusColor(task.status) }]} />
                            <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>
                                {editing ? 'Görevi Düzenle' : 'Görev Detayı'}
                            </Text>
                        </View>
                        <View style={styles.headerRight}>
                            {canEdit && !editing && (
                                <TouchableOpacity onPress={() => setEditing(true)} style={styles.editIconButton}>
                                    <Ionicons name="pencil" size={20} color={colors.primary} />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={onClose} style={styles.closeIconButton}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        {/* Task Info */}
                        <Card>
                            {editing ? (
                                <>
                                    {/* Edit Mode with Icons */}
                                    <View style={styles.editContainer}>
                                        <View style={styles.inputWrapper}>
                                            <View style={styles.inputLabel}>
                                                <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                                                <Text style={[styles.label, { color: colors.text }]}>Görev Başlığı</Text>
                                            </View>
                                            <Input
                                                value={editedTitle}
                                                onChangeText={setEditedTitle}
                                                placeholder="Görev başlığı"
                                            />
                                        </View>

                                        <View style={styles.inputWrapper}>
                                            <View style={styles.inputLabel}>
                                                <Ionicons name="list-outline" size={20} color={colors.primary} />
                                                <Text style={[styles.label, { color: colors.text }]}>Açıklama</Text>
                                            </View>
                                            <Input
                                                value={editedDescription}
                                                onChangeText={setEditedDescription}
                                                placeholder="Görev açıklaması"
                                                multiline
                                                numberOfLines={4}
                                                style={styles.textAreaInput}
                                            />
                                        </View>

                                        <View style={styles.inputWrapper}>
                                            <View style={styles.inputLabel}>
                                                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                                                <Text style={[styles.label, { color: colors.text }]}>Bitiş Tarihi</Text>
                                            </View>
                                            <TouchableOpacity
                                                style={[styles.datePickerButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
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
                                        </View>
                                    </View>
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
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                    Görev Durumu
                                </Text>

                                <View style={styles.statusButtons}>
                                    {[TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED].map((status) => (
                                        <TouchableOpacity
                                            key={status}
                                            style={[
                                                styles.statusButton,
                                                {
                                                    backgroundColor:
                                                        task.status === status
                                                            ? getStatusColor(status)
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
                                            <Ionicons
                                                name={getStatusIcon(status)}
                                                size={24}
                                                color={
                                                    task.status === status
                                                        ? '#FFFFFF'
                                                        : colors.textSecondary
                                                }
                                            />
                                            <Text
                                                style={[
                                                    styles.statusButtonText,
                                                    {
                                                        color:
                                                            task.status === status
                                                                ? '#FFFFFF'
                                                                : colors.textSecondary,
                                                    },
                                                ]}
                                            >
                                                {getStatusText(status)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Overdue uyarısı - sadece gösterim */}
                                {task.status === TaskStatus.OVERDUE && (
                                    <View style={[styles.overdueWarning, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
                                        <Ionicons name="alert-circle" size={20} color={colors.error} />
                                        <Text style={[styles.overdueWarningText, { color: colors.error }]}>
                                            Bu görevin süresi geçmiş. Tamamlamak için durumunu değiştirin.
                                        </Text>
                                    </View>
                                )}
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
                        <View style={{ marginBottom: Spacing.xl }} />
                    </ScrollView>

                    {/* Footer */}
                    <View style={[styles.modalFooter, { backgroundColor: colors.background }]}>
                        {editing ? (
                            <>
                                <TouchableOpacity
                                    onPress={() => {
                                        setEditing(false);
                                        setEditedTitle(task.title);
                                        setEditedDescription(task.description || '');
                                        setEditedDueDate(task.dueDate);
                                    }}
                                    style={[styles.footerButton, styles.cancelButton, { borderColor: colors.border }]}
                                    disabled={loading}
                                >
                                    <Text style={[styles.footerButtonText, { color: colors.text }]}>İptal</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleSaveEdit}
                                    style={[styles.footerButton, styles.saveButton, { backgroundColor: colors.primary }]}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <Text style={[styles.footerButtonText, { color: '#FFFFFF' }]}>Kaydediliyor...</Text>
                                    ) : (
                                        <Text style={[styles.footerButtonText, { color: '#FFFFFF' }]}>Kaydet</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        ) : (
                            <TouchableOpacity
                                onPress={onClose}
                                style={[styles.footerButton, { backgroundColor: colors.primary }]}
                            >
                                <Text style={[styles.footerButtonText, { color: '#FFFFFF' }]}>Kapat</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                visible={showDeleteConfirm}
                title="Görevi Sil"
                message="Bu görevi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
                confirmText="Sil"
                cancelText="İptal"
                onConfirm={confirmDelete}
                onCancel={() => setShowDeleteConfirm(false)}
                type="danger"
            />
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
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: BorderRadius.full,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    editIconButton: {
        padding: Spacing.xs,
    },
    closeIconButton: {
        padding: Spacing.xs,
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
    editContainer: {
        gap: Spacing.md,
    },
    inputWrapper: {
        marginBottom: Spacing.md,
    },
    inputLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: Spacing.sm,
    },
    textAreaInput: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
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
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.bold,
        marginBottom: Spacing.lg,
        color: Colors.light.text,
    },
    statusButtons: {
        gap: Spacing.md,
    },
    statusButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.xl,
        borderRadius: BorderRadius.lg,
        borderWidth: 2,
    },
    statusButtonText: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.bold,
    },
    overdueWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        marginTop: Spacing.lg,
    },
    overdueWarningText: {
        flex: 1,
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    deleteButton: {
        marginTop: Spacing.sm,
    },
    modalFooter: {
        flexDirection: 'row',
        padding: Spacing.lg,
        paddingBottom: Spacing.xl,
        gap: Spacing.md,
        borderTopWidth: 2,
        borderTopColor: 'rgba(0, 0, 0, 0.08)',
    },
    footerButton: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        borderWidth: 2,
        backgroundColor: 'transparent',
    },
    saveButton: {
        // backgroundColor set dynamically
    },
    footerButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
