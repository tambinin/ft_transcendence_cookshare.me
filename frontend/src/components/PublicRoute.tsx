import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface PublicRouteProps {
	children: React.ReactNode;
	/** If true, redirect authenticated users to /home (default: false — allow access) */
	redirectIfAuth?: boolean;
}

/**
 * Public route guard: optionally redirects already-authenticated users to /home.
 *
 * Use `redirectIfAuth` on pages like /login and /register where
 * a logged-in user should never land.
 */
export default function PublicRoute({ children, redirectIfAuth = false }: PublicRouteProps) {
	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-[#0d1117]">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400" />
			</div>
		);
	}

	if (redirectIfAuth && isAuthenticated) {
		// replace: true — the public page never enters the history stack
		return <Navigate to="/home" replace />;
	}

	return <>{children}</>;
}
