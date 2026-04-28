import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Title from '../components/Title';
import Footer from '../components/Footer';
import InputFloating from '../components/UI/InputFloating';
import { useAuth } from '@cookshare/hooks';

const EmailVerify = () => {
  const [username, setUsername] = useState('');
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    error,
    clearError,
    isLoading,
    verifyEmail,
    resendVerification,
    updateUserProfile
  } = useAuth();
  const hasVerified = useRef(false);
  const email = (location.state as { email?: string })?.email
    || (() => {
      try {
        const pending = localStorage.getItem('pendingAuth');
        return pending ? JSON.parse(pending).email : '';
      } catch { return ''; }
    })();
  const tokenFromUrl = searchParams.get('token');
  useEffect(() => {
    if (!email && !tokenFromUrl) {
      navigate('/register', { replace: true });
    }
  }, [email, tokenFromUrl, navigate]);
  useEffect(() => {
    if (tokenFromUrl && !hasVerified.current) {
      hasVerified.current = true; // Empêcher le double appel
      handleAutoVerify(tokenFromUrl);
    }
  }, [tokenFromUrl]);
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);
  const handleAutoVerify = async (token: string) => {
    try {
      await verifyEmail({ token });
      if (user) {
        setSuccess('Email successfully verified! Choose your username.');
        setStep(2);
      } else {
        // Error is handled by Auth context
      }
    } catch (err) {
      // Error is handled by Auth context
    } finally {
      // Nettoyer le token dans tous les cas
      // localStorage.removeItem('pendingAuth');
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    try {
      await resendVerification({ email });
      setSuccess("Email resent. Check your inbox (or spam, we don't judge).");
      setResendCooldown(60);
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      // L'erreur est gérée par le contexte Auth
    }
  };

  const handleSetUsername = async () => {
    try {
      await updateUserProfile({ username });
      localStorage.removeItem('pendingAuth');
      setSuccess('Welcome aboard. Entering the matrix...');
      setTimeout(() => navigate('/home', { replace: true }), 1000);
    } catch {
      // L'erreur est gérée par le contexte Auth
    }
  };

  return (
    <div className="app bg-[var(--cook-bg)] min-h-screen">
      <div className="toast toast-top toast-end z-50">
        {error && (
          <div className="alert alert-error shadow-lg animate-in fade-in slide-in-from-right duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
        {success && (
          <div className="alert alert-success shadow-lg animate-in fade-in slide-in-from-right duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">{success}</span>
          </div>
        )}
      </div>

      <main className="main-content flex items-center justify-center min-h-[85vh] py-12 px-4">
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
                {step === 1 ? "Email Verification" : "Create Username"}
              </h2>
            </div>

            <div className='space-y-8'>
              <form className='space-y-6' onSubmit={(e) => e.preventDefault()}>

                <div className='flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/5'>
                  <div className="w-10 h-10 rounded-full border-2 border-orange-500/20 bg-gray-700 flex items-center justify-center overflow-hidden">
                    {step === 2 && user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="avatar" loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-orange-400 font-bold">?</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-white/30">
                      {step === 1 ? "Verifying for" : "Setting up"}
                    </span>
                    <p className='text-white/70 text-sm font-medium'>{email || 'your account'}</p>
                  </div>
                </div>

                {step === 1 ? (
                  <div className='flex flex-col gap-6'>
                    {tokenFromUrl ? (
                      <div className='flex flex-col items-center gap-4 py-4'>
                        <span className="loading loading-spinner loading-lg text-orange-400"></span>
                        <p className='text-sm text-gray-400 text-center'>
                          Interrogating the mail server...
                        </p>
                      </div>
                    ) : (
                      <div className='flex flex-col gap-4'>
                        <div className='flex flex-col items-center gap-3 py-4'>
                          <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className='text-sm text-gray-400 text-center leading-relaxed'>
                            We sent a magic link to your email.
                            <br />
                            <span className='text-orange-400/80 font-medium'>
                              Click it if you want to get in.
                            </span>
                          </p>
                        </div>

                        <div className='flex justify-center'>
                          <button
                            type='button'
                            onClick={handleResend}
                            disabled={resendCooldown > 0 || isLoading || !email}
                            className='text-xs text-orange-400/80 hover:text-orange-500
                            transition-colors cursor-pointer font-medium disabled:text-gray-600 disabled:cursor-not-allowed'
                          >
                            {
								resendCooldown > 0
                              	? `Spam again in ${resendCooldown}s`
                              	: <span className='text-gray-300'>
								  Lost in the void?{" "}
								  <span className="cursor-pointer text-orange-500 hover:underline">
								    Resend it
								  </span>
								</span>
							}
						  </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className='flex flex-col gap-6 animate-in slide-in-from-right duration-500'>
                    <div className='flex flex-col gap-2'>
                      <p className='text-xs leading-relaxed text-gray-500'>
                        Pick a username. Make it a good one.
                      </p>
                      <InputFloating
                        label="Username"
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                    <button
                      type='button'
                      onClick={handleSetUsername}
                      disabled={isLoading || username.length < 3}
                      className='w-full disabled:bg-gray-800 text-gray-500 py-4 rounded-xl bg-orange-400 disabled:cursor-not-allowed
                      font-bold cursor-pointer hover:bg-orange-500 hover:text-white transition duration-200 uppercase tracking-widest text-xs border border-white/5'
                    >
                      {isLoading ? <span className="loading loading-dots"></span> : "Confirm"}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EmailVerify;
