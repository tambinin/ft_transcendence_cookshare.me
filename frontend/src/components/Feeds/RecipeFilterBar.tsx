import { useState, useEffect, useRef } from 'react';
import { IoIosArrowDown } from 'react-icons/io';
import { FiFilter, FiX } from 'react-icons/fi';
import recipeService from '../../services/recipe.service';
import type { RecipeCategory, Difficulty, RecipeSortField, SortOrder } from '../../types/recipe.type';

interface RecipeFilterBarProps {
	onFilterChange: (filters: {
		categoryId?: string;
		difficulty?: Difficulty;
		sortBy?: RecipeSortField;
		sortOrder?: SortOrder;
	}) => void;
	activeFilters: {
		categoryId?: string;
		difficulty?: Difficulty;
		sortBy?: RecipeSortField;
		sortOrder?: SortOrder;
	};
}

const DIFFICULTIES: { label: string; value: Difficulty }[] = [
	{ label: 'Easy', value: 'EASY' },
	{ label: 'Medium', value: 'MEDIUM' },
	{ label: 'Hard', value: 'HARD' },
];

const SORT_OPTIONS: { label: string; sortBy: RecipeSortField; sortOrder: SortOrder }[] = [
	{ label: 'Newest', sortBy: 'createdAt', sortOrder: 'desc' },
	{ label: 'Oldest', sortBy: 'createdAt', sortOrder: 'asc' },
	{ label: 'Top Rated', sortBy: 'averageScore', sortOrder: 'desc' },
	{ label: 'Most Viewed', sortBy: 'viewCount', sortOrder: 'desc' },
];

/* ── Dropdown rendered via portal to avoid overflow clipping ── */
const DropdownPortal = ({
	anchorRef,
	isOpen,
	align = 'left',
	children,
}: {
	anchorRef: React.RefObject<HTMLElement | null>;
	isOpen: boolean;
	align?: 'left' | 'right';
	children: React.ReactNode;
}) => {
	const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

	useEffect(() => {
		if (!isOpen || !anchorRef.current) return;
		const update = () => {
			const rect = anchorRef.current!.getBoundingClientRect();
			setPos({ top: rect.bottom + 4, left: align === 'right' ? rect.right : rect.left, width: rect.width });
		};
		update();
		window.addEventListener('scroll', update, true);
		window.addEventListener('resize', update);
		return () => {
			window.removeEventListener('scroll', update, true);
			window.removeEventListener('resize', update);
		};
	}, [isOpen, anchorRef, align]);

	if (!isOpen) return null;

	return (
		<div
			className="fixed z-[100]"
			style={{
				top: pos.top,
				...(align === 'right'
					? { right: window.innerWidth - pos.left }
					: { left: Math.max(8, Math.min(pos.left, window.innerWidth - 200)) }),
			}}
		>
			{children}
		</div>
	);
};

const RecipeFilterBar = ({ onFilterChange, activeFilters }: RecipeFilterBarProps) => {
	const [categories, setCategories] = useState<RecipeCategory[]>([]);
	const [categoryOpen, setCategoryOpen] = useState(false);
	const [sortOpen, setSortOpen] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);
	const categoryBtnRef = useRef<HTMLButtonElement>(null);
	const sortBtnRef = useRef<HTMLButtonElement>(null);
	const categoryRef = useRef<HTMLUListElement>(null);
	const sortRef = useRef<HTMLUListElement>(null);

	const hasActiveFilters = !!(activeFilters.categoryId || activeFilters.difficulty || activeFilters.sortBy);

	useEffect(() => {
		recipeService.getCategories()
			.then(cats => setCategories(cats))
			.catch(() => {});
	}, []);

	useEffect(() => {
		const handleClick = (e: MouseEvent) => {
			const target = e.target as Node;
			if (categoryRef.current && !categoryRef.current.contains(target) &&
				categoryBtnRef.current && !categoryBtnRef.current.contains(target)) {
				setCategoryOpen(false);
			}
			if (sortRef.current && !sortRef.current.contains(target) &&
				sortBtnRef.current && !sortBtnRef.current.contains(target)) {
				setSortOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	}, []);

	const clearFilters = () => {
		onFilterChange({
			categoryId: undefined,
			difficulty: undefined,
			sortBy: undefined,
			sortOrder: undefined,
		});
	};

	const activeSortLabel = SORT_OPTIONS.find(
		s => s.sortBy === activeFilters.sortBy && s.sortOrder === activeFilters.sortOrder
	)?.label;

	const activeCategoryName = categories.find(c => c.id === activeFilters.categoryId)?.name;

	return (
		<div className="bg-white/[0.03] border border-white/5 rounded-xl p-2 sm:p-3 space-y-2 sm:space-y-3">
			<div className="flex items-center justify-between">
				<button
					onClick={() => setIsExpanded(!isExpanded)}
					className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all
						${hasActiveFilters ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-white/50 hover:text-white/70'}`}
				>
					<FiFilter size={12} className="sm:hidden" />
					<FiFilter size={14} className="hidden sm:block" />
					Filters
					{hasActiveFilters && (
						<span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
							{[activeFilters.categoryId, activeFilters.difficulty, activeFilters.sortBy].filter(Boolean).length}
						</span>
					)}
				</button>

				<div className="flex items-center gap-2">
					{!isExpanded && activeCategoryName && (
						<span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-orange-500/10 text-orange-400 text-xs rounded-full">
							{activeCategoryName}
							<button onClick={() => onFilterChange({ ...activeFilters, categoryId: undefined })} className="hover:text-white transition-colors">
								<FiX size={10} />
							</button>
						</span>
					)}
					{!isExpanded && activeFilters.difficulty && (
						<span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-orange-500/10 text-orange-400 text-xs rounded-full">
							{DIFFICULTIES.find(d => d.value === activeFilters.difficulty)?.label}
							<button onClick={() => onFilterChange({ ...activeFilters, difficulty: undefined })} className="hover:text-white transition-colors">
								<FiX size={10} />
							</button>
						</span>
					)}

					{hasActiveFilters && (
						<button
							onClick={clearFilters}
							className="text-xs text-white/40 hover:text-red-400 transition-colors px-2 py-1"
						>
							Clear all
						</button>
					)}
				</div>
			</div>

			{isExpanded && (
				<div className="flex flex-nowrap items-center gap-1.5 sm:gap-3 pt-2 border-t border-white/5 overflow-x-auto">
					{/* Category dropdown */}
					<div className="relative shrink-0">
						<button
							ref={categoryBtnRef}
							onClick={() => { setCategoryOpen(!categoryOpen); setSortOpen(false); }}
							className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-all border min-h-[32px] sm:min-h-[40px] whitespace-nowrap
								${activeFilters.categoryId
									? 'border-orange-500/30 bg-orange-500/10 text-orange-400'
									: 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'}`}
						>
							{activeCategoryName || 'Category'}
							<IoIosArrowDown size={10} className={`transition-transform sm:text-xs ${categoryOpen ? 'rotate-180' : ''}`} />
						</button>
					</div>

					{/* Difficulty pills */}
					<div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
						{DIFFICULTIES.map(d => (
							<button
								key={d.value}
								onClick={() => onFilterChange({
									...activeFilters,
									difficulty: activeFilters.difficulty === d.value ? undefined : d.value,
								})}
								className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all border min-h-[32px] sm:min-h-[40px] whitespace-nowrap
									${activeFilters.difficulty === d.value
										? 'border-orange-500/30 bg-orange-500/10 text-orange-400'
										: 'border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white/70'}`}
							>
								{d.label}
							</button>
						))}
					</div>

					{/* Sort dropdown */}
					<div className="relative sm:ml-auto shrink-0">
						<button
							ref={sortBtnRef}
							onClick={() => { setSortOpen(!sortOpen); setCategoryOpen(false); }}
							className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-all border min-h-[32px] sm:min-h-[40px] whitespace-nowrap
								${activeFilters.sortBy
									? 'border-orange-500/30 bg-orange-500/10 text-orange-400'
									: 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'}`}
						>
							{activeSortLabel || 'Sort by'}
							<IoIosArrowDown size={10} className={`transition-transform sm:text-xs ${sortOpen ? 'rotate-180' : ''}`} />
						</button>
					</div>
				</div>
			)}

			{/* Category dropdown portal — renders outside overflow container */}
			<DropdownPortal anchorRef={categoryBtnRef} isOpen={categoryOpen} align="left">
				<ul
					ref={categoryRef}
					className="w-40 sm:w-48 bg-[var(--cook-bg)] border border-white/10 rounded-lg shadow-2xl overflow-hidden max-h-[200px] sm:max-h-[250px] overflow-y-auto"
				>
					<li
						onClick={() => { onFilterChange({ ...activeFilters, categoryId: undefined }); setCategoryOpen(false); }}
						className="px-2.5 sm:px-3 py-2 sm:py-2.5 cursor-pointer text-xs sm:text-sm text-white/40 hover:bg-white/5 transition-colors"
					>
						All categories
					</li>
					{categories.map(cat => (
						<li
							key={cat.id}
							onClick={() => { onFilterChange({ ...activeFilters, categoryId: cat.id }); setCategoryOpen(false); }}
							className={`px-2.5 sm:px-3 py-2 sm:py-2.5 cursor-pointer text-xs sm:text-sm hover:bg-orange-500/10 hover:text-orange-400 transition-colors
								${activeFilters.categoryId === cat.id ? 'text-orange-400 bg-orange-500/5' : 'text-white/70'}`}
						>
							{cat.name}
						</li>
					))}
				</ul>
			</DropdownPortal>

			{/* Sort dropdown portal */}
			<DropdownPortal anchorRef={sortBtnRef} isOpen={sortOpen} align="left">
				<ul
					ref={sortRef}
					className="w-36 sm:w-40 bg-[var(--cook-bg)] border border-white/10 rounded-lg shadow-2xl overflow-hidden"
				>
					<li
						onClick={() => {
							onFilterChange({ ...activeFilters, sortBy: undefined, sortOrder: undefined });
							setSortOpen(false);
						}}
						className="px-2.5 sm:px-3 py-2 sm:py-2.5 cursor-pointer text-xs sm:text-sm text-white/40 hover:bg-white/5 transition-colors"
					>
						Default
					</li>
					{SORT_OPTIONS.map(opt => (
						<li
							key={opt.label}
							onClick={() => {
								onFilterChange({ ...activeFilters, sortBy: opt.sortBy, sortOrder: opt.sortOrder });
								setSortOpen(false);
							}}
							className={`px-2.5 sm:px-3 py-2 sm:py-2.5 cursor-pointer text-xs sm:text-sm hover:bg-orange-500/10 hover:text-orange-400 transition-colors
								${activeFilters.sortBy === opt.sortBy && activeFilters.sortOrder === opt.sortOrder
									? 'text-orange-400 bg-orange-500/5' : 'text-white/70'}`}
						>
							{opt.label}
						</li>
					))}
				</ul>
			</DropdownPortal>
		</div>
	);
};

export default RecipeFilterBar;
