import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop — Scrolls to top on route changes.
 * Targets both the window (public pages) and the .main-content
 * container (Home layout where only main scrolls).
 * Mount once at the top of the component tree, above <Routes>.
 */
export default function ScrollToTop() {
	const { pathname } = useLocation();

	useEffect(() => {
		window.scrollTo(0, 0);
		// Also scroll the main-content container used in Home layout
		document.querySelector('.main-content')?.scrollTo(0, 0);
	}, [pathname]);

	return null;
}
