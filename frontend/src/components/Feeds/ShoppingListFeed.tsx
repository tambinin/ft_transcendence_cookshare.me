import { useState, useRef, useEffect, useMemo } from 'react';
import { useShoppingListContext } from '../../contexts/shoppingList.context';
import { FiPlus, FiTrash2, FiCheck, FiShoppingCart, FiX, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { BiTrash } from 'react-icons/bi';
import { GiCampCookingPot } from 'react-icons/gi';

/* ─── skeleton ─── */
const ItemSkeleton = () => (
	<div className="flex items-center gap-3 px-4 py-3 bg-white/[0.03] border border-white/5 rounded-xl animate-pulse">
		<div className="w-5 h-5 rounded-md bg-white/5" />
		<div className="flex-1 h-4 bg-white/5 rounded w-2/5" />
		<div className="w-10 h-3 bg-white/5 rounded" />
	</div>
);

const ShoppingListFeed = () => {
	const { items, loading, addItem, toggleItem, deleteItem, removeRecipeItems, clearChecked, clearAll, refresh } = useShoppingListContext();
	const [newName, setNewName] = useState('');
	const [newQty, setNewQty] = useState('');
	const [showInput, setShowInput] = useState(false);
	const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
	const inputRef = useRef<HTMLInputElement>(null);

	// Re-fetch when the feed mounts (ensures data is fresh on navigation)
	useEffect(() => {
		refresh();
	}, [refresh]);

	const unchecked = items.filter(i => !i.isChecked);
	const checked = items.filter(i => i.isChecked);

	// Group unchecked items: by recipe and loose items
	const { recipeGroups, looseItems } = useMemo(() => {
		const groupMap = new Map<string, { recipeId: string; recipeTitle: string; items: typeof unchecked }>();
		const loose: typeof unchecked = [];

		for (const item of unchecked) {
			if (item.recipeId && item.recipeTitle) {
				const existing = groupMap.get(item.recipeId);
				if (existing) {
					existing.items.push(item);
				} else {
					groupMap.set(item.recipeId, {
						recipeId: item.recipeId,
						recipeTitle: item.recipeTitle,
						items: [item],
					});
				}
			} else {
				loose.push(item);
			}
		}

		return { recipeGroups: Array.from(groupMap.values()), looseItems: loose };
	}, [unchecked]);

	// Group checked items by recipe too
	const { checkedRecipeGroups, checkedLooseItems } = useMemo(() => {
		const groupMap = new Map<string, { recipeId: string; recipeTitle: string; items: typeof checked }>();
		const loose: typeof checked = [];

		for (const item of checked) {
			if (item.recipeId && item.recipeTitle) {
				const existing = groupMap.get(item.recipeId);
				if (existing) {
					existing.items.push(item);
				} else {
					groupMap.set(item.recipeId, {
						recipeId: item.recipeId,
						recipeTitle: item.recipeTitle,
						items: [item],
					});
				}
			} else {
				loose.push(item);
			}
		}

		return { checkedRecipeGroups: Array.from(groupMap.values()), checkedLooseItems: loose };
	}, [checked]);

	useEffect(() => {
		if (showInput && inputRef.current) {
			inputRef.current.focus();
		}
	}, [showInput]);

	const handleAdd = async () => {
		if (!newName.trim()) return;
		await addItem(newName.trim(), newQty.trim() || undefined);
		setNewName('');
		setNewQty('');
		inputRef.current?.focus();
	};

	const toggleGroupCollapse = (groupId: string) => {
		setCollapsedGroups(prev => {
			const next = new Set(prev);
			if (next.has(groupId)) next.delete(groupId);
			else next.add(groupId);
			return next;
		});
	};

	/* ─── single item row ─── */
	// RESPONSIVE FIX: show only quantity (full description) when available, else name
	const renderItem = (item: typeof items[0], isCheckedItem = false) => (
		<div
			key={item.id}
			className={`flex items-center gap-2 px-3 py-2.5 ${
				isCheckedItem
					? 'bg-white/[0.015] hover:bg-white/[0.03] border-white/[0.03]'
					: 'bg-white/[0.02] hover:bg-white/[0.04] border-white/5'
			} rounded-lg border group transition-all`}
		>
			{/* Checkbox */}
			<button
				onClick={() => toggleItem(item.id)}
				className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
					isCheckedItem
						? 'border-orange-500/30 bg-orange-500/15'
						: 'border-white/15 hover:border-orange-400 hover:bg-orange-500/10'
				}`}
			>
				{isCheckedItem && <FiCheck size={11} className="text-orange-400" />}
			</button>
			{/* Show quantity + name together; fall back to name only when no quantity */}
			<span className={`flex-1 min-w-0 text-sm text-left ${isCheckedItem ? 'text-white/25 line-through' : 'text-white/80'}`}>
				{item.quantity ? `${item.quantity} ${item.name}` : item.name}
			</span>
			{/* Delete */}
			<button
				onClick={() => deleteItem(item.id)}
				className="flex items-center justify-center w-7 h-7 shrink-0 rounded-lg text-white/15 hover:text-red-400 hover:bg-red-500/10 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
			>
				<FiTrash2 size={13} />
			</button>
		</div>
	);

	/* ─── recipe group container ─── */
	// RESPONSIVE FIX: improve group header touch targets and spacing on mobile
	const renderRecipeGroup = (group: { recipeId: string; recipeTitle: string; items: typeof items }, isCheckedGroup = false) => {
		const isCollapsed = collapsedGroups.has(group.recipeId + (isCheckedGroup ? '-done' : ''));
		const groupId = group.recipeId + (isCheckedGroup ? '-done' : '');
		const checkedCount = group.items.filter(i => i.isChecked).length;
		const totalCount = group.items.length;

		return (
			<div key={groupId} className={`rounded-xl border overflow-hidden transition-all ${
				isCheckedGroup
					? 'bg-white/[0.01] border-white/[0.03]'
					: 'bg-white/[0.02] border-orange-500/10'
			}`}>
				{/* Group header */}
				{/* RESPONSIVE FIX: compact group header, adequate tap area */}
				<div
					onClick={() => toggleGroupCollapse(groupId)}
					className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 cursor-pointer select-none transition-all ${
						isCheckedGroup
							? 'hover:bg-white/[0.02]'
							: 'hover:bg-white/[0.04]'
					}`}
				>
					<div className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${
						isCheckedGroup ? 'bg-white/5' : 'bg-orange-500/10'
					}`}>
						<GiCampCookingPot size={15} className={isCheckedGroup ? 'text-white/20' : 'text-orange-400'} />
					</div>
					<div className="flex-1 min-w-0 text-left">
						<span className={`text-sm font-semibold block truncate text-left ${
							isCheckedGroup ? 'text-white/25 line-through' : 'text-orange-300'
						}`}>
							{group.recipeTitle}
						</span>
						<span className={`text-[10px] block text-left ${isCheckedGroup ? 'text-white/15' : 'text-white/30'}`}>
							{totalCount} ingrédient{totalCount > 1 ? 's' : ''}
							{!isCheckedGroup && checkedCount > 0 && ` · ${checkedCount} fait`}
						</span>
					</div>
					{!isCheckedGroup && (
						<button
							onClick={(e) => { e.stopPropagation(); removeRecipeItems(group.recipeId); }}
							className="flex items-center justify-center w-7 h-7 rounded-lg text-white/15 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
							title="Remove all ingredients from this recipe"
						>
							<FiTrash2 size={13} />
						</button>
					)}
					{isCollapsed
						? <FiChevronRight size={14} className={isCheckedGroup ? 'text-white/15' : 'text-white/30'} />
						: <FiChevronDown size={14} className={isCheckedGroup ? 'text-white/15' : 'text-white/30'} />
					}
				</div>
				{/* Items */}
				{!isCollapsed && (
					<div className="px-2 pb-2 space-y-1">
						{group.items.map(item => renderItem(item, isCheckedGroup))}
					</div>
				)}
			</div>
		);
	};

	/* ─── sticky header ─── */
	// RESPONSIVE FIX: adjust top offset for mobile vs desktop navbar height
	const stickyHeader = (
		<div className="sticky top-0 z-10 bg-[var(--cook-bg)] py-2">
			{/* RESPONSIVE FIX: reduce padding on mobile, flex-wrap actions on narrow screens */}
			<div className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 gap-2">
				<div className="flex items-center gap-2 sm:gap-3 min-w-0">
					<div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-orange-500/10 shrink-0">
						<FiShoppingCart size={16} className="text-orange-400 sm:hidden" />
						<FiShoppingCart size={18} className="text-orange-400 hidden sm:block" />
					</div>
					<div className="min-w-0">
						<span className="block text-xs sm:text-sm font-bold text-white truncate">Shopping List</span>
						<p className="text-[10px] sm:text-xs text-white/40 truncate">
							{unchecked.length} item{unchecked.length !== 1 ? 's' : ''}
							{checked.length > 0 && ` · ${checked.length} done`}
							{recipeGroups.length > 0 && <span className="hidden sm:inline"> · {recipeGroups.length} recette{recipeGroups.length > 1 ? 's' : ''}</span>}
						</p>
					</div>
				</div>
				{/* RESPONSIVE FIX: compact action buttons */}
				<div className="flex items-center gap-1 sm:gap-2 shrink-0">
					{items.length > 0 && (
						<div className="flex items-center gap-1 sm:gap-1.5">
							{checked.length > 0 && (
								<button
									onClick={clearChecked}
									className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium text-white/40 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg transition-all"
									title="Clear completed items"
								>
									<FiTrash2 size={12} />
									<span className="hidden sm:inline">Clear done</span>
								</button>
							)}
							<button
								onClick={clearAll}
								className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium text-white/40 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg transition-all"
								title="Clear all items"
							>
								<BiTrash size={13} />
								<span className="hidden sm:inline">Clear all</span>
							</button>
						</div>
					)}
					<button
						onClick={() => setShowInput(!showInput)}
						className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-medium rounded-lg transition-all ${
							showInput
								? 'bg-white/10 text-white/70'
								: 'bg-orange-500/15 text-orange-400 hover:bg-orange-500/25'
						}`}
					>
						{showInput ? <FiX size={14} /> : <FiPlus size={14} />}
						{showInput ? 'Close' : 'Add'}
					</button>
				</div>
			</div>
		</div>
	);

	/* ─── loading ─── */
	if (loading) {
		return (
			<div className="flex flex-col sm:mr-2 space-y-4 mb-6 px-3 sm:px-0">
				{stickyHeader}
				<ItemSkeleton />
				<ItemSkeleton />
				<ItemSkeleton />
				<ItemSkeleton />
			</div>
		);
	}

	return (
		<div className="flex flex-col sm:mr-2 space-y-4 mb-6 px-3 sm:px-0">
			{stickyHeader}

			{/* Add item form */}
			{/* RESPONSIVE FIX: stack inputs on very small screens, ensure 16px font-size */}
			{showInput && (
				<div className="flex flex-wrap sm:flex-nowrap gap-2 p-3 bg-white/[0.03] border border-orange-500/20 rounded-xl animate-fade-in-up">
					<input
						ref={inputRef}
						type="text"
						value={newName}
						onChange={e => setNewName(e.target.value)}
						onKeyDown={e => e.key === 'Enter' && handleAdd()}
						placeholder="Add an item..."
						className="flex-1 min-w-0 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-base sm:text-sm text-white placeholder:text-white/25 outline-none focus:border-orange-400/40 transition-colors"
					/>
					<input
						type="text"
						value={newQty}
						onChange={e => setNewQty(e.target.value)}
						onKeyDown={e => e.key === 'Enter' && handleAdd()}
						placeholder="Qty"
						className="w-20 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-base sm:text-sm text-white text-center placeholder:text-white/25 outline-none focus:border-orange-400/40 transition-colors"
					/>
					<button
						onClick={handleAdd}
						disabled={!newName.trim()}
						className="flex items-center justify-center w-10 h-10 bg-orange-500 hover:bg-orange-600 disabled:opacity-30 disabled:hover:bg-orange-500 rounded-xl text-white transition-colors shrink-0"
					>
						<FiPlus size={18} />
					</button>
				</div>
			)}

			{/* Empty state */}
			{items.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-5">
						<FiShoppingCart size={32} className="text-white/10" />
					</div>
					<p className="text-white/50 text-sm font-medium mb-1">Your shopping list is empty</p>
					<p className="text-white/25 text-xs mb-6">Add items manually or from a recipe</p>
					{!showInput && (
						<button
							onClick={() => setShowInput(true)}
							className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-orange-500/15 text-orange-400 hover:bg-orange-500/25 rounded-xl transition-colors"
						>
							<FiPlus size={16} />
							Add your first item
						</button>
					)}
				</div>
			) : (
				<div className="space-y-3">
					{/* Progress bar */}
					<div className="px-1 pb-1">
						<div className="flex items-center justify-between text-xs text-white/30 mb-1.5">
							<span>{checked.length} of {items.length} done</span>
							<span>{items.length > 0 ? Math.round((checked.length / items.length) * 100) : 0}%</span>
						</div>
						<div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
							<div
								className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-500"
								style={{ width: `${items.length > 0 ? (checked.length / items.length) * 100 : 0}%` }}
							/>
						</div>
					</div>

					{/* ─── Recipe groups (unchecked) ─── */}
					{recipeGroups.map(group => renderRecipeGroup(group, false))}

					{/* ─── Loose items (unchecked, no recipe) ─── */}
					{looseItems.length > 0 && (
						<>
							{recipeGroups.length > 0 && (
								<div className="flex items-center gap-2 pt-2 pb-1 px-1">
									<div className="h-px flex-1 bg-white/5" />
									<span className="text-[10px] text-white/20 font-medium uppercase tracking-wider">
										Other items
									</span>
									<div className="h-px flex-1 bg-white/5" />
								</div>
							)}
							<div className="space-y-1.5">
								{looseItems.map(item => renderItem(item))}
							</div>
						</>
					)}

					{/* ─── Done section ─── */}
					{checked.length > 0 && (
						<>
							<div className="flex items-center gap-2 pt-4 pb-1 px-1">
								<div className="h-px flex-1 bg-white/5" />
								<span className="text-xs text-white/25 font-medium">
									Done ({checked.length})
								</span>
								<div className="h-px flex-1 bg-white/5" />
							</div>
							{/* Checked recipe groups */}
							{checkedRecipeGroups.map(group => renderRecipeGroup(group, true))}
							{/* Checked loose items */}
							{checkedLooseItems.length > 0 && (
								<div className="space-y-1">
									{checkedLooseItems.map(item => renderItem(item, true))}
								</div>
							)}
						</>
					)}
				</div>
			)}
		</div>
	);
};

export default ShoppingListFeed;
