import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Navigation from "../components/Navigation";
import MobileBottomNav from "../components/MobileBottomNav";
import { useFeedRefresh } from "../contexts/feed.context";
import { IoCheckmarkCircle } from "react-icons/io5";

const HomeLayout = () => {
    const { successMessage } = useFeedRefresh();
    return (
        <div className="app bg-[var(--cook-bg)] w-full max-w-[100vw] h-screen flex flex-col overflow-hidden">
            {/* ── Fixed navbar: never scrolls ── */}
            <nav className="shrink-0 z-20 bg-[var(--cook-bg)] pt-2">
                <Navbar />
            </nav>
            {/* ── Body: sidebar + scrollable main ── */}
            <div className="flex flex-1 w-full max-w-[100vw] min-h-0">
                {/* RESPONSIVE FIX: Hide sidebar on mobile, show bottom nav instead */}
                <aside className="hidden md:block md:w-[200px] lg:w-[15%] shrink-0 z-20">
                    <Navigation />
                </aside>
                {/* RESPONSIVE FIX: Add bottom padding on mobile to account for bottom nav */}
                <main className="flex-1 min-w-0 main-content page-enter pb-16 md:pb-4 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
            {/* RESPONSIVE FIX: Bottom nav on mobile */}
            <MobileBottomNav />
            {successMessage && (
                <div className="toast toast-top toast-end z-50">
                    <div className="alert bg-[#1e2a1e] border border-green-500/40 text-green-400 flex items-center gap-2 shadow-lg">
                        <IoCheckmarkCircle size={20} className="shrink-0" />
                        <span className="text-sm font-medium">{successMessage}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

const Home = () => {
    return (
        <HomeLayout />
    );
}

export default Home