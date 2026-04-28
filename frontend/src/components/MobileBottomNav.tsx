// RESPONSIVE FIX: Mobile bottom navigation bar
// Replaces the sidebar navigation on screens < md (768px)
import { useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { IoHomeOutline, IoClose } from "react-icons/io5";
import { MdOutlineAddBox } from "react-icons/md";
import { BsBookmarkStar, BsThreeDots } from "react-icons/bs";
import { PiCookingPotBold } from "react-icons/pi";
import { RiUserFollowLine } from "react-icons/ri";
import { FiCalendar, FiShoppingCart, FiFolder, FiLock } from "react-icons/fi";
import { IoShieldCheckmarkOutline } from "react-icons/io5";
import NewRecipe from "./Modal/NewRecipe";

const MobileBottomNav = () => {
    const modalRef = useRef<HTMLDialogElement>(null);
    const [moreOpen, setMoreOpen] = useState(false);

    const linkBase = "flex flex-col items-center justify-center gap-0.5 text-[10px] min-h-[44px] min-w-[44px] rounded-lg transition-all duration-200";
    const linkInactive = "text-white/40 hover:text-white/70";
    const linkActive = "text-orange-400";

    // RESPONSIVE FIX: "More" drawer link style
    const drawerLinkBase = "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium min-h-[44px] transition-all duration-200";
    const drawerLinkInactive = "text-white/60 hover:bg-white/5 hover:text-white";
    const drawerLinkActive = "text-orange-400 bg-orange-500/10";

    return (
        <>
            {/* RESPONSIVE FIX: "More" overlay panel */}
            {moreOpen && (
                <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMoreOpen(false)} />
                    <div className="relative bg-[var(--cook-bg)] border-t border-white/10 rounded-t-2xl px-4 pt-4 pb-20 max-h-[70vh] overflow-y-auto safe-area-bottom">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-base font-bold text-white/90">More</h3>
                            <button
                                onClick={() => setMoreOpen(false)}
                                className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
                                aria-label="Close"
                            >
                                <IoClose size={22} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-1">
                            <NavLink
                                to="/home/invitations"
                                onClick={() => setMoreOpen(false)}
                                className={({ isActive }) => `${drawerLinkBase} ${isActive ? drawerLinkActive : drawerLinkInactive}`}
                            >
                                <RiUserFollowLine size={20} className="shrink-0" />
                                Invitations
                            </NavLink>
                            <NavLink
                                to="/home/meal-plan"
                                onClick={() => setMoreOpen(false)}
                                className={({ isActive }) => `${drawerLinkBase} ${isActive ? drawerLinkActive : drawerLinkInactive}`}
                            >
                                <FiCalendar size={20} className="shrink-0" />
                                Meal Plan
                            </NavLink>
                            <NavLink
                                to="/home/shopping-list"
                                onClick={() => setMoreOpen(false)}
                                className={({ isActive }) => `${drawerLinkBase} ${isActive ? drawerLinkActive : drawerLinkInactive}`}
                            >
                                <FiShoppingCart size={20} className="shrink-0" />
                                Shopping List
                            </NavLink>
                            <NavLink
                                to="/home/collections"
                                onClick={() => setMoreOpen(false)}
                                className={({ isActive }) => `${drawerLinkBase} ${isActive ? drawerLinkActive : drawerLinkInactive}`}
                            >
                                <FiFolder size={20} className="shrink-0" />
                                Collections
                            </NavLink>
                        </div>

                        {/* RESPONSIVE FIX: Legal links visible on mobile */}
                        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-1">
                            <NavLink
                                to="/terms-of-service"
                                onClick={() => setMoreOpen(false)}
                                className={({ isActive }) => `${drawerLinkBase} ${isActive ? drawerLinkActive : 'text-white/30 hover:text-white/50 hover:bg-white/5'}`}
                            >
                                <IoShieldCheckmarkOutline size={18} className="shrink-0" />
                                Terms of Service
                            </NavLink>
                            <NavLink
                                to="/privacy-policy"
                                onClick={() => setMoreOpen(false)}
                                className={({ isActive }) => `${drawerLinkBase} ${isActive ? drawerLinkActive : 'text-white/30 hover:text-white/50 hover:bg-white/5'}`}
                            >
                                <FiLock size={18} className="shrink-0" />
                                Privacy Policy
                            </NavLink>
                        </div>

                        <p className="text-gray-500 text-[10px] text-center mt-4">
                            &copy; {new Date().getFullYear()} CookShare
                        </p>
                    </div>
                </div>
            )}

            {/* RESPONSIVE FIX: Bottom navigation bar visible only on mobile */}
            <nav
                aria-label="Mobile navigation"
                className="md:hidden fixed bottom-0 left-0 right-0 z-40
                    bg-[var(--cook-bg)]/95 backdrop-blur-md
                    border-t border-white/5
                    flex items-center justify-around
                    h-14 px-1
                    safe-area-bottom"
            >
                <NavLink
                    to="/home/feed"
                    className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
                >
                    <IoHomeOutline size={20} />
                    <span>Home</span>
                </NavLink>

                <NavLink
                    to="/home/for-you"
                    className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
                >
                    <BsBookmarkStar size={20} />
                    <span>Curated</span>
                </NavLink>

                <button
                    onClick={() => modalRef.current?.showModal()}
                    className="flex flex-col items-center justify-center gap-0.5 text-[10px]
                        min-h-[44px] min-w-[44px] rounded-lg
                        text-orange-400 transition-all duration-200"
                >
                    <MdOutlineAddBox size={24} />
                    <span>Create</span>
                </button>

                <NavLink
                    to="/home/my-recipes"
                    className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
                >
                    <PiCookingPotBold size={20} />
                    <span>Mine</span>
                </NavLink>

                {/* RESPONSIVE FIX: "More" button to access remaining sidebar items + legal links */}
                <button
                    onClick={() => setMoreOpen(true)}
                    className={`${linkBase} ${moreOpen ? linkActive : linkInactive}`}
                >
                    <BsThreeDots size={20} />
                    <span>More</span>
                </button>
            </nav>

            <NewRecipe modalRef={modalRef} />
        </>
    );
};

export default MobileBottomNav;
