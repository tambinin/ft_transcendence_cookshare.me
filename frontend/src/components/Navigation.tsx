import { useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { IoHomeOutline } from "react-icons/io5";
import { MdOutlineAddBox } from "react-icons/md";
import { PiCookingPotBold } from "react-icons/pi";
import { RiUserFollowLine } from "react-icons/ri";
import { GiShadowFollower } from "react-icons/gi";
import { BsBookmarkStar } from "react-icons/bs";
import { FiCalendar, FiShoppingCart, FiFolder, FiLock } from "react-icons/fi";
import { IoShieldCheckmarkOutline } from "react-icons/io5";
import NewRecipe from "./Modal/NewRecipe";

const Navigation = () => {
    const modalRef = useRef<HTMLDialogElement>(null);

    // RESPONSIVE FIX: sidebar is now only visible md+, so use md as the base breakpoint
    const linkBase = "relative flex flex-row gap-4 justify-start items-center text-lg text-center w-full rounded-lg px-6 lg:px-12 py-2 no-underline transition-all duration-200 min-h-[44px]";
    const linkInactive = "text-white/50 hover:bg-white/5 hover:text-white/80 hover:translate-x-1";
    const linkActive = "bg-orange-500/10 text-orange-400";

    const activeBadge = (
        <span className="block absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-500 rounded-r-full" />
    );

    return (
        <nav aria-label="Navigation principale" className="navigation m-2 p-2 h-full overflow-y-auto shadow-lg bg-[var(--cook-bg)] rounded-lg flex flex-col gap-2 z-1000">
            <div className='mt-2 md:mt-6'>
                <NavLink
                    to="/home/feed"
                    className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
                >
                    {({ isActive }) => (
                        <>
                            {isActive && activeBadge}
                            <IoHomeOutline size={24} className="shrink-0" />
                            <span className="hidden md:block">Home</span>
                        </>
                    )}
                </NavLink>
            </div>
            <div>
                <NavLink
                    to="/home/for-you"
                    className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
                >
                    {({ isActive }) => (
                        <>
                            {isActive && activeBadge}
                            <BsBookmarkStar size={24} className="shrink-0" />
                            <span className="hidden md:block">Curated</span>
                        </>
                    )}
                </NavLink>
            </div>
            <div>
                <button
                    onClick={() => modalRef.current?.showModal()}
                    className="flex flex-row gap-4 justify-start items-center text-lg text-center w-full rounded-lg px-6 lg:px-12 py-2 no-underline transition-all duration-200 bg-white/5 text-orange-400 font-semibold hover:bg-orange-500 hover:text-white min-h-[44px]"
                >
                    <MdOutlineAddBox size={28} className="shrink-0" />
                    <span className="hidden md:block">Create</span>
                </button>
            </div>
            <div>
                <NavLink
                    to="/home/my-recipes"
                    className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
                >
                    {({ isActive }) => (
                        <>
                            {isActive && activeBadge}
                            <PiCookingPotBold size={24} className="shrink-0" />
                            <span className="hidden md:block">Mine</span>
                        </>
                    )}
                </NavLink>
            </div>
            <div>
                <NavLink
                    to="/home/friends"
                    className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
                >
                    {({ isActive }) => (
                        <>
                            {isActive && activeBadge}
                            <GiShadowFollower size={24} className="shrink-0" />
                            <span className="hidden md:block">Friends</span>
                        </>
                    )}
                </NavLink>
            </div>
            <div>
                <NavLink
                    to="/home/invitations"
                    className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
                >
                    {({ isActive }) => (
                        <>
                            {isActive && activeBadge}
                            <RiUserFollowLine size={24} className="shrink-0" />
                            <span className="hidden md:block">Invitation</span>
                        </>
                    )}
                </NavLink>
            </div>
            <div>
                <NavLink
                    to="/home/meal-plan"
                    className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
                >
                    {({ isActive }) => (
                        <>
                            {isActive && activeBadge}
                            <FiCalendar size={24} className="shrink-0" />
                            <span className="hidden md:block">Menu</span>
                        </>
                    )}
                </NavLink>
            </div>
            <div>
                <NavLink
                    to="/home/shopping-list"
                    className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
                >
                    {({ isActive }) => (
                        <>
                            {isActive && activeBadge}
                            <FiShoppingCart size={24} className="shrink-0" />
                            <span className="hidden md:block">Shopping</span>
                        </>
                    )}
                </NavLink>
            </div>
            <div>
                <NavLink
                    to="/home/collections"
                    className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
                >
                    {({ isActive }) => (
                        <>
                            {isActive && activeBadge}
                            <FiFolder size={24} className="shrink-0" />
                            <span className="hidden md:block">Collections</span>
                        </>
                    )}
                </NavLink>
            </div>
            <NewRecipe modalRef={modalRef} />

            {/* Legal links — pushed to bottom */}
            <div className="mt-auto pt-4 border-t border-white/10 flex flex-col gap-1">
                <NavLink
                    to="/terms-of-service"
                    className={({ isActive }) =>
                        `flex flex-row gap-3 justify-start items-center text-sm w-full rounded-md px-4 lg:px-8 py-1.5 no-underline transition-all duration-200 min-h-[44px] ${
                            isActive
                                ? 'text-orange-400'
                                : 'text-white/30 hover:text-white/60'
                        }`
                    }
                >
                    <IoShieldCheckmarkOutline size={16} className="shrink-0" />
                    <span className="hidden md:block">Terms</span>
                </NavLink>
                <NavLink
                    to="/privacy-policy"
                    className={({ isActive }) =>
                        `flex flex-row gap-3 justify-start items-center text-sm w-full rounded-md px-4 lg:px-8 py-1.5 no-underline transition-all duration-200 min-h-[44px] ${
                            isActive
                                ? 'text-orange-400'
                                : 'text-white/30 hover:text-white/60'
                        }`
                    }
                >
                    <FiLock size={16} className="shrink-0" />
                    <span className="hidden md:block">Privacy</span>
                </NavLink>
            </div>
        </nav>
    );
}

export default Navigation;
