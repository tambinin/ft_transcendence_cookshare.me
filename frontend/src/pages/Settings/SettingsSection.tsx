import { FiChevronDown } from 'react-icons/fi';

interface SettingsSectionProps {
  title: string;
  subtitle: string;
  sectionKey: string;
  isOpen: boolean;
  onToggle: (key: string) => void;
  children: React.ReactNode;
  variant?: 'default' | 'danger';
}

const SettingsSection = ({
  title, subtitle, sectionKey, isOpen, onToggle, children, variant = 'default',
}: SettingsSectionProps) => {
  const isDanger = variant === 'danger';

  return (
    <div className={`bg-(--cook-bg) rounded-2xl border overflow-hidden ${isDanger ? 'border-red-500/20' : 'border-white/5'}`}>
      <button
        onClick={() => onToggle(sectionKey)}
        className={`w-full flex items-center justify-between p-4 sm:p-6 text-left transition-colors min-h-[56px] ${isDanger ? 'hover:bg-red-500/5' : 'hover:bg-white/5'}`}
      >
        <div>
          <h2 className={`text-lg font-bold ${isDanger ? 'text-red-400' : 'text-orange-200'}`}>{title}</h2>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <FiChevronDown
          className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${isDanger ? 'text-red-400' : 'text-gray-400'}`}
          size={20}
        />
      </button>
      {isOpen && children}
    </div>
  );
};

export default SettingsSection;
