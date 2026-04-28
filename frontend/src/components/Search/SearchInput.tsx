import { FaSearch } from 'react-icons/fa';
import type { SearchInputProps } from './search.types';

const SearchInput = ({
	query, setQuery, isLoading, isMobileExpanded,
	onFocus, onKeyDown, inputRef,
}: SearchInputProps) => (
	<div className="relative grow flex items-center">
		{/* Search icon inside input — hidden on mobile expanded (parent already has close btn) */}
		{!isMobileExpanded && (
			<div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
				<FaSearch className={`text-lg ${isLoading ? 'text-orange-500 animate-pulse' : 'text-gray-500'}`} />
			</div>
		)}

		<input
			ref={inputRef}
			type="text"
			value={query}
			onChange={e => setQuery(e.target.value)}
			onKeyDown={onKeyDown}
			placeholder="Search for a tag, user, recipe, or c..."
			className={`w-full ${isMobileExpanded ? 'bg-transparent' : 'bg-white/5'} 
				placeholder:text-gray-500 ${isMobileExpanded ? 'pl-2 pr-3' : 'pl-10 pr-4'} py-2 text-base
				border ${isMobileExpanded ? 'border-transparent' : 'border-white/10'} text-white/90
				focus:outline-none ${isMobileExpanded ? '' : 'focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30'}
				rounded-xl transition-all duration-300
				${isMobileExpanded ? '' : 'shadow-inner'}`}
			autoFocus={isMobileExpanded}
			onFocus={onFocus}
		/>
	</div>
);

export default SearchInput;
