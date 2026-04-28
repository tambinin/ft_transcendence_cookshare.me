const RecipeSkeleton = () => (
	<div className="min-h-screen bg-(--cook-bg) text-white animate-pulse">
		<div className="h-80 bg-white/10"></div>
		<div className="max-w-6xl mx-auto px-6 py-8">
			<div className="h-10 bg-white/10 rounded w-2/3 mb-4"></div>
			<div className="h-6 bg-white/10 rounded w-1/3 mb-8"></div>
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<div className="lg:col-span-2 space-y-6">
					<div className="h-40 bg-white/10 rounded"></div>
					<div className="h-60 bg-white/10 rounded"></div>
				</div>
				<div className="space-y-6">
					<div className="h-48 bg-white/10 rounded"></div>
				</div>
			</div>
		</div>
	</div>
);

export default RecipeSkeleton;
