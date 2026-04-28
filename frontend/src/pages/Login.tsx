import { useState, useEffect } from 'react';
import LottieAnimation from "../components/LottieAnimation";
import Footer from "../components/Footer";
import InputFloating from "../components/UI/InputFloating";
import GoogleSignInButton from "../components/Auth/GoogleSignInButton";
import LottieLogin from "../assets/lotties/Food prep.json";
import { NavLink, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@cookshare/hooks";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FiCheckCircle } from "react-icons/fi";
import { IoArrowBack } from "react-icons/io5";
import { canGoBack } from "../utils/navigation.utils";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
	access_denied: "Google sign-in was cancelled.",
	invalid_state: "Session expired — please try again.",
	provider_error: "Could not get your Google profile. Try again.",
	email_not_verified: "Your Google email is not verified.",
	email_conflict: "An account with this email already exists.",
	google_id_conflict: "This Google account is linked to another user.",
	server_error: "Something went wrong. Please try again later.",
};

const Login = () => {
	const [identifier, setIdentifier] = useState('');
	const [password, setPassword] = useState('');
	const [isRemember, setIsRemember] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const {error, isLoading, login, clearError} = useAuth();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const emailVerified = searchParams.get('verified') === 'true';
	const oauthError = searchParams.get('oauth_error');

	useEffect(() => {
		// Clear oauth_error from URL once displayed
		if (oauthError) {
			const url = new URL(window.location.href);
			url.searchParams.delete('oauth_error');
			window.history.replaceState({}, '', url.toString());
		}
	}, [oauthError]);

	useEffect(() => {
		if (error) {
			const timer = setTimeout(clearError, 8000);
			return () => clearTimeout(timer);
		}
	}, [error, clearError]);

	const handlesubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		try {
			e.preventDefault();			
			if (!identifier || !password) {
				return;
			}
			await login({ identifier, password, rememberMe: isRemember });
		} catch (err) {
			// error is handled by auth context
		}
	}
	return (
        <>
			{(error || oauthError) && (
				<div role="alert" className="alert alert-error absolute right-0 z-50 w-80 max-w-[90vw]">
					<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<span className='flex-1 wrap-break-word text-sm' >
						{error || (oauthError && (OAUTH_ERROR_MESSAGES[oauthError] || OAUTH_ERROR_MESSAGES.server_error))}
					</span>
				</div>
			)}
            <div className="app min-h-screen flex flex-col relative">
                <button
                    onClick={() => canGoBack() ? navigate(-1) : navigate('/')}
                    className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 flex items-center gap-2
                        px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400
                        hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                >
                    <IoArrowBack size={18} />
                    <span className="text-sm font-medium hidden sm:inline">Back</span>
                </button>
                <main className="main-content flex-1 flex items-center justify-center p-4 my-10 md:my-22">
                    <div className="w-full max-w-[95%] sm:max-w-md md:max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row bg-white/5 backdrop-blur-sm">
                        <section className="hidden md:flex md:w-5/12 bg-white/10 bg-cover bg-center relative p-8 md:p-12 flex-col justify-center items-center min-h-[400px] md:min-h-[600px]">
                            <LottieAnimation animationData={LottieLogin} w={400} h={400} />
                        </section>
                        <section className="w-full md:w-7/12 p-6 sm:p-8 md:p-12 flex items-center justify-center">
                            <div className="w-full max-w-sm sm:max-w-md">
                                {emailVerified && (
                                    <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 flex items-center gap-2 text-sm">
                                        <FiCheckCircle size={18} />
                                        Email verified successfully! You can now log in.
                                    </div>
                                )}
                                <div className="text-center mb-8">
                                    <p className="text-2xl sm:text-3xl font-bold mb-2">Welcome Back to <span className="text-orange-400">Cook</span>Share</p>
                                    <p className="text-gray-400">Cooking, sharing, love!</p>
                                </div>
                                <form className="space-y-5" onSubmit={handlesubmit}>
                                    <InputFloating 
										label="Email" 
										type="text" 
										id="email"
										value={identifier}
										onChange={e => setIdentifier(e.target.value)}
									/>
                                    <div className="flex flex-col gap-2">
                                        <div className="relative">
                                            <InputFloating
                                                label="Password"
                                                type={showPassword ? "text" : "password"}
                                                id="password"
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-[32px] -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
                                            >
                                                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                                            </button>
                                        </div>
                                        <NavLink
                                            to="/reset-password"
                                            className='text-xs text-orange-400/80 hover:text-orange-500 
                                        transition-colors cursor-pointer flex justify-end font-medium hover:underline'
                                        >
                                            Forgot password?
                                        </NavLink>
                                    </div>
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                name=""
                                                id="rememberMe"
                                                className="checkbox checkbox-sm checkbox-warning"
                                                onChange={() => setIsRemember(!isRemember)}
                                            />
                                            <label
                                                htmlFor="rememberMe"
                                                className="text-gray-400 text-sm cursor-pointer"
                                            >
                                                Remember me
                                            </label>
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-orange-400 text-white py-3 rounded-lg
                                        hover:bg-orange-500 transition duration-200
                                        shadow-lg hover:shadow-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? <span className="loading loading-dots loading-xl"></span> : 'Login'}
                                    </button>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 h-px bg-gray-700"></div>
                                            <p className="text-sm text-gray-500 font-medium">OR</p>
                                            <div className="flex-1 h-px bg-gray-700"></div>
                                        </div>
                                        <GoogleSignInButton label="Login with Google" disabled={isLoading} />
                                        <div className="mt-4">
                                            <p className="text-sm text-center text-gray-500">
                                                Don't have an account?{' '}
                                                <NavLink 
                                                    to="/register" 
                                                    className="text-orange-400 hover:text-orange-500 font-bold transition-colors cursor-pointer hover:underline"
                                                >
                                                    Sign up
                                                </NavLink>
                                            </p>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </section>
                    </div>
                </main>
                <Footer />
            </div>
        </>
    );
};

export default Login;