import OnlineAvatar from '../OnlineAvatar';

interface User {
    id: string;
    picture: string;
    name: string;
}

interface ProfilMessageUIProps {
    user: User;
}

const ProfilMessageUI = ({ user }: ProfilMessageUIProps) => {
    return (
        <div className="p-6">
            <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative group">
                    <div className="w-28 h-28 rounded-full ring-2 ring-orange-400/30 ring-offset-2 ring-offset-[#0d1117] overflow-visible">
                        <OnlineAvatar
                            userId={user.id}
                            avatarUrl={user.picture}
                            username={user.name}
                            size="2xl"
                            className="w-28 h-28 rounded-full object-cover"
                            dotBorderClass="border-[#0d1117]"
                        />
                    </div>
                </div>
                <div className="text-center">
                    <h2 className="font-bold text-lg text-white">{user.name}</h2>
                    <p className="text-xs text-gray-500 font-medium">@{user.name}</p>
                </div>
            </div>
        </div>
    );
}

export default ProfilMessageUI
