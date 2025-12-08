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
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

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

    const [teamMembers, setTeamMembers] = useState<User[]>([]);
    const [manager, setManager] = useState<User | null>(null);
    const [availableManagers, setAvailableManagers] = useState<User[]>([]);
    const [showManagerPicker, setShowManagerPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const [teamName, setTeamName] = useState('');

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
        } catch (error: any) {
            showToast.error('Hata', error.message || 'Ekip adı güncellenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTeam = () => {
        if (!team) return;

        Alert.alert(
            'Ekibi Sil',
            `${team.name} ekibini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
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
                    },
                },
            ]
        );
    };

    if (!team) return null;

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
                            <Ionicons name="people" size={24} color={colors.primary} />
                            {editingName ? (
                                <View style={styles.nameEditContainer}>
                                    <TextInput
                                        style={[styles.nameInput, { color: colors.text, borderColor: colors.border }]}
                                        value={teamName}
                                        onChangeText={setTeamName}
                                        autoFocus
                                    />
                                    <TouchableOpacity onPress={handleUpdateName} disabled={loading}>
                                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => {
                                        setTeamName(team.name);
                                        setEditingName(false);
                                    }}>
                                        <Ionicons name="close-circle" size={24} color={colors.error} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity onPress={() => setEditingName(true)} style={styles.nameContainer}>
                                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                                        {team.name}
                                    </Text>
                                    <Ionicons name="pencil" size={16} color={colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

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
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.modalFooter}>
                        <Button
                            title="Kapat"
                            onPress={onClose}
                            variant="primary"
                            fullWidth
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
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        flex: 1,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    nameEditContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        flex: 1,
    },
    nameInput: {
        flex: 1,
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        borderWidth: 1,
        borderRadius: BorderRadius.sm,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
    },
    modalTitle: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
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
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.1)',
    },
});
