import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component ensures that navigating to any new route
 * resets the scroll position to the top of the window immediately,
 * preventing retention of prior section scroll states.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // If navigating to an anchor hash (such as #studio), do not reset scroll to top
    if (hash || window.location.hash) return;

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }, [pathname, hash]);

  return null;
}
