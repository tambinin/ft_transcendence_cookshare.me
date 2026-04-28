import { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { FiFolder, FiPlus } from 'react-icons/fi';
import collectionService from '../../services/collection.service';
import { useFeedRefresh } from '../../contexts/feed.context';
import type { Collection } from '../../types/collection.type';

export interface SaveToCollectionModalHandle {
	open: (recipeId: string) => void;
}

const SaveToCollectionModal = forwardRef<SaveToCollectionModalHandle>((_props, ref) => {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const [recipeId, setRecipeId] = useState('');
	const [collections, setCollections] = useState<Collection[]>([]);
	const [selectedId, setSelectedId] = useState('');
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [result, setResult] = useState<'success' | 'conflict' | 'error' | null>(null);
	const [newName, setNewName] = useState('');
	const [creating, setCreating] = useState(false);
	const { triggerRefresh } = useFeedRefresh();

	useImperativeHandle(ref, () => ({
		open: async (id: string) => {
			setRecipeId(id);
			setSelectedId('');
			setResult(null);
			setNewName('');
			setCreating(false);
			dialogRef.current?.showModal();
			setLoading(true);
			try {
				const res = await collectionService.getCollections();
				setCollections(Array.isArray(res.data) ? res.data : []);
			} catch {
				setCollections([]);
			} finally {
				setLoading(false);
			}
		},
	}));

	const handleCreate = async () => {
		const name = newName.trim();
		if (!name || creating) return;
		setCreating(true);
		try {
			const res = await collectionService.createCollection({ name });
			setCollections(prev => [res.data, ...prev]);
			setSelectedId(res.data.id);
			setNewName('');
		} catch { /* ignore */ }
		finally { setCreating(false); }
	};

	const handleSave = async () => {
		if (!selectedId || submitting) return;
		setSubmitting(true);
		setResult(null);
		try {
			await collectionService.addRecipe(selectedId, recipeId);
			setCollections(prev => prev.map(c => c.id === selectedId ? { ...c, _count: { recipes: (c._count?.recipes ?? 0) + 1 } } : c));
			setResult('success');
			triggerRefresh();
			setTimeout(() => dialogRef.current?.close(), 1200);
		} catch (err: any) {
			setResult(err?.response?.status === 409 ? 'conflict' : 'error');
		} finally {
			setSubmitting(false);
		}
	};

	const close = () => dialogRef.current?.close();

	return (
		<dialog ref={dialogRef} className="modal backdrop-blur-sm">
			<div className="modal-box rounded-2xl max-w-md">
				<div className="flex items-center gap-2 mb-4">
					<FiFolder className="text-orange-400" size={20} />
					<h2 className="text-lg font-bold">Save to Collection</h2>
				</div>

				{result === 'success' ? (
					<p className="text-green-400 text-sm text-center py-6">Recipe saved to collection!</p>
				) : result === 'conflict' ? (
					<>
						<p className="text-orange-400 text-sm text-center py-6">This recipe is already in the collection.</p>
						<button onClick={close} className="w-full px-4 py-3 rounded-xl font-semibold text-sm bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-white">Close</button>
					</>
				) : (
					<>
						{loading ? (
							<div className="flex justify-center py-8">
								<span className="loading loading-spinner loading-md text-orange-400" />
							</div>
						) : (
							<>
								<div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
									{collections.length === 0 && (
										<p className="text-sm text-white/40 text-center py-4">No collections yet. Create one below.</p>
									)}
									{collections.map(c => (
										<label
											key={c.id}
											className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
												selectedId === c.id
													? 'border-orange-400/50 bg-orange-500/10'
													: 'border-white/5 bg-white/[0.04] hover:bg-white/[0.06]'
											}`}
										>
											<input
												type="radio"
												name="collection"
												value={c.id}
												checked={selectedId === c.id}
												onChange={() => setSelectedId(c.id)}
												className="accent-orange-500"
											/>
											<span className="text-sm text-white/80 flex-1">{c.name}</span>
											<span className="text-xs text-slate-500">{c._count?.recipes ?? c.recipes?.length ?? 0}</span>
										</label>
									))}
								</div>

								<div className="flex items-center gap-2 mb-4">
									<input
										type="text"
										value={newName}
										onChange={e => setNewName(e.target.value)}
										onKeyDown={e => e.key === 'Enter' && handleCreate()}
										placeholder="New collection name..."
										maxLength={60}
										className="flex-1 bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-orange-400/50 transition-colors"
									/>
									<button
										onClick={handleCreate}
										disabled={!newName.trim() || creating}
										className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 disabled:opacity-30 transition-all"
									>
										<FiPlus size={18} />
									</button>
								</div>
							</>
						)}

						{result === 'error' && (
							<p className="text-red-400 text-xs mb-3">Something went wrong. Please try again.</p>
						)}

						<div className="flex gap-3">
							<button onClick={close} className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-white">Cancel</button>
							<button
								onClick={handleSave}
								disabled={!selectedId || submitting}
								className="flex-1 px-4 py-3 rounded-xl font-bold text-sm bg-orange-500 hover:bg-orange-600 disabled:opacity-30 transition-all text-white"
							>
								{submitting ? 'Saving...' : 'Save'}
							</button>
						</div>
					</>
				)}
			</div>
			<form method="dialog" className="modal-backdrop">
				<button>close</button>
			</form>
		</dialog>
	);
});

SaveToCollectionModal.displayName = 'SaveToCollectionModal';
export default SaveToCollectionModal;
