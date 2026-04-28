const ProfileSkeleton = () => (
	<div className="min-h-screen bg-(--cook-bg) text-white/90">
		<div className="sticky top-0 z-40 bg-(--cook-bg)/95 border-b border-white/5 px-4 py-3 h-14" />
		<div className="max-w-5xl mx-auto px-4 pt-6 pb-12 animate-pulse">
			<div className="flex flex-col items-center">
				<div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/10 mb-3" />
				<div className="h-7 w-40 bg-white/10 rounded mb-1" />
				<div className="flex gap-8 my-4">
					<div className="h-12 w-16 bg-white/10 rounded" />
					<div className="h-12 w-16 bg-white/10 rounded" />
				</div>
				<div className="flex gap-2 w-full max-w-[320px] mt-2 mb-4">
					<div className="flex-1 h-11 bg-white/10 rounded-lg" />
					<div className="flex-1 h-11 bg-white/10 rounded-lg" />
				</div>
			</div>
			<div className="flex border-b border-white/10 mt-8 mb-4">
				<div className="flex-1 pb-3 flex justify-center"><div className="w-6 h-6 bg-white/10 rounded" /></div>
				<div className="flex-1 pb-3 flex justify-center"><div className="w-6 h-6 bg-white/10 rounded" /></div>
			</div>
			<div className="flex flex-col gap-4">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="border-2 border-white/10 rounded-xl overflow-hidden">
						<div className="hidden lg:grid grid-cols-12">
							<div className="col-span-4 p-5">
								<div className="aspect-[4/3] bg-white/10 rounded-xl" />
								<div className="flex justify-center gap-4 mt-3">
									<div className="h-10 w-12 bg-white/10 rounded" />
									<div className="h-10 w-12 bg-white/10 rounded" />
									<div className="h-10 w-12 bg-white/10 rounded" />
								</div>
							</div>
							<div className="col-span-8 p-5 space-y-3">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-full bg-white/10" />
									<div className="h-4 w-28 bg-white/10 rounded" />
								</div>
								<div className="h-6 w-3/4 bg-white/10 rounded" />
								<div className="h-4 w-full bg-white/10 rounded" />
								<div className="h-4 w-2/3 bg-white/10 rounded" />
								<div className="flex gap-2 mt-4">
									<div className="h-7 w-16 bg-white/10 rounded-full" />
									<div className="h-7 w-16 bg-white/10 rounded-full" />
									<div className="h-7 w-20 bg-white/10 rounded-full" />
								</div>
							</div>
						</div>
						<div className="lg:hidden">
							<div className="flex items-center gap-3 p-3">
								<div className="w-9 h-9 rounded-full bg-white/10" />
								<div className="h-4 w-24 bg-white/10 rounded" />
							</div>
							<div className="aspect-[4/3] bg-white/10" />
							<div className="p-3 space-y-2">
								<div className="h-5 w-3/4 bg-white/10 rounded" />
								<div className="h-4 w-full bg-white/10 rounded" />
								<div className="flex gap-2">
									<div className="h-6 w-14 bg-white/10 rounded-full" />
									<div className="h-6 w-14 bg-white/10 rounded-full" />
								</div>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	</div>
);

export default ProfileSkeleton;
