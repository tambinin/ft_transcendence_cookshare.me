import { FiAlertTriangle } from 'react-icons/fi';

interface SettingsDangerProps {
  deleteConfirm: string;
  setDeleteConfirm: (v: string) => void;
  isDeleting: boolean;
  showDeleteModal: boolean;
  openDeleteModal: () => void;
  closeDeleteModal: () => void;
  handleDeleteAccount: () => void;
}

const SettingsDanger = ({
  deleteConfirm, setDeleteConfirm, isDeleting,
  showDeleteModal, openDeleteModal, closeDeleteModal, handleDeleteAccount,
}: SettingsDangerProps) => (
  <>
    {/* RESPONSIVE FIX: reduce horizontal padding on mobile */}
    <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
      <div className="p-3 sm:p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
        <div className="flex items-start gap-3 mb-4">
          <FiAlertTriangle className="text-red-400 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm text-red-300 font-medium mb-1">Permanently delete your account</p>
            <p className="text-xs text-gray-500">
              This action is <strong className="text-red-400">irreversible</strong>. All your data will be permanently deleted:
            </p>
            <ul className="text-xs text-gray-500 mt-2 ml-4 list-disc space-y-1">
              <li>Your profile and personal information</li>
              <li>All your recipes and their images</li>
              <li>Your messages and conversations</li>
              <li>Your favorites, ratings and comments</li>
              <li>Your badges and gamification history</li>
            </ul>
          </div>
        </div>
        {/* RESPONSIVE FIX: touch-friendly delete button */}
        <button
          onClick={openDeleteModal}
          className="w-full px-6 py-3 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 font-bold text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition duration-200 min-h-[44px]"
        >
          I understand, delete my account
        </button>
      </div>
    </div>

    {/* RESPONSIVE FIX: Delete confirmation modal — fullscreen on mobile */}
    {showDeleteModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeDeleteModal} />
        <div className="relative bg-[#1a1b1e] border border-red-500/30 sm:rounded-2xl p-4 sm:p-6 w-full h-full sm:h-auto sm:max-w-md sm:mx-4 shadow-2xl flex flex-col justify-center overflow-y-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-500/10 rounded-full">
              <FiAlertTriangle className="text-red-400" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Confirm deletion</h3>
              <p className="text-xs text-gray-500">This action is permanent</p>
            </div>
          </div>

          <p className="text-sm text-gray-400 mb-4">
            To confirm account deletion, type <span className="text-red-400 font-mono font-bold">DELETE</span> below.
          </p>

          <input
            type="text"
            placeholder='Type "DELETE"'
            value={deleteConfirm}
            onChange={e => setDeleteConfirm(e.target.value.toUpperCase())}
            className="w-full px-4 py-3 bg-transparent border-2 border-red-500/30 rounded-lg text-white text-sm focus:border-red-500 outline-none transition-colors mb-4 placeholder:text-gray-600"
            autoFocus
          />

          <div className="flex gap-3">
            <button
              onClick={closeDeleteModal}
              className="flex-1 px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-white font-medium text-sm hover:bg-white/10 transition duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== 'DELETE' || isDeleting}
              className="flex-1 px-6 py-3 rounded-lg bg-red-600 text-white font-bold text-sm uppercase tracking-wider hover:bg-red-700 transition duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </div>
    )}
  </>
);

export default SettingsDanger;
