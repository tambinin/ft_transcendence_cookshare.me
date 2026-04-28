import type { RefObject } from 'react';
import { FiCamera } from 'react-icons/fi';
import InputFloating from '../../components/UI/InputFloating';
import { getAvatarUrl } from '../../utils/avatar.utils';

interface SettingsProfileProps {
  user: { avatarUrl?: string | null } | null;
  username: string; setUsername: (v: string) => void;
  firstName: string; setFirstName: (v: string) => void;
  lastName: string; setLastName: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  isUpdating: boolean;
  handleSaveProfile: (e: React.FormEvent) => void;
  handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
}

const SettingsProfile = ({
  user, username, setUsername, firstName, setFirstName,
  lastName, setLastName, email, setEmail,
  isUpdating, handleSaveProfile, handleAvatarChange, fileInputRef,
}: SettingsProfileProps) => (
  // RESPONSIVE FIX: reduce horizontal padding on mobile
  <form onSubmit={handleSaveProfile} className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-6">
    {/* Avatar */}
    <div className="flex justify-center">
      <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
        <div className="w-24 h-24 rounded-full border-2 border-orange-500/30 overflow-hidden bg-gray-700">
          <img src={getAvatarUrl(user?.avatarUrl)} alt="Avatar" loading="lazy" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <FiCamera size={24} className="text-white" />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleAvatarChange}
          className="hidden"
        />
      </div>
    </div>

    {/* Fields */}
    <InputFloating label="Username" type="text" id="settings-username" value={username} onChange={e => setUsername(e.target.value)} />

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <InputFloating label="First name" type="text" id="settings-firstname" value={firstName} onChange={e => setFirstName(e.target.value)} />
      <InputFloating label="Last name" type="text" id="settings-lastname" value={lastName} onChange={e => setLastName(e.target.value)} />
    </div>

    <InputFloating label="Email" type="email" id="settings-email" value={email} onChange={e => setEmail(e.target.value)} />

    {/* RESPONSIVE FIX: save button full width on mobile */}
    <div className="flex justify-end">
      <button
        type="submit"
        disabled={isUpdating}
        className="w-full sm:w-auto px-8 py-3 rounded-xl bg-orange-400 text-white font-bold text-xs uppercase tracking-widest hover:bg-orange-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
      >
        {isUpdating ? <span className="loading loading-dots"></span> : 'Save Changes'}
      </button>
    </div>
  </form>
);

export default SettingsProfile;
