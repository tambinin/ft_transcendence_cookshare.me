import { NavLink } from 'react-router-dom';
import type { FooterLink } from '../pages/Footer';

const Footer = () => {
    const links: FooterLink[] = [
        { name: 'Privacy Policy', href: '/privacy-policy' },
        { name: 'Terms of Service', href: '/terms-of-service' },
    ]
    return (
        // RESPONSIVE FIX: add bottom margin on mobile for bottom nav clearance
        <footer className="mb-16 md:mb-0">
            <div className='flex justify-center mb-4' >
                <div className="w-1/3 h-px bg-gray-600"></div>
            </div>
            {/* RESPONSIVE FIX: reduce gap on mobile */}
            <nav className='flex flex-wrap justify-center pb-2 gap-4 sm:gap-8'>
                {links.map((link) => (
                    <NavLink
                        key={link.href}
                        to={link.href}
                        className='text-gray-300 hover:text-orange-500 transition-colors duration-200 text-sm font-medium'
                    >
                        {link.name}
                    </NavLink>
                ))}
            </nav>
            {/* Copyright */}
            <p className="text-gray-400 text-xs text-center">
                &copy; {new Date().getFullYear()} CookShare. All rights reserved.
            </p>
        </footer>
    )
}

export default Footer
