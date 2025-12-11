import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { showToast } from '@/components/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import {
    deleteTeam,
    getAllUsers,
    getUsersByTeam,
    updateTeamManager,
    updateTeamName,
    updateUserRole,
} from '@/services/firestoreService';
import { Team, User, UserRole } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
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

interface TeamDetailModalProps {
    visible: boolean;
    team: Team | null;
    onClose: () => void;
    onDeleted: () => void;
    onUpdated: () => void;
}

export function TeamDetailModal({
    visible,
    team,
    onClose,
    onDeleted,
    onUpdated,
}: TeamDetailModalProps) {
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const insets = useSafeAreaInsets();

    const [teamMembers, setTeamMembers] = useState<User[]>([]);
    const [manager, setManager] = useState<User | null>(null);
    const [availableManagers, setAvailableManagers] = useState<User[]>([]);
    const [showManagerPicker, setShowManagerPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const [teamName, setTeamName] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (visible && team) {
            loadTeamDetails();
            setTeamName(team.name);
        }
    }, [visible, team]);

    const loadTeamDetails = async () => {
        if (!team) return;

        try {
            // Load team members
            const members = await getUsersByTeam(team.id);
            setTeamMembers(members);

            // Find manager
            const currentManager = members.find((m) => m.id === team.managerId);
            setManager(currentManager || null);

            // Load all potential managers
            const allUsers = await getAllUsers();
            // Tüm kullanıcılar ekip yöneticisi olabilir
            setAvailableManagers(allUsers);
        } catch (error) {
            console.error('Load team details error:', error);
        }
    };

    const handleChangeManager = async (newManager: User) => {
        if (!team) return;

        setLoading(true);
        try {
            // Eski yöneticinin rolünü user'a çevir (eğer sadece bir ekibin yöneticisiyse)
            if (manager && manager.id !== newManager.id) {
                // Eski yönetici sadece bu ekibin yöneticisiyse rolünü user yap
                // Not: Super admin'ler her zaman super admin kalmalı
                if (manager.role !== UserRole.SUPER_ADMIN) {
                    await updateUserRole(manager.id, UserRole.USER);
                }
            }

            // Yeni yöneticinin rolünü team_manager yap (eğer super admin değilse)
            if (newManager.role !== UserRole.SUPER_ADMIN) {
                await updateUserRole(newManager.id, UserRole.TEAM_MANAGER);
            }

            // Ekip yöneticisini güncelle
            await updateTeamManager(team.id, newManager.id);

            setManager(newManager);
            setShowManagerPicker(false);
            showToast.success('Başarılı', 'Ekip yöneticisi değiştirildi');
            onUpdated();
        } catch (error: any) {
            showToast.error('Hata', error.message || 'Yönetici değiştirilemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateName = async () => {
        if (!team) return;

        if (!teamName.trim()) {
            showToast.error('Hata', 'Ekip adı boş olamaz');
            return;
        }

        setLoading(true);
        try {
            await updateTeamName(team.id, teamName.trim());
            showToast.success('Başarılı', 'Ekip adı güncellendi');
            setEditingName(false);
            onUpdated();
            onClose(); // Modal'ı kapat
        } catch (error: any) {
            showToast.error('Hata', error.message || 'Ekip adı güncellenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTeam = () => {
        if (!team) return;
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!team) return;

        setLoading(true);
        setShowDeleteConfirm(false);
        try {
            await deleteTeam(team.id);
            showToast.success('Başarılı', 'Ekip silindi');
            onDeleted();
            onClose();
        } catch (error: any) {
            showToast.error('Hata', error.message || 'Ekip silinemedi');
        } finally {
            setLoading(false);
        }
    };

    if (!team) return null;

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
                    {/* Gradient Header */}
                    <LinearGradient
                        colors={getHeaderGradient(colorScheme)}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.modalHeader}
                    >
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeButton}
                        >
                            <Ionicons name="close" size={24} color="#FFFFFF" />
                        </TouchableOpacity>

                        <View style={styles.headerContent}>
                            <View style={styles.headerIcon}>
                                <Ionicons name="people-circle" size={32} color="#FFFFFF" />
                            </View>
                            {editingName ? (
                                <View style={styles.nameEditContainer}>
                                    <TextInput
                                        style={[styles.nameInput, { color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.5)' }]}
                                        value={teamName}
                                        onChangeText={setTeamName}
                                        autoFocus
                                        placeholderTextColor="rgba(255,255,255,0.7)"
                                    />
                                    <TouchableOpacity onPress={handleUpdateName} disabled={loading} style={styles.editButton}>
                                        <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => {
                                        setTeamName(team.name);
                                        setEditingName(false);
                                    }} style={styles.editButton}>
                                        <Ionicons name="close-circle" size={28} color="#F44336" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity onPress={() => setEditingName(true)} style={styles.titleContainer}>
                                    <Text style={styles.modalTitle}>
                                        {team.name}
                                    </Text>
                                    <Ionicons name="pencil" size={20} color="rgba(255,255,255,0.8)" style={styles.editIcon} />
                                </TouchableOpacity>
                            )}
                            <Text style={styles.modalSubtitle}>Ekip detaylarını yönetin</Text>
                        </View>
                    </LinearGradient>

                    <ScrollView style={styles.modalBody}>
                        {/* Manager Section */}
                        <Card>
                            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                                Ekip Yöneticisi
                            </Text>

                            <TouchableOpacity
                                style={[
                                    styles.managerButton,
                                    { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
                                ]}
                                onPress={() => setShowManagerPicker(!showManagerPicker)}
                            >
                                <View>
                                    <Text style={[styles.managerName, { color: colors.text }]}>
                                        {manager?.name || 'Yükleniyor...'}
                                    </Text>
                                    <Text style={[styles.managerEmail, { color: colors.textSecondary }]}>
                                        {manager?.email || ''}
                                    </Text>
                                </View>
                                <Ionicons
                                    name={showManagerPicker ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color={colors.textSecondary}
                                />
                            </TouchableOpacity>

                            {showManagerPicker && (
                                <View style={[styles.pickerDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    <ScrollView style={styles.pickerScroll}>
                                        {availableManagers.map((mgr) => (
                                            <TouchableOpacity
                                                key={mgr.id}
                                                style={[
                                                    styles.pickerItem,
                                                    manager?.id === mgr.id && { backgroundColor: colors.primaryLight + '20' },
                                                ]}
                                                onPress={() => handleChangeManager(mgr)}
                                                disabled={loading}
                                            >
                                                <Text style={[styles.pickerItemName, { color: colors.text }]}>
                                                    {mgr.name}
                                                </Text>
                                                <Text style={[styles.pickerItemEmail, { color: colors.textSecondary }]}>
                                                    {mgr.email}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </Card>

                        {/* Members Section */}
                        <Card>
                            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                                Ekip Üyeleri ({teamMembers.length})
                            </Text>
                            {teamMembers.map((member) => (
                                <View key={member.id} style={styles.memberItem}>
                                    <View>
                                        <Text style={[styles.memberName, { color: colors.text }]}>
                                            {member.name}
                                        </Text>
                                        <Text style={[styles.memberEmail, { color: colors.textSecondary }]}>
                                            {member.email}
                                        </Text>
                                    </View>
                                    {member.id === team.managerId && (
                                        <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                                            <Text style={[styles.badgeText, { color: colors.primary }]}>
                                                Yönetici
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            ))}
                        </Card>

                        {/* Delete Section */}
                        <Card>
                            <Text style={[styles.sectionTitle, { color: colors.error }]}>
                                Tehlikeli Bölge
                            </Text>
                            <Button
                                title="Ekibi Sil"
                                onPress={handleDeleteTeam}
                                variant="outline"
                                style={[styles.deleteButton, { borderColor: colors.error }]}
                                loading={loading}
                            />
                        </Card>
                        <View style={{ marginBottom: Spacing.xl }} />
                    </ScrollView>

                    {/* Footer */}
                    <View style={[styles.modalFooter, { backgroundColor: colors.background }]}>
                        <TouchableOpacity
                            onPress={onClose}
                            style={[styles.footerButton, { backgroundColor: colors.primary }]}
                        >
                            <Text style={styles.footerButtonText}>Kapat</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                visible={showDeleteConfirm}
                title="Ekibi Sil"
                message={`${team?.name} ekibini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
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
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.xs,
    },
    editIcon: {
        marginLeft: Spacing.xs,
    },
    nameEditContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        width: '80%',
        marginBottom: Spacing.xs,
    },
    editButton: {
        padding: Spacing.xs,
    },
    nameInput: {
        flex: 1,
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        borderWidth: 1.5,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        textAlign: 'center',
        color: '#FFFFFF',
    },
    modalTitle: {
        fontSize: Typography.fontSize['2xl'],
        fontWeight: Typography.fontWeight.bold,
        color: '#FFFFFF',
    },
    modalSubtitle: {
        fontSize: Typography.fontSize.sm,
        color: '#FFFFFF',
        opacity: 0.9,
    },
    modalBody: {
        padding: Spacing.lg,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing.md,
        textTransform: 'uppercase',
    },
    managerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    managerName: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.medium,
        marginBottom: 2,
    },
    managerEmail: {
        fontSize: Typography.fontSize.sm,
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
    memberItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    },
    memberName: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.medium,
        marginBottom: 2,
    },
    memberEmail: {
        fontSize: Typography.fontSize.sm,
    },
    badge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
    },
    badgeText: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.semibold,
    },
    deleteButton: {
        marginTop: Spacing.sm,
    },
    modalFooter: {
        padding: Spacing.lg,
        paddingBottom: Spacing.xl,
        borderTopWidth: 2,
        borderTopColor: 'rgba(0, 0, 0, 0.08)',
    },
    footerButton: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
