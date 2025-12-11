import { showToast } from '@/components/ToastProvider';
import { DatePicker } from '@/components/ui/DatePicker';
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
import { LinearGradient } from 'expo-linear-gradient';
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

const getHeaderGradient = (colorScheme: 'light' | 'dark'): readonly [string, string, string] => {
    if (colorScheme === 'dark') {
        return ['#1e3a5f', '#2d4a6f', '#1a2f4a'] as const;
    }
    return ['#0066CC', '#0052A3', '#003D7A'] as const;
};

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
    const insets = useSafeAreaInsets();

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
        if (Platform.OS !== 'web') {
            setShowDatePicker(Platform.OS === 'ios');
        }
        if (selectedDate) {
            setDueDate(selectedDate);
            if (Platform.OS === 'web') {
                setShowDatePicker(false);
            }
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            statusBarTranslucent
            onRequestClose={handleClose}
        >
            <View style={[styles.modalOverlay, { paddingTop: insets.top }]}>
                <View style={[styles.modalContent, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
                    {/* Gradient Header */}
                    <LinearGradient
                        colors={getHeaderGradient(colorScheme)}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.modalHeader}
                    >
                        <TouchableOpacity
                            onPress={handleClose}
                            style={styles.closeButton}
                        >
                            <Ionicons name="close" size={24} color="#FFFFFF" />
                        </TouchableOpacity>

                        <View style={styles.headerContent}>
                            <View style={styles.headerIcon}>
                                <Ionicons name="clipboard" size={32} color="#FFFFFF" />
                            </View>
                            <Text style={styles.modalTitle}>Yeni Görev Oluştur</Text>
                            <Text style={styles.modalSubtitle}>Ekibiniz için görev atayın</Text>
                        </View>
                    </LinearGradient>

                    <ScrollView
                        style={styles.modalBody}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Title Input */}
                        <View style={styles.inputContainer}>
                            <View style={styles.inputLabel}>
                                <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                                <Text style={[styles.label, { color: colors.text }]}>Görev Başlığı</Text>
                            </View>
                            <Input
                                placeholder="Örn: API entegrasyonu yap"
                                value={title}
                                onChangeText={setTitle}
                            />
                        </View>

                        {/* Description Input */}
                        <View style={styles.inputContainer}>
                            <View style={styles.inputLabel}>
                                <Ionicons name="list-outline" size={20} color={colors.primary} />
                                <Text style={[styles.label, { color: colors.text }]}>Açıklama (Opsiyonel)</Text>
                            </View>
                            <Input
                                placeholder="Görev detaylarını açıklayın"
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={4}
                                style={styles.textArea}
                            />
                        </View>

                        {/* Assigned User Picker */}
                        <View style={styles.inputContainer}>
                            <View style={styles.inputLabel}>
                                <Ionicons name="person-outline" size={20} color={colors.primary} />
                                <Text style={[styles.label, { color: colors.text }]}>Atanacak Kişi</Text>
                            </View>
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
                        <View style={styles.inputContainer}>
                            <View style={styles.inputLabel}>
                                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                                <Text style={[styles.label, { color: colors.text }]}>Bitiş Tarihi</Text>
                            </View>
                            {Platform.OS === 'web' ? (
                                <DatePicker
                                    value={dueDate}
                                    onChange={onDateChange}
                                    minimumDate={new Date()}
                                />
                            ) : (
                                <>
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
                                        <DatePicker
                                            value={dueDate}
                                            onChange={onDateChange}
                                            minimumDate={new Date()}
                                        />
                                    )}
                                </>
                            )}
                        </View>
                    </ScrollView>

                    {/* Footer */}
                    <View style={[styles.modalFooter, { backgroundColor: colors.background }]}>
                        <TouchableOpacity
                            onPress={handleClose}
                            style={[styles.testButton, { borderColor: colors.primary, backgroundColor: 'transparent' }]}
                        >
                            <Text style={[styles.testButtonText, { color: colors.primary }]}>İptal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleCreate}
                            style={[styles.testButton, { backgroundColor: colors.primary }]}
                            disabled={loading}
                        >
                            {loading ? (
                                <Text style={[styles.testButtonText, { color: '#FFFFFF' }]}>Yükleniyor...</Text>
                            ) : (
                                <Text style={[styles.testButtonText, { color: '#FFFFFF' }]}>Oluştur</Text>
                            )}
                        </TouchableOpacity>
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
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.lg,
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
    },
    closeButton: {
        position: 'absolute',
        top: Spacing.md,
        left: Spacing.md,
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: BorderRadius.full,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerContent: {
        alignItems: 'center',
    },
    headerIcon: {
        width: 64,
        height: 64,
        borderRadius: BorderRadius.full,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    modalTitle: {
        fontSize: Typography.fontSize['2xl'],
        fontWeight: Typography.fontWeight.bold,
        color: '#FFFFFF',
        marginBottom: Spacing.xs,
    },
    modalSubtitle: {
        fontSize: Typography.fontSize.sm,
        color: '#FFFFFF',
        opacity: 0.9,
    },
    modalBody: {
        padding: Spacing.lg,
        paddingTop: Spacing.md,
    },
    inputContainer: {
        marginBottom: Spacing.lg,
    },
    inputLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: Spacing.sm,
    },
    label: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        marginBottom: Spacing.lg,
    },
    pickerLabel: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing.sm,
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
        paddingBottom: Spacing.xl,
        gap: Spacing.md,
        borderTopWidth: 2,
        borderTopColor: 'rgba(0, 0, 0, 0.08)',
        borderBottomLeftRadius: BorderRadius.xl,
        borderBottomRightRadius: BorderRadius.xl,
    },
    footerButton: {
        flex: 1,
    },
    testButton: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    testButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
