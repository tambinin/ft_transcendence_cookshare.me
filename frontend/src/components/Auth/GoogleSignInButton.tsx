import authService from '../../services/auth.service';

interface GoogleSignInButtonProps {
	label?: string;
	disabled?: boolean;
}

/**
 * A reusable Google sign-in/sign-up button.
 * Redirects to the backend Google OAuth endpoint.
 */
const GoogleSignInButton = ({
	label = 'Continue with Google',
	disabled = false,
}: GoogleSignInButtonProps) => {
	const handleClick = () => {
		if (disabled) return;
		authService.startGoogleOAuth();
	};

	return (
		<button
			type="button"
			disabled={disabled}
			onClick={handleClick}
			className="w-full bg-white text-gray-800 border-none
				py-3 rounded-lg font-semibold hover:bg-gray-100
				transition duration-200 flex items-center justify-center gap-3 shadow-md
				disabled:opacity-50 disabled:cursor-not-allowed"
		>
			<img
				className="w-6 h-6"
				src="/logo/google-logo-png-29534.png"
				alt="Google"
				loading="lazy"
			/>
			<span>{label}</span>
		</button>
	);
};

export default GoogleSignInButton;
