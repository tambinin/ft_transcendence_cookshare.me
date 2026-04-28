import { useState, useEffect, useCallback, useRef } from 'react'
import Footer from '../components/Footer'
import Pollaroide from '../components/Pollaroide'
import NavigationButton from '../components/NavigationButton'
import Title from '../components/Title'
import data from '../data/homePageData.json';

const { usersImages: UsersImages, recipeImages, usersName: UsersName, recipeNames } = data;

const HomePage = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const totalImages = recipeImages.length;
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const increaseIndex = useCallback(() => {
        setCurrentIndex(prev => (prev + 1) % totalImages);
    }, [totalImages]);

    useEffect(() => {
        intervalRef.current = setInterval(increaseIndex, 4000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [increaseIndex]);

    return (
        <>
            <link rel="preload" as="image" href={recipeImages[0]} type="image/webp" />
            <nav className="flex flex-row justify-between items-center m-2 mx-4 md:mx-12">
                <Title slogan="primary" variant="primary" />
                <div>
                    <NavigationButton to="/login" variant="primary" width='w-24 sm:w-32' height='h-10 sm:h-12'>Sign In</NavigationButton>
                </div>
            </nav>
            <main className="flex flex-col md:grid md:grid-cols-2 gap-8 md:gap-24 m-2 mx-4 md:mx-12 mt-8 md:mt-0">
                <div className="order-1 md:col-start-1 flex flex-col items-center md:items-start">
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-semibold text-center md:text-left leading-tight">
                        Ready to bring the <br /><span className="text-orange-500">heat</span><br /> to the kitchen?
                    </h1>
                </div>
                <div className="order-2 md:col-start-2 md:row-start-1 md:row-span-3 flex justify-center md:justify-end items-center md:m-8">
                    <div className="w-full max-w-[300px] sm:max-w-[450px] md:max-w-[600px] relative">
                        <div className="relative">
                            {recipeImages.map((_, index) => (
                                <div
                                    key={index}
                                    style={{
                                        opacity: currentIndex === index ? 1 : 0,
                                        transition: "opacity 0.8s ease-in-out",
                                        position: index === 0 ? "relative" : "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        pointerEvents: currentIndex === index ? "auto" : "none",
                                    }}
                                >
                                    <Pollaroide
                                        username={UsersName[index]}
                                        userImage={UsersImages[index]}
                                        recipeName={recipeNames[index]}
                                        recipeImage={recipeImages[index]}
                                        isActive={currentIndex === index}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="absolute -bottom-8 inset-x-0 flex flex-row gap-2 justify-center">
                            {recipeImages.map((_, index) =>
                                currentIndex === index ? (
                                    <div
                                        key={index}
                                        className="w-1 h-1 bg-orange-500 rounded-full cursor-pointer"
                                    ></div>
                                ) : (
                                    <div
                                        key={index}
                                        className="w-1 h-1 bg-gray-400 rounded-full cursor-pointer hover:bg-gray-600 transition"
                                        onClick={() => setCurrentIndex(index)}
                                    ></div>
                                )
                            )}
                        </div>
                    </div>
                </div>
                <div className="order-3 md:col-start-1 flex flex-col items-center md:items-start">
                    <p className='text-base sm:text-lg text-white/80 text-center py-2 md:text-left max-w-2xl'>
                        Join the social network where cooks connect:
                        share your secret recipes, learn from top chefs,
                        chat with 1,000+ food lovers, and get real-time cooking advice from our AI.
                    </p>
                </div>
                <div className="order-4 md:col-start-1 flex justify-center md:justify-start gap-4 mt-2">
                    <NavigationButton to="/register" variant='primary' width='w-48 sm:w-64' height='h-12 sm:h-16'>Start Exploring</NavigationButton>
                </div>
            </main>
            <footer>
                <Footer />
            </footer>
        </>
    )
}

export default HomePage