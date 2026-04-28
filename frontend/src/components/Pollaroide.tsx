interface PollaroideProps {
    username: string;
    userImage: string;
    recipeName: string;
    recipeImage: string;
    isActive?: boolean;
}

const Pollaroide = ({ username, userImage, recipeName, recipeImage, isActive = false }: PollaroideProps) => {

    return (
        <div className='p-3 sm:p-5 border bg-white/100 rounded-lg max-w-full'>
            <div>
                <img
                    src={recipeImage}
                    alt={`Recipe: ${recipeName}`}
                    width={600}
                    height={600}
                    loading={isActive ? 'eager' : 'lazy'}
                    decoding={isActive ? 'sync' : 'async'}
                    fetchPriority={isActive ? 'high' : 'low'}
                    className='w-full max-w-[280px] sm:max-w-md md:max-w-lg aspect-square object-cover rounded-lg'
                />
                <div className='flex items-center justify-between mt-2 sm:mt-4'>
                    <p className='text-start text-lg sm:text-2xl text-amber-600 font-semibold truncate max-w-[60%]'>{recipeName}</p>
                    <div className='flex items-center gap-1 sm:gap-2'>
                        <p className='font-semibold text-sm sm:text-lg text-black truncate max-w-[80px] sm:max-w-[150px]'>{username}</p>
                        <img
                            src={userImage}
                            alt={`User: ${username}`}
                            width={40}
                            height={40}
                            loading="lazy"
                            decoding="async"
                            className='w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover'
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Pollaroide