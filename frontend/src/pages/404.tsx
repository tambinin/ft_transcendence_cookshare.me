import Lottie from "lottie-react";
import { NavLink, useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { useState, useEffect } from "react";

const NotFound = () => {
    const navigate = useNavigate();
    const [animationData, setAnimationData] = useState(null);

    useEffect(() => {
        fetch("/lotties/Error 404.json")
            .then(res => res.json())
            .then(setAnimationData)
            .catch(() => {});
    }, []);

    return (
        <div className="relative w-full min-h-screen flex flex-col items-center justify-center bg-[#111213] px-4 sm:px-6 overflow-hidden">
            <button
                onClick={() => navigate(-1)}
                className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 flex items-center gap-2
                    px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400
                    hover:bg-white/10 hover:text-white transition-all cursor-pointer"
            >
                <IoArrowBack size={18} />
                <span className="text-sm font-medium">Retour</span>
            </button>
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[60%] sm:w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[60px] animate-pulse" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[60%] sm:w-[40%] h-[40%] bg-orange-600/10 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '3s' }} />
            </div>

            <div className="relative flex flex-col items-center w-full max-w-3xl">
                <div className="relative z-200 w-full max-w-[280px] sm:max-w-[350px] md:max-w-[450px] drop-shadow-[0_20px_50px_rgba(249,115,22,0.15)]">
                    {animationData && <Lottie
                        loop={true}
                        animationData={animationData}
                        style={{ width: "100%", height: "auto" }}
                    />}
                </div>
                <div className="relative z-20 mt-4 sm:mt-6 space-y-4 sm:space-y-6 flex flex-col items-center text-center">
                    <div className="space-y-2">
                        <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 tracking-tight">
                            Lost in the kitchen?
                        </h2>
                        <p className="text-gray-500 max-w-xs sm:max-w-sm mx-auto text-xs sm:text-sm md:text-base leading-relaxed">
                            The dish you're looking for was taken off the heat.
                            Let us lead you back to the main menu.
                        </p>
                    </div>
                    <div className="pt-2 sm:pt-4">
                        <NavLink
                            to="/home"
                            className="group relative px-8 py-3 sm:px-10 sm:py-4 bg-orange-500 text-white font-bold rounded-2xl
                            text-sm sm:text-base
                            transition-all duration-500 overflow-hidden shadow-[0_0_20px_rgba(249,115,22,0.3)]
                            hover:shadow-[0_0_15px_rgba(249,115,22,0.5)] hover:-translate-y-1 active:scale-95"
                        >
                            <span className="relative z-10">Back to Home</span>
                        </NavLink>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-4 sm:bottom-8 text-white/10 text-[8px] sm:text-[10px] uppercase tracking-[0.3em] sm:tracking-[0.5em] font-medium">
                Error Code : PAGE_NOT_FOUND
            </div>
        </div>
    );
};

export default NotFound;
