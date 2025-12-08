import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import {
    createTask,
    getUserById,
    getUsersByTeam
} from '@/services/firestoreService';
import {
    scheduleTaskAssignedNotification,
    scheduleTaskDeadlineNotification
} from '@/services/notificationService';
import { TaskStatus, User } from '@/types';
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
    View,
} from 'react-native';

interface CreateTaskModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    teamId: string;
    managerId: string;
}

export function CreateTaskModal({
    visible,
    onClose,
    onSuccess,
    teamId,
    managerId,
}: CreateTaskModalProps) {
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showUserPicker, setShowUserPicker] = useState(false);
    const [teamMembers, setTeamMembers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            loadTeamMembers();
        }
    }, [visible, teamId]);

    const loadTeamMembers = async () => {
        try {
            const members = await getUsersByTeam(teamId);
            setTeamMembers(members);
        } catch (error) {
            console.error('Load team members error:', error);
        }
    };

    const handleCreate = async () => {
        if (!title.trim()) {
            showToast.error('Hata', 'Lütfen görev başlığını girin');
            return;
        }

        if (!selectedUser) {
            showToast.error('Hata', 'Lütfen bir kullanıcı seçin');
            return;
        }

        setLoading(true);
        try {
            const taskId = await createTask({
                title: title.trim(),
                description: description.trim(),
                assignedTo: selectedUser.id,
                assignedBy: managerId,
                teamId: teamId,
                status: TaskStatus.TODO,
                dueDate: dueDate,
            });

            // Get manager name for notification
            const manager = await getUserById(managerId);
            const managerName = manager?.name || 'Yönetici';

            // Send task assigned notification
            await scheduleTaskAssignedNotification(title.trim(), managerName);

            // Schedule deadline notification (1 day before)
            await scheduleTaskDeadlineNotification(title.trim(), dueDate, taskId);

            showToast.success('Başarılı', 'Görev oluşturuldu');
            resetForm();
            onSuccess();
            onClose();
        } catch (error: any) {
            showToast.error('Hata', error.message || 'Görev oluşturulamadı');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setSelectedUser(null);
        setDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
        setShowUserPicker(false);
        setShowDatePicker(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDueDate(selectedDate);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            Yeni Görev Oluştur
                        </Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        {/* Title Input */}
                        <Input
                            label="Görev Başlığı"
                            placeholder="Örn: API entegrasyonu yap"
                            value={title}
                            onChangeText={setTitle}
                        />

                        {/* Description Input */}
                        <Input
                            label="Açıklama (Opsiyonel)"
                            placeholder="Görev detaylarını açıklayın"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                            style={styles.textArea}
                        />

                        {/* Assigned User Picker */}
                        <View style={styles.pickerContainer}>
                            <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>
                                Atanacak Kişi
                            </Text>
                            <TouchableOpacity
                                style={[
                                    styles.pickerButton,
                                    { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
                                ]}
                                onPress={() => setShowUserPicker(!showUserPicker)}
                            >
                                <Text style={[styles.pickerButtonText, { color: selectedUser ? colors.text : colors.textSecondary }]}>
                                    {selectedUser?.name || 'Kullanıcı seçin'}
                                </Text>
                                <Ionicons
                                    name={showUserPicker ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color={colors.textSecondary}
                                />
                            </TouchableOpacity>

                            {showUserPicker && (
                                <View style={[styles.pickerDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    <ScrollView style={styles.pickerScroll}>
                                        {teamMembers.map((member) => (
                                            <TouchableOpacity
                                                key={member.id}
                                                style={[
                                                    styles.pickerItem,
                                                    selectedUser?.id === member.id && { backgroundColor: colors.primaryLight + '20' },
                                                ]}
                                                onPress={() => {
                                                    setSelectedUser(member);
                                                    setShowUserPicker(false);
                                                }}
                                            >
                                                <Text style={[styles.pickerItemName, { color: colors.text }]}>
                                                    {member.name}
                                                </Text>
                                                <Text style={[styles.pickerItemEmail, { color: colors.textSecondary }]}>
                                                    {member.email}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>

                        {/* Due Date Picker */}
                        <View style={styles.pickerContainer}>
                            <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>
                                Bitiş Tarihi
                            </Text>
                            <TouchableOpacity
                                style={[
                                    styles.pickerButton,
                                    { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
                                ]}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <View style={styles.datePickerContent}>
                                    <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                                    <Text style={[styles.pickerButtonText, { color: colors.text }]}>
                                        {dueDate.toLocaleDateString('tr-TR')}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={dueDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={onDateChange}
                                    minimumDate={new Date()}
                                />
                            )}
                        </View>
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.modalFooter}>
                        <Button
                            title="İptal"
                            onPress={handleClose}
                            variant="outline"
                            style={styles.footerButton}
                        />
                        <Button
                            title="Oluştur"
                            onPress={handleCreate}
                            loading={loading}
                            style={styles.footerButton}
                        />
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
    modalTitle: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
    },
    modalBody: {
        padding: Spacing.lg,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        marginTop: Spacing.md,
    },
    pickerLabel: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
        marginBottom: Spacing.xs,
    },
    pickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    pickerButtonText: {
        fontSize: Typography.fontSize.base,
    },
    datePickerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    pickerDropdown: {
        marginTop: Spacing.xs,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        maxHeight: 200,
    },
    pickerScroll: {
        maxHeight: 200,
    },
    pickerItem: {
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    },
    pickerItemName: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.medium,
        marginBottom: 2,
    },
    pickerItemEmail: {
        fontSize: Typography.fontSize.sm,
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
