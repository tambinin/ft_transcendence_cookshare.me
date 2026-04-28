export interface TitleProps {
    variant?: 'primary' | 'secondary';
    slogan?: 'primary' | 'secondary';
    pos?: string;
}

const Title = ({ variant = 'primary', slogan = 'primary', pos = 'justify-center items-center' }: TitleProps) => {
    const variants = {
        primary: 'text-2xl sm:text-4xl font-bold text-left text-heading',
        secondary: 'text-xl sm:text-2xl font-bold text-left text-heading',
    };
    const slogans = {
        primary: 'text-base sm:text-lg text-gray-600 text-left',
        secondary: 'hidden sm:block text-xs text-gray-600 text-left',
    };
    return (
        <div className={`flex flex-col ${pos} gap-1`}>
            <p className={`${variants[variant]}`}><span className='text-orange-500 p-0 m-0'>Cook</span>Share</p>
            <p className={`${slogans[slogan]}`}>Cooking, sharing, love!</p>
        </div>
    );
}

export default Title
