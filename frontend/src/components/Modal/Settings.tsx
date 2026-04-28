import { useState, useEffect } from 'react';
import { FiEye, FiEyeOff, FiShield, FiTrash2, FiX, FiLock } from 'react-icons/fi';
import { useSettings } from '@cookshare/hooks';

interface SettingsModalProps {
  modalRef: React.RefObject<HTMLDialogElement | null>;
}

const SettingsModal = ({ modalRef }: SettingsModalProps) => {
  const { changePassword, deleteAccount, isLoading } = useSettings();
  const [activeTab, setActiveTab] = useState<'security' | 'danger'>('security');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [showPass, setShowPass] = useState({ old: false, new: false, confirm: false });
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new.length < 8) return setMessage({ type: 'error', text: '8 characters minimum.' });
    if (passwords.new !== passwords.confirm) return setMessage({ type: 'error', text: 'Passwords do not match.' });

    try {
      await changePassword(passwords.old, passwords.new);
      setMessage({ type: 'success', text: 'Password updated!' });
      setPasswords({ old: '', new: '', confirm: '' });
      setShowPasswordForm(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error changing password.';
      setMessage({ type: 'error', text: errorMessage });
    }
  };

  const closeModal = () => {
    modalRef.current?.close();
    setShowPasswordForm(false);
  };

  return (
    <dialog ref={modalRef} className="modal shadow-2xl backdrop:bg-black/50 backdrop-blur-sm">
      <div className="modal-box bg-[var(--cook-bg)] rounded-2xl p-0 overflow-hidden max-w-md w-full border border-white/5">        
        <div className="p-6 pb-2 relative text-center">
            <button onClick={closeModal} className="absolute right-4 top-4 text-white/30 hover:text-white transition-colors">
                <FiX size={20} />
            </button>
            <p className="text-2xl font-bold text-orange-200">Settings</p>
        </div>
        <div className="flex justify-center gap-2 p-4">
            <button 
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${activeTab === 'security' ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
            >
                <FiShield size={16} /> Security
            </button>
            <button 
                onClick={() => setActiveTab('danger')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${activeTab === 'danger' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
            >
                <FiTrash2 size={16} /> Account
            </button>
        </div>

        <div className="p-6 pt-2 min-h-[280px]">
          {message && (
            <div className={`mb-4 p-3 rounded-lg text-xs font-bold text-center animate-in fade-in zoom-in duration-300
              ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {message.text}
            </div>
          )}

          {activeTab === 'security' ? (
            <div className="flex flex-col gap-4">
              {!showPasswordForm ? (
                <div className="flex flex-col items-center justify-center py-8 gap-4 border border-dashed border-white/10 rounded-2xl">
                  <div className="p-4 bg-orange-500/10 rounded-full text-orange-500">
                    <FiLock size={32} />
                  </div>
                  <div className="text-center px-6">
                    <p className="text-white font-medium">Password</p>
                    <p className="text-xs text-white/40 mt-1">Protect your account with a secure password.</p>
                  </div>
                  <button 
                    onClick={() => setShowPasswordForm(true)}
                    className="mt-2 px-6 py-2 bg-white/5 hover:bg-white/10 text-orange-200 border border-orange-500/30 rounded-xl text-sm font-bold transition-all"
                  >
                    CHANGE PASSWORD
                  </button>
                </div>
              ) : (
                <form onSubmit={handleChangePassword} className="flex flex-col gap-4 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-3">
                    {[
                      { id: 'old', label: 'Current Password', value: passwords.old },
                      { id: 'new', label: 'New password', value: passwords.new },
                      { id: 'confirm', label: 'Confirm password', value: passwords.confirm }
                    ].map((field) => (
                      <div key={field.id} className="flex flex-col">
                        <label className="text-left text-[10px] uppercase tracking-widest text-white/40 mb-1 ml-1">{field.label}</label>
                        <div className="relative">
                          <input
                            autoFocus={field.id === 'old'}
                            type={showPass[field.id as keyof typeof showPass] ? 'text' : 'password'}
                            value={field.value}
                            onChange={(e) => setPasswords({...passwords, [field.id]: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-orange-500 outline-none transition-all text-sm"
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowPass({...showPass, [field.id]: !showPass[field.id as keyof typeof showPass]})}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-orange-400"
                          >
                            {showPass[field.id as keyof typeof showPass] ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button 
                      type="button"
                      onClick={() => setShowPasswordForm(false)}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white/50 font-bold py-3 rounded-xl text-xs transition-all"
                    >
                      CANCEL
                    </button>
                    <button 
                      type="submit"
                      disabled={isLoading || !passwords.old || passwords.new.length < 8}
                      className="flex-[2] bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs transition-all"
                    >
                      {isLoading ? <span className='loading loading-dots loading-xl'></span> : "CONFIRM"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6 text-center animate-in fade-in duration-300">
              <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                <p className="text-red-400 font-bold mb-2">Critical Zone</p>
                <p className="text-xs text-white/50 leading-relaxed px-4">
                    Deletion is permanent. Type <span className="text-white font-mono bg-white/10 px-1 rounded">DELETE</span> to confirm.
                </p>
              </div>
              <input
                type="text"
                placeholder="DELETE"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="bg-transparent border-b-2 border-white/10 text-center text-xl text-white outline-none focus:border-red-500 py-2 transition-all"
              />
              <button
                onClick={async () => {
                    if (deleteConfirm !== 'DELETE') return;
                    try { 
                        await deleteAccount(); 
                        closeModal(); 
                    } 
                    catch { setMessage({type: 'error', text: 'Error deleting account'}); }
                }}
                disabled={deleteConfirm !== 'DELETE' || isLoading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-20 text-white font-bold py-3 rounded-xl transition-all"
              >
                {isLoading ? <span className='loading loading-dots loading-sm'></span> : "DELETE MY ACCOUNT"}
              </button>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-white/5 flex justify-center border-t border-white/5">
            <button onClick={closeModal} className="text-[10px] text-white/30 hover:text-white uppercase tracking-[0.2em] font-bold transition-all">
                Close
            </button>
        </div>
      </div>
    </dialog>
  );
};

export default SettingsModal;