import { useState, useEffect } from 'react';
import { useCollections } from '../../hooks/useCollections';
import { useFeedRefresh } from '../../contexts/feed.context';
import { useRecipeModal } from '../../contexts/recipe.context';
import { FiFolder, FiPlus, FiTrash2, FiArrowLeft, FiX, FiImage, FiChevronRight } from 'react-icons/fi';
import type { Collection, CollectionRecipe } from '../../types/collection.type';

const getRecipeImageUrl = (cr: CollectionRecipe): string | undefined =>
	cr.recipe?.primaryImage?.url || cr.recipe?.images?.[0]?.url;

const CollectionSkeleton = () => (
	<div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 animate-pulse">
		<div className="flex items-center gap-4">
			<div className="w-12 h-12 rounded-xl bg-white/5" />
			<div className="flex-1 space-y-2">
				<div className="h-4 bg-white/5 rounded w-1/3" />
				<div className="h-3 bg-white/5 rounded w-1/5" />
			</div>
			<div className="w-5 h-5 rounded bg-white/5" />
		</div>
	</div>
);

const CollectionFeed = () => {
	const {
		collections, selectedCollection, loading,
		setSelectedCollection, fetchCollection, fetchCollections,
		createCollection, deleteCollection, removeRecipe,
	} = useCollections();
	const { refreshKey } = useFeedRefresh();
	const { openRecipeModal } = useRecipeModal();

	useEffect(() => {
		fetchCollections();
	}, [refreshKey, fetchCollections]);

	const [showCreate, setShowCreate] = useState(false);
	const [newName, setNewName] = useState('');
	const [newDesc, setNewDesc] = useState('');
	const [creating, setCreating] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [removingId, setRemovingId] = useState<string | null>(null);

	const handleCreate = async () => {
		if (!newName.trim() || creating) return;
		setCreating(true);
		try {
			await createCollection({ name: newName.trim(), description: newDesc.trim() || undefined });
			setNewName('');
			setNewDesc('');
			setShowCreate(false);
		} catch { /* silent */ }
		finally { setCreating(false); }
	};

	const handleDelete = async (id: string) => {
		setDeletingId(id);
		try {
			await deleteCollection(id);
		} catch { /* silent */ }
		finally { setDeletingId(null); }
	};

	const handleOpenCollection = async (c: Collection) => {
		await fetchCollection(c.id);
	};

	const handleRemoveRecipe = async (recipeId: string) => {
		if (!selectedCollection) return;
		setRemovingId(recipeId);
		try {
			await removeRecipe(selectedCollection.id, recipeId);
		} catch { /* silent */ }
		finally { setRemovingId(null); }
	};

	const stickyHeader = (
		<div className="sticky top-0 z-10 bg-[var(--cook-bg)] py-2">
			{selectedCollection ? (
				<div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3">
					<button
						onClick={() => setSelectedCollection(null)}
						className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
					>
						<FiArrowLeft size={16} />
					</button>
					<div className="flex-1 min-w-0">
						<span className="block text-sm font-bold text-white truncate">{selectedCollection.name}</span>
						{selectedCollection.description && (
							<span className="block text-xs text-white/40 truncate">{selectedCollection.description}</span>
						)}
					</div>
					<span className="text-xs text-white/30 bg-white/5 px-2.5 py-1 rounded-full shrink-0">
						{selectedCollection.recipes.length} recipe{selectedCollection.recipes.length !== 1 ? 's' : ''}
					</span>
				</div>
			) : (
				<div className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3">
					<div className="flex items-center gap-3">
						<div className="flex items-center justify-center w-9 h-9 rounded-lg bg-orange-500/10">
							<FiFolder size={18} className="text-orange-400" />
						</div>
						<div>
							<span className="block text-sm font-bold text-white">Collections</span>
							<span className="block text-xs text-white/40">
								{collections.length} collection{collections.length !== 1 ? 's' : ''}
							</span>
						</div>
					</div>
					<button
						onClick={() => setShowCreate(!showCreate)}
						className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-all ${
							showCreate
								? 'bg-white/10 text-white/70'
								: 'bg-orange-500/15 text-orange-400 hover:bg-orange-500/25'
						}`}
					>
						{showCreate ? <FiX size={14} /> : <FiPlus size={14} />}
						{showCreate ? 'Cancel' : 'New'}
					</button>
				</div>
			)}
		</div>
	);

	if (loading) {
		return (
			<div className="flex flex-col sm:mr-2 space-y-4 mb-6 px-3 sm:px-0">
				{stickyHeader}
				<CollectionSkeleton />
				<CollectionSkeleton />
				<CollectionSkeleton />
			</div>
		);
	}

	if (selectedCollection) {
		return (
			<div className="flex flex-col sm:mr-2 space-y-4 mb-6 px-3 sm:px-0">
				{stickyHeader}

				{selectedCollection.recipes.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-16 text-center">
						<div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-5">
							<FiImage size={32} className="text-white/10" />
						</div>
						<p className="text-white/50 text-sm font-medium mb-1">This collection is empty</p>
						<p className="text-white/25 text-xs">Add recipes from the feed using the bookmark button</p>
					</div>
				) : (
					<div className="space-y-2">
						{selectedCollection.recipes.map((cr, index) => (
							<div
								key={`${cr.recipeId}-${index}`}
								onClick={() => openRecipeModal(cr.recipeId)}
								className={`flex items-center gap-4 p-3 bg-white/[0.03] hover:bg-white/[0.05] rounded-xl border border-white/5 group transition-all cursor-pointer ${
									removingId === cr.recipeId ? 'opacity-50 scale-[0.98]' : ''
								}`}
							>
								<div className="w-14 h-14 rounded-xl bg-white/5 overflow-hidden shrink-0 flex items-center justify-center">
									{getRecipeImageUrl(cr) ? (
										<img
											src={getRecipeImageUrl(cr)}
											alt={cr.recipe?.title || ''}
											loading="lazy"
											className="w-full h-full object-cover"
										/>
									) : (
										<FiImage size={18} className="text-white/15" />
									)}
								</div>
								<div className="flex-1 min-w-0 text-left">
									<p className="text-sm font-medium text-white/80 truncate group-hover:text-orange-400 transition-colors">
										{cr.recipe?.title || 'Untitled Recipe'}
									</p>
									<p className="text-xs text-white/30 mt-0.5">
										Added {new Date(cr.addedAt).toLocaleDateString('fr-FR', {
											day: 'numeric',
											month: 'short',
											year: 'numeric',
										})}
									</p>
								</div>
								<button
									onClick={(e) => { e.stopPropagation(); handleRemoveRecipe(cr.recipeId); }}
									disabled={removingId === cr.recipeId}
									className="flex items-center justify-center w-8 h-8 rounded-lg text-white/15 hover:text-red-400 hover:bg-red-500/10 sm:opacity-0 sm:group-hover:opacity-100 transition-all disabled:opacity-50"
									title="Remove from collection"
								>
									<FiX size={16} />
								</button>
							</div>
						))}
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="flex flex-col sm:mr-2 space-y-4 mb-6 px-3 sm:px-0">
			{stickyHeader}

			{/* Create form */}
			{showCreate && (
				<div className="p-4 bg-white/[0.03] rounded-xl border border-orange-500/20 space-y-3 animate-fade-in-up">
					<div className="flex items-center gap-2 mb-1">
						<div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
							<FiPlus size={14} className="text-orange-400" />
						</div>
						<span className="text-sm font-medium text-white/70">New Collection</span>
					</div>
					<input
						type="text"
						value={newName}
						onChange={e => setNewName(e.target.value)}
						onKeyDown={e => e.key === 'Enter' && handleCreate()}
						placeholder="Collection name..."
						className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-orange-400/40 transition-colors"
						autoFocus
					/>
					<input
						type="text"
						value={newDesc}
						onChange={e => setNewDesc(e.target.value)}
						onKeyDown={e => e.key === 'Enter' && handleCreate()}
						placeholder="Description (optional)"
						className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-orange-400/40 transition-colors"
					/>
					<div className="flex gap-2 justify-end pt-1">
						<button
							onClick={() => { setShowCreate(false); setNewName(''); setNewDesc(''); }}
							className="px-4 py-2 text-xs text-white/40 hover:text-white/70 rounded-lg transition-colors"
						>
							Cancel
						</button>
						<button
							onClick={handleCreate}
							disabled={!newName.trim() || creating}
							className="px-5 py-2 text-xs font-medium bg-orange-500 hover:bg-orange-600 disabled:opacity-30 disabled:hover:bg-orange-500 text-white rounded-lg transition-colors"
						>
							{creating ? (
								<span className="flex items-center gap-2">
									<span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
									Creating...
								</span>
							) : 'Create Collection'}
						</button>
					</div>
				</div>
			)}

			{collections.length === 0 && !showCreate ? (
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-5">
						<FiFolder size={32} className="text-white/10" />
					</div>
					<p className="text-white/50 text-sm font-medium mb-1">No collections yet</p>
					<p className="text-white/25 text-xs mb-6">Create one to organize your favorite recipes</p>
					<button
						onClick={() => setShowCreate(true)}
						className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-orange-500/15 text-orange-400 hover:bg-orange-500/25 rounded-xl transition-colors"
					>
						<FiPlus size={16} />
						Create your first collection
					</button>
				</div>
			) : (
				<div className="space-y-2">
					{collections.map(c => {
						const recipeCount = c._count?.recipes ?? c.recipes?.length ?? 0;
						const previewImage = c.recipes?.[0] ? getRecipeImageUrl(c.recipes[0]) : undefined;
						return (
							<div
								key={c.id}
								onClick={() => handleOpenCollection(c)}
								className="flex items-center gap-4 p-3 bg-white/[0.03] hover:bg-white/[0.05] rounded-xl border border-white/5 hover:border-white/10 group transition-all cursor-pointer"
							>
								{/* Thumbnail */}
								<div className="w-14 h-14 rounded-xl bg-white/5 overflow-hidden shrink-0 flex items-center justify-center">
									{previewImage ? (
										<img src={previewImage} alt="" className="w-full h-full object-cover" />
									) : (
										<FiFolder size={20} className="text-orange-400/30" />
									)}
								</div>

								{/* Info */}
								<div className="flex-1 min-w-0 text-left">
									<p className="text-sm font-semibold text-white/80 truncate group-hover:text-white transition-colors">
										{c.name}
									</p>
									<p className="text-xs text-white/30 mt-0.5">
										{recipeCount} recipe{recipeCount > 1 ? 's' : ''}
										{c.description && ` · ${c.description}`}
									</p>
								</div>

								{/* Actions */}
								<div className="flex items-center gap-1 shrink-0">
									<button
										onClick={e => { e.stopPropagation(); handleDelete(c.id); }}
										disabled={deletingId === c.id}
										className="flex items-center justify-center w-8 h-8 rounded-lg text-white/10 hover:text-red-400 hover:bg-red-500/10 sm:opacity-0 sm:group-hover:opacity-100 transition-all disabled:opacity-50"
										title="Delete collection"
									>
										{deletingId === c.id ? (
											<span className="w-3 h-3 border-2 border-white/20 border-t-red-400 rounded-full animate-spin" />
										) : (
											<FiTrash2 size={14} />
										)}
									</button>
									<FiChevronRight size={16} className="text-white/15 group-hover:text-orange-400 transition-colors" />
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};

export default CollectionFeed;
