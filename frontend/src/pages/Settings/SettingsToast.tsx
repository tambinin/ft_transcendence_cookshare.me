interface SettingsToastProps {
  error: string;
  success: string;
}

const SettingsToast = ({ error, success }: SettingsToastProps) => (
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
);

export default SettingsToast;
