import Title from "./Title"
import Search from "./Search";
import NotificationUI from "./Dropdown/NotificationUI";
import MessageUI from "./Dropdown/MessageUI";
import Account from "./Dropdown/Account";
import WsStatusBadge from "./WsStatusBadge";

const Navbar = () => {
    return (
        <div className="z-50 w-auto
                bg-[var(--cook-bg)]/80 backdrop-blur-md
                border border-white/5 border-b-orange-500/20
                rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]
                flex flex-row justify-between items-center
                my-2 p-2 sm:p-4 md:p-5 px-3 sm:px-8 md:px-10
                transition-all duration-300 mx-2 md:mx-4"
        >
            <div className="flex items-center shrink min-w-0">
                <Title pos=' ' slogan="secondary" variant="secondary" />
                <WsStatusBadge compact />
            </div>

            {/* All nav items — always visible. Search shows icon on mobile, full bar on sm+ */}
            <div className="flex items-center justify-end gap-2 sm:gap-2 md:gap-4 shrink-0">
                <Search />
                <NotificationUI />
                <MessageUI />
                <Account />
            </div>
        </div>
    );
}

export default Navbar