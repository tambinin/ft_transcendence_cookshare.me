import { FiEye, FiEyeOff } from 'react-icons/fi';
import InputFloating from '../../components/UI/InputFloating';

interface SettingsSecurityProps {
  oldPassword: string; setOldPassword: (v: string) => void;
  newPassword: string; setNewPassword: (v: string) => void;
  confirmPassword: string; setConfirmPassword: (v: string) => void;
  showOldPassword: boolean; setShowOldPassword: (v: boolean) => void;
  showNewPassword: boolean; setShowNewPassword: (v: boolean) => void;
  showConfirmPassword: boolean; setShowConfirmPassword: (v: boolean) => void;
  isChangingPassword: boolean;
  handleChangePassword: (e: React.FormEvent) => void;
}

const PasswordField = ({
  label, id, value, onChange, show, onToggle,
}: {
  label: string; id: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  show: boolean; onToggle: () => void;
}) => (
  <div className="relative">
    <InputFloating label={label} type={show ? 'text' : 'password'} id={id} value={value} onChange={onChange} />
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-4 top-8 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
    >
      {show ? <FiEyeOff size={20} /> : <FiEye size={20} />}
    </button>
  </div>
);

const SettingsSecurity = ({
  oldPassword, setOldPassword, newPassword, setNewPassword,
  confirmPassword, setConfirmPassword,
  showOldPassword, setShowOldPassword, showNewPassword, setShowNewPassword,
  showConfirmPassword, setShowConfirmPassword,
  isChangingPassword, handleChangePassword,
}: SettingsSecurityProps) => (
  // RESPONSIVE FIX: reduce horizontal padding on mobile
  <form onSubmit={handleChangePassword} className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
    <PasswordField
      label="Current Password" id="oldPassword"
      value={oldPassword} onChange={e => setOldPassword(e.target.value)}
      show={showOldPassword} onToggle={() => setShowOldPassword(!showOldPassword)}
    />
    <PasswordField
      label="New Password" id="newPassword"
      value={newPassword} onChange={e => setNewPassword(e.target.value)}
      show={showNewPassword} onToggle={() => setShowNewPassword(!showNewPassword)}
    />
    <PasswordField
      label="Confirm New Password" id="confirmNewPassword"
      value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
      show={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
    />

    {/* Password strength indicator */}
    {newPassword.length > 0 && (
      <div className="flex items-center gap-2 px-1">
        <div className="flex gap-1 flex-1">
          <div className={`h-1 flex-1 rounded-full transition-colors ${newPassword.length >= 1 ? (newPassword.length >= 12 ? 'bg-green-400' : newPassword.length >= 8 ? 'bg-orange-400' : 'bg-red-400') : 'bg-gray-700'}`} />
          <div className={`h-1 flex-1 rounded-full transition-colors ${newPassword.length >= 8 ? (newPassword.length >= 12 ? 'bg-green-400' : 'bg-orange-400') : 'bg-gray-700'}`} />
          <div className={`h-1 flex-1 rounded-full transition-colors ${newPassword.length >= 12 ? 'bg-green-400' : 'bg-gray-700'}`} />
        </div>
        <span className="text-[10px] text-white/30 uppercase tracking-widest">
          {newPassword.length < 8 ? 'Weak' : newPassword.length < 12 ? 'Good' : 'Strong'}
        </span>
      </div>
    )}

    {/* RESPONSIVE FIX: full-width button on mobile, touch-friendly */}
    <div className="flex justify-end">
      <button
        type="submit"
        disabled={isChangingPassword || !oldPassword || newPassword.length < 8 || newPassword !== confirmPassword}
        className="w-full sm:w-auto px-8 py-3 rounded-xl bg-orange-400 text-white font-bold text-xs uppercase tracking-widest hover:bg-orange-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
      >
        {isChangingPassword ? <span className="loading loading-dots"></span> : 'Change Password'}
      </button>
    </div>
  </form>
);

export default SettingsSecurity;
