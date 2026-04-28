import { useState, useEffect } from 'react';
import LottieAnimation from "../components/LottieAnimation";
import NavigationButton from "../components/NavigationButton";
import Footer from "../components/Footer";
import InputFloating from "../components/UI/InputFloating";
import GoogleSignInButton from "../components/Auth/GoogleSignInButton";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { IoArrowBack } from "react-icons/io5";
import LottieCooking from "../assets/lotties/Cooking.json";
import { useAuth } from '@cookshare/hooks';
import { useNavigate } from 'react-router-dom';
import { canGoBack } from "../utils/navigation.utils";

const Register = () => {
	const [firstName, setFirstName] = useState("");
	const [password, setPassword] = useState("");
	const [newpassword, setNewPassword] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [passError, setPassError] = useState("");
	const [showPasswordOne, setShowPasswordOne] = useState(false);
	const [showPasswordTwo, setShowPasswordTwo] = useState(false);
	const navigate = useNavigate();
	const {register, error, clearError, isLoading} = useAuth();

	useEffect(() => {
		if (error) {
			const timer = setTimeout(clearError, 2000);
			return () => clearTimeout(timer);
		}
	}, [error, clearError]);

	useEffect(() => {
		if (passError) {
			const timer = setTimeout(() => setPassError(""), 2000);
			return () => clearTimeout(timer);
		}
	}, [passError]);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (password !== newpassword){
			setPassError("Passwords do not match");
		} else {
			const generatedUsername = "User" + Math.floor(Math.random() * 10000);
			await register({ email, username: generatedUsername, password, firstName, lastName });
		}
	}
	return (
        <>
			{(passError || error) && (
				<div role="alert" className="alert alert-error absolute right-0 z-50 w-80 max-w-[90vw]">
					<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<span className='flex-1 wrap-break-word text-sm' >{error || passError}</span>
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
                <main className="main-content flex-1 flex items-center justify-center p-4 my-6 md:my-10">
                    <div className="w-full max-w-[95%] sm:max-w-md md:max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row bg-white/5 backdrop-blur-sm">
                        <section className="hidden md:flex md:w-5/12 bg-white/10 p-8 md:p-12 flex-col justify-center items-center min-h-100 md:min-h-150">
                            <LottieAnimation animationData={LottieCooking} w={400} h={400} />
                        </section>
                        <section className="w-full md:w-7/12 p-6 sm:p-8 md:p-12 flex items-center justify-center">
                            <div className="w-full max-w-sm sm:max-w-md">
                                <div className="text-center mb-6">
                                    <p className="text-2xl sm:text-3xl font-bold mb-1">Create your account</p>
                                    <p className="text-gray-400">Cooking, sharing, love!</p>
                                </div>
                                <form className='space-y-4' onSubmit={handleSubmit}>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <InputFloating
                                            label="First name"
                                            type="text"
                                            id="firstName"
                                            onChange={e => setFirstName(e.target.value)}
                                            value={firstName}
                                        />
                                        <InputFloating
                                            label="Last name"
                                            type="text"
                                            id="lastName"
                                            onChange={e => setLastName(e.target.value)}
                                            value={lastName}
                                        />
                                    </div>
                                    <InputFloating 
										label="Email"
										type="email"
										id="email"
										onChange={e => setEmail(e.target.value)}
										value={email}
									/>
									<div className="relative flex flex-col gap-2">
                                    	<InputFloating
											label="Password"
											type={showPasswordOne ? "text" : "password"}
											id="password"
											onChange={e => setPassword(e.target.value)}
											value={password}
										/>
										<button
											type="button"
											onClick={() => setShowPasswordOne(!showPasswordOne)}
											className="absolute right-4 top-8 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
										>
											{showPasswordOne ? <FiEyeOff size={20} /> : <FiEye size={20} />}
										</button>
										{/* ── Password strength indicator ── */}
										{password.length > 0 && (
											<div className='flex items-center gap-2 px-1'>
												<div className='flex gap-1 flex-1'>
													<div className={`h-1 flex-1 rounded-full transition-colors ${password.length >= 1 ? (password.length >= 12 ? 'bg-green-400' : password.length >= 8 ? 'bg-orange-400' : 'bg-red-400') : 'bg-gray-700'}`} />
													<div className={`h-1 flex-1 rounded-full transition-colors ${password.length >= 8 ? (password.length >= 12 ? 'bg-green-400' : 'bg-orange-400') : 'bg-gray-700'}`} />
													<div className={`h-1 flex-1 rounded-full transition-colors ${password.length >= 12 ? 'bg-green-400' : 'bg-gray-700'}`} />
												</div>
												<span className='text-[10px] text-white/30 uppercase tracking-widest'>
													{password.length < 8 ? 'Weak' : password.length < 12 ? 'Good' : 'Strong'}
												</span>
											</div>
										)}
									</div>
									<div className="relative flex flex-col gap-2">
                                    	<InputFloating
											label="Confirm Password"
											type={showPasswordTwo ? "text" : "password"}
											id="confirmPassword"
											onChange={e => setNewPassword(e.target.value)}
											value={newpassword}
											/>
										<button
											type="button"
											onClick={() => setShowPasswordTwo(!showPasswordTwo)}
											className="absolute right-4 top-8 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
											>
											{showPasswordTwo ? <FiEyeOff size={20} /> : <FiEye size={20} />}
										</button>
									</div>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-orange-400 text-white py-3 rounded-lg
                                        hover:bg-orange-500 transition duration-200
                                        shadow-lg hover:shadow-xl font-semibold disabled:opacity-50"
                                    >
												{isLoading ? <span className="loading loading-dots loading-xl"></span> : 'Let\'s cooking'}
                                    </button>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 h-px bg-gray-700"></div>
                                            <p className="text-sm text-gray-500 font-medium">OR</p>
                                            <div className="flex-1 h-px bg-gray-700"></div>
                                        </div>
                                        <GoogleSignInButton label="Sign up with Google" disabled={isLoading} />
                                        <div className="mt-2">
                                            <p className="text-sm text-center text-gray-500">
                                                Already have an account?{' '}
                                                <NavigationButton to="/login" variant="outline">
                                                    Sign in
                                                </NavigationButton>
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

export default Register;