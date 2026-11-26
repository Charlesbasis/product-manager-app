import { useSyncExternalStore } from 'react';

const MOBILE_BREAKPOINT = 768;

// Lazy getter — never touch window at module load time
const getMediaQuery = () => {
    if (typeof window === 'undefined') return null;
    return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
};

function mediaQueryListener(callback: (event: MediaQueryListEvent) => void) {
    const mql = getMediaQuery();
    if (!mql) return () => {};

    mql.addEventListener('change', callback);
    return () => mql.removeEventListener('change', callback);
}

function isSmallerThanBreakpoint() {
    const mql = getMediaQuery();
    return mql ? mql.matches : false;
}

// SSR-safe fallback
function getServerSnapshot() {
    return false; // assume desktop on server
}

export function useIsMobile() {
    return useSyncExternalStore(
        mediaQueryListener,
        isSmallerThanBreakpoint,
        getServerSnapshot,
    );
}
