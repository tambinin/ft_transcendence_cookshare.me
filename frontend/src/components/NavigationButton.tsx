import { useNavigate } from 'react-router-dom';

export interface NavigationButtonProps {
    children: React.ReactNode;
    to?: string;
    width?: string;
    height?: string;
    variant?: 'primary' | 'secondary' | 'outline';
    onClick?: () => void;
}

const NavigationButton = ({ children, to, variant = 'primary', width, height, onClick }: NavigationButtonProps) => {
    const navigate = useNavigate();

    const variants = {
        primary: 'bg-orange-500 hover:bg-white hover:text-orange-500 text-white text-lg rounded-lg',
        secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg',
        outline: 'text-orange-500 hover:underline hover:decoration-orange-500 focus:outline-none hover:underline-offset-2'
    };

    const handleClick = () => {
        if (to) {
            navigate(to);
        }
        if (onClick) {
            onClick();
        }
    };

    return (
        <button
            onClick={handleClick}
            className={`${width} ${height} text-center transition ${variants[variant]}`}
        >
            {children}
        </button>
    );
}

export default NavigationButton;
