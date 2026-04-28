import Footer from '../../components/Footer';
import { useSettings } from './useSettings';
import { useNotificationContext } from '../../contexts/notification.context';
import SettingsSection from './SettingsSection';
import SettingsProfile from './SettingsProfile';
import SettingsSecurity from './SettingsSecurity';
import SettingsBlocked from './SettingsBlocked';
import SettingsDanger from './SettingsDanger';

const Settings = () => {
  const { showToast } = useNotificationContext();
  const s = useSettings(showToast);

  return (
    <div className="app min-h-screen flex flex-col">
      {/* RESPONSIVE FIX: reduce py/px on mobile for better spacing */}
      <main className="main-content flex-1 flex justify-center py-4 sm:py-8 px-2 sm:px-4 pb-20 md:pb-8">
        <div className="w-full max-w-2xl flex flex-col gap-3 sm:gap-4">
          {/* Header */}
          <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-4">
            {/* RESPONSIVE FIX: ensure back button meets touch target */}
            <button onClick={() => s.navigate('/home')} className="text-gray-400 hover:text-orange-400 transition-colors p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
          </div>

          {/* Profile */}
          <SettingsSection title="Profile" subtitle="Edit your personal information" sectionKey="profile" isOpen={s.openSection === 'profile'} onToggle={s.toggleSection}>
            <SettingsProfile
              user={s.user}
              username={s.username} setUsername={s.setUsername}
              firstName={s.firstName} setFirstName={s.setFirstName}
              lastName={s.lastName} setLastName={s.setLastName}
              email={s.email} setEmail={s.setEmail}
              isUpdating={s.isUpdating}
              handleSaveProfile={s.handleSaveProfile}
              handleAvatarChange={s.handleAvatarChange}
              fileInputRef={s.fileInputRef}
            />
          </SettingsSection>

          {/* Security */}
          <SettingsSection title="Security" subtitle="Change your password" sectionKey="security" isOpen={s.openSection === 'security'} onToggle={s.toggleSection}>
            <SettingsSecurity
              oldPassword={s.oldPassword} setOldPassword={s.setOldPassword}
              newPassword={s.newPassword} setNewPassword={s.setNewPassword}
              confirmPassword={s.confirmPassword} setConfirmPassword={s.setConfirmPassword}
              showOldPassword={s.showOldPassword} setShowOldPassword={s.setShowOldPassword}
              showNewPassword={s.showNewPassword} setShowNewPassword={s.setShowNewPassword}
              showConfirmPassword={s.showConfirmPassword} setShowConfirmPassword={s.setShowConfirmPassword}
              isChangingPassword={s.isChangingPassword}
              handleChangePassword={s.handleChangePassword}
            />
          </SettingsSection>

          {/* Blocked Users */}
          <SettingsSection title="Blocked Users" subtitle="Manage blocked users" sectionKey="blocked" isOpen={s.openSection === 'blocked'} onToggle={s.toggleSection}>
            <SettingsBlocked
              blockedUsers={s.blockedUsers}
              blockSearchQuery={s.blockSearchQuery} setBlockSearchQuery={s.setBlockSearchQuery}
              blockSearchResults={s.blockSearchResults}
              blockSearchLoading={s.blockSearchLoading}
              unblockingId={s.unblockingId} blockingId={s.blockingId}
              handleBlockUser={s.handleBlockUser}
              handleUnblockUser={s.handleUnblockUser}
            />
          </SettingsSection>

          {/* Danger Zone */}
          <SettingsSection title="Danger Zone" subtitle="Irreversible actions" sectionKey="danger" isOpen={s.openSection === 'danger'} onToggle={s.toggleSection} variant="danger">
            <SettingsDanger
              deleteConfirm={s.deleteConfirm} setDeleteConfirm={s.setDeleteConfirm}
              isDeleting={s.isDeleting}
              showDeleteModal={s.showDeleteModal}
              openDeleteModal={s.openDeleteModal}
              closeDeleteModal={s.closeDeleteModal}
              handleDeleteAccount={s.handleDeleteAccount}
            />
          </SettingsSection>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Settings;
