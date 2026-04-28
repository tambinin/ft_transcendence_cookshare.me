import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useProfileUpdate } from '@cookshare/hooks';
import api from '../../services/api.client';
import userService from '../../services/user.service';
import socialService from '../../services/social.service';
import type { BlockedUser, SearchUser } from '../../types/social.type';

export function useSettings(showToast: (title: string, message: string) => void) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { updateProfile, updateAvatar, isUpdating, updateError, clearError } = useProfileUpdate();

  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [blockSearchQuery, setBlockSearchQuery] = useState('');
  const [blockSearchResults, setBlockSearchResults] = useState<SearchUser[]>([]);
  const [blockSearchLoading, setBlockSearchLoading] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const [blockingId, setBlockingId] = useState<string | null>(null);

  const [openSection, setOpenSection] = useState<string>('profile');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const toggleSection = useCallback((section: string) => {
    setOpenSection(prev => prev === section ? '' : section);
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { showToast('Erreur', 'Username is required.'); return; }
    clearError();
    await updateProfile({
      username: username.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
    });
    if (updateError) {
      showToast('Erreur', updateError);
    } else {
      showToast('Succès', 'Profile updated successfully');
      setTimeout(() => navigate('/home'), 1500);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    clearError();
    await updateAvatar(file);
    if (updateError) {
      showToast('Erreur', updateError);
    } else {
      showToast('Succès', 'Avatar updated!');
      setTimeout(() => navigate('/home'), 1500);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) { showToast('Erreur', 'New password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { showToast('Erreur', 'Passwords do not match.'); return; }
    setIsChangingPassword(true);
    try {
      await api.post('users/change-password', { oldPassword, newPassword });
      showToast('Succès', 'Password changed successfully!');
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
      setTimeout(() => navigate('/home'), 1500);
    } catch (err: unknown) {
      const msg = (err as Record<string, Record<string, Record<string, string>>>)?.response?.data?.message;
      showToast('Erreur', msg || 'Error changing password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const openDeleteModal = () => { setDeleteConfirm(''); setShowDeleteModal(true); };
  const closeDeleteModal = () => { setShowDeleteModal(false); setDeleteConfirm(''); };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE' || !user) return;
    setIsDeleting(true);
    try {
      await userService.deleteAccount(user.id);
      setShowDeleteModal(false);
      await logout();
      navigate('/login', { replace: true });
    } catch (err: unknown) {
      const msg = (err as Record<string, Record<string, Record<string, string>>>)?.response?.data?.message;
      showToast('Erreur', msg || 'Error deleting account.');
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const fetchBlocked = async () => {
      try {
        const res = await socialService.getBlockedUsers();
        setBlockedUsers(Array.isArray(res.data) ? res.data : []);
      } catch { /* ignore */ }
    };
    fetchBlocked();
  }, []);

  useEffect(() => {
    if (!blockSearchQuery.trim()) { setBlockSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setBlockSearchLoading(true);
      try {
        const res = await socialService.searchUsers(blockSearchQuery, 5);
        const results = Array.isArray(res.data) ? res.data : [];
        const blockedIds = new Set(blockedUsers.map(b => b.id));
        setBlockSearchResults(results.filter(u => u.id !== user?.id && !blockedIds.has(u.id)));
      } catch { setBlockSearchResults([]); }
      finally { setBlockSearchLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [blockSearchQuery, blockedUsers, user?.id]);

  const handleBlockUser = async (userId: string) => {
    setBlockingId(userId);
    try {
      await socialService.blockUser(userId);
      const user = blockSearchResults.find(u => u.id === userId);
      const username = user?.username || 'Unknown';
      setBlockedUsers(prev => [...prev, { id: userId, username, avatarUrl: user?.avatarUrl || '', blockedAt: new Date().toISOString() }]);
      setBlockSearchQuery('');
      showToast('Succès', 'User blocked successfully.');
    } catch { showToast('Erreur', 'Failed to block user.'); }
    finally { setBlockingId(null); }
  };

  const handleUnblockUser = async (userId: string) => {
    setUnblockingId(userId);
    try {
      await socialService.unblockUser(userId);
      setBlockedUsers(prev => prev.filter(u => u.id !== userId));
      showToast('Succès', 'User unblocked successfully.');
    } catch { showToast('Erreur', 'Failed to unblock user.'); }
    finally { setUnblockingId(null); }
  };

  return {
    user, navigate,

    openSection, toggleSection,

    username, setUsername, firstName, setFirstName, lastName, setLastName, email, setEmail,
    isUpdating, handleSaveProfile, handleAvatarChange, fileInputRef,

    oldPassword, setOldPassword, newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    showOldPassword, setShowOldPassword, showNewPassword, setShowNewPassword,
    showConfirmPassword, setShowConfirmPassword,
    isChangingPassword, handleChangePassword,

    deleteConfirm, setDeleteConfirm, isDeleting,
    showDeleteModal, openDeleteModal, closeDeleteModal, handleDeleteAccount,

    blockedUsers, blockSearchQuery, setBlockSearchQuery,
    blockSearchResults, blockSearchLoading,
    unblockingId, blockingId,
    handleBlockUser, handleUnblockUser,
  };
}
