import { useAuth } from '../../hooks/useAuth';

const DeconnexionModal = ({ modelRef }: any) => {
	const { logout } = useAuth();
	return (
        <dialog
            ref={modelRef}
            className="modal backdrop-blur-sm"
        >
            <div className="modal-box rounded-2xl"
            >
                <div className="flex flex-col">
                    <h2 className="text-xl font-bold text-center mb-2 tracking-tight">
                        Sign Out
                    </h2>

                    <p className="text-gray-400 text-center text-sm leading-relaxed mb-8">
                        Are you sure you want to sign out? You will need to enter your credentials again to access your account.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            type="button"
                            onClick={
								() => modelRef.current?.close()
							}
                            className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm
                            bg-white/5 hover:bg-white/10 border border-white/10
                            transition-all active:scale-95 text-white"
                        >
                            CANCEL
                        </button>
                        <button
                            type="button"
							onClick={logout}
                            className="flex-1 px-4 py-3 rounded-xl font-bold text-sm
                            bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20
                            transition-all active:scale-95 text-white"
                        >
                            LOG OUT
                        </button>
                    </div>
                </div>
            </div>
        </dialog>
    );
}
export default DeconnexionModal
