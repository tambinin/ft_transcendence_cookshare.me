import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { setAccessToken } from '../services/auth.service';
import { useAuth } from '@cookshare/hooks';

/**
 * OAuth callback page — receives the access token from the backend redirect
 * and completes the frontend auth flow.
 *
 * URL: /oauth/callback?token=xxx&new_user=0|1
 */
const OAuthCallback = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const { refreshUser } = useAuth();
	const processed = useRef(false);

	useEffect(() => {
		if (processed.current) return;
		processed.current = true;

		const token = searchParams.get('token');
		const isNewUser = searchParams.get('new_user') === '1';

		if (!token) {
			navigate('/login?oauth_error=server_error', { replace: true });
			return;
		}

		// Store token and fetch user profile
		const completeAuth = async () => {
			try {
				setAccessToken(token, true); // persist for Google users
				await refreshUser();

				if (isNewUser) {
					// New users might want to complete their profile
					navigate('/settings', { replace: true });
				} else {
					navigate('/home', { replace: true });
				}
			} catch {
				setAccessToken(null);
				navigate('/login?oauth_error=server_error', { replace: true });
			}
		};

		completeAuth();
	}, [searchParams, navigate, refreshUser]);

	return (
		<div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
			<div className="text-center">
				<span className="loading loading-spinner loading-lg text-orange-400" />
				<p className="mt-4 text-gray-400">Completing sign in...</p>
			</div>
		</div>
	);
};

export default OAuthCallback;
