import { useState, useEffect } from 'react';
import { useSearchParams, NavLink, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { IoArrowBack } from 'react-icons/io5';
import Title from '../components/Title';
import Footer from '../components/Footer';
import InputFloating from '../components/UI/InputFloating';
import authService from '../services/auth.service';
import { canGoBack } from '../utils/navigation.utils';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Enter your email. The one you actually use.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await authService.forgotPassword({ email: email.trim() });
      setEmailSent(true);
    } catch (err: any) {
      const message = err?.response?.data?.message
        || 'Something broke. Try again later.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!token) {
      setError('Missing reset token.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await authService.resetPassword({ token, newPassword });
      setIsSuccess(true);
      // Wait a bit, then redirect to login
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      const message = err?.response?.data?.message
        || 'Password reset failed. You took too long and the link died.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app min-h-screen flex flex-col relative">
      <button
        onClick={() => canGoBack() ? navigate(-1) : navigate('/login', { replace: true })}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 flex items-center gap-2
            px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400
            hover:bg-white/10 hover:text-white transition-all cursor-pointer"
      >
        <IoArrowBack size={18} />
        <span className="text-sm font-medium hidden sm:inline">Back</span>
      </button>
      {error && (
        <div role="alert" className="alert alert-error absolute right-0 z-50 w-80 max-w-[90vw]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className='flex-1 wrap-break-word text-sm'>{error}</span>
        </div>
      )}

      <main className="main-content flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md bg-[var(--cook-bg)] text-white
            p-8 rounded-2xl shadow-2xl border border-white/5
            flex flex-col gap-8 transition-all duration-300"
        >
          <div className='flex flex-col gap-6'>
            <div>
              <Title pos='justify-center items-center' slogan="secondary" variant="secondary" />
            </div>

            <div className='text-center space-y-2'>
              <h2 className='text-2xl font-bold text-orange-200 tracking-tight'>
                {isSuccess ? 'Password Reset!' : token ? 'New Password' : 'Reset Password'}
              </h2>
            </div>

            {token && !isSuccess && (
              <form className='space-y-6' onSubmit={handlePasswordSubmit}>
                <div className='flex flex-col gap-2'>
                  <p className='text-xs leading-relaxed text-gray-500'>
                    Enter your new password. It must contain at least 8 characters.
                  </p>

                  <div className="relative">
                    <InputFloating
                      label="New Password"
                      type={showPassword ? "text" : "password"}
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-8 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
                    >
                      {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                    </button>
                  </div>

                  <div className="relative">
                    <InputFloating
                      label="Confirm Password"
                      type={showConfirm ? "text" : "password"}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-8 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
                    >
                      {showConfirm ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                    </button>
                  </div>

                  {newPassword.length > 0 && (
                    <div className='flex items-center gap-2 px-1'>
                      <div className='flex gap-1 flex-1'>
                        <div className={`h-1 flex-1 rounded-full transition-colors ${newPassword.length >= 1 ? (newPassword.length >= 12 ? 'bg-green-400' : newPassword.length >= 8 ? 'bg-orange-400' : 'bg-red-400') : 'bg-gray-700'}`} />
                        <div className={`h-1 flex-1 rounded-full transition-colors ${newPassword.length >= 8 ? (newPassword.length >= 12 ? 'bg-green-400' : 'bg-orange-400') : 'bg-gray-700'}`} />
                        <div className={`h-1 flex-1 rounded-full transition-colors ${newPassword.length >= 12 ? 'bg-green-400' : 'bg-gray-700'}`} />
                      </div>
                      <span className='text-[10px] text-white/30 uppercase tracking-widest'>
                        {newPassword.length < 8 ? 'Weak' : newPassword.length < 12 ? 'Good' : 'Strong'}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type='submit'
                  disabled={isLoading || newPassword.length < 8 || newPassword !== confirmPassword}
                  className='w-full disabled:bg-gray-800 text-gray-500 py-4 rounded-xl bg-orange-400 disabled:cursor-not-allowed
                  font-bold cursor-pointer hover:bg-orange-500 hover:text-white transition duration-200 uppercase tracking-widest text-xs border border-white/5'
                >
                  {isLoading ? <span className="loading loading-dots"></span> : "Reset Password"}
                </button>
              </form>
            )}

            {isSuccess && (
              <div className='flex flex-col items-center gap-6 py-4'>
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <div className='text-center space-y-2'>
                  <p className='text-sm text-gray-400 leading-relaxed'>
                    Your password has been reset successfully.
                    <br />
                    You will be redirected shortly...
                  </p>
                </div>

                <NavLink
                  to="/login"
                  className='w-full py-3 rounded-xl bg-orange-400 text-center
                  font-bold text-xs uppercase tracking-widest
                  hover:bg-orange-500 text-white transition duration-200'
                >
                  Go to Login
                </NavLink>
              </div>
            )}

            {!token && !emailSent && (
              <form className='space-y-6' onSubmit={handleEmailSubmit}>
                <div className='flex flex-col gap-2'>
                  <p className='text-xs leading-relaxed text-gray-500'>
                    Enter the email address associated with your account.
                    We will send you a link to reset your password.
                  </p>
                  <InputFloating
                    label="Email"
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <button
                  type='submit'
                  disabled={isLoading || !email.trim()}
                  className='w-full disabled:bg-gray-800 text-gray-500 py-4 rounded-xl bg-orange-400 disabled:cursor-not-allowed
                  font-bold cursor-pointer hover:bg-orange-500 hover:text-white transition duration-200 uppercase tracking-widest text-xs border border-white/5'
                >
                  {isLoading ? <span className="loading loading-dots"></span> : "Send Reset Link"}
                </button>

                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Remember your password?{' '}
                    <NavLink
                      to="/login"
                      className="text-orange-400 hover:text-orange-500 font-bold transition-colors hover:underline"
                    >
                      Sign in
                    </NavLink>
                  </p>
                </div>
              </form>
            )}

            {!token && emailSent && (
              <div className='flex flex-col items-center gap-6 py-4'>
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>

                <div className='text-center space-y-2'>
                  <p className='text-sm text-gray-400 leading-relaxed'>
                    If an account exists with the address <span className='text-orange-400 font-medium'>{email}</span>,
                    you will receive an email with a reset link.
                  </p>
                  <p className='text-xs text-gray-600'>
                    The link expires in 1 hour.
                  </p>
                </div>

                <div className='flex flex-col gap-3 w-full'>
                  <button
                    type='button'
                    onClick={() => { setEmailSent(false); setEmail(''); }}
                    className='w-full py-3 rounded-xl bg-white/5 border border-white/10
                    text-gray-400 font-medium text-xs uppercase tracking-widest
                    hover:bg-white/10 transition duration-200 cursor-pointer'
                  >
                    Try another email
                  </button>
                  <NavLink
                    to="/login"
                    className='w-full py-3 rounded-xl bg-orange-400 text-center
                    font-bold text-xs uppercase tracking-widest
                    hover:bg-orange-500 text-white transition duration-200'
                  >
                    Back to Login
                  </NavLink>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default ResetPassword;
