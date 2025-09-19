import { useState, useEffect } from 'react';

type OrientationType = 'portrait' | 'landscape' | undefined;

export function useOrientation() {
  const [orientation, setOrientation] = useState<OrientationType>(undefined);

  useEffect(() => {
    // Function to update orientation
    const updateOrientation = () => {
      if (window.matchMedia("(orientation: portrait)").matches) {
        setOrientation('portrait');
      } else {
        setOrientation('landscape');
      }
    };

    // Initial check
    updateOrientation();

    // Add event listeners
    window.addEventListener('orientationchange', updateOrientation);
    window.addEventListener('resize', updateOrientation);

    // Cleanup
    return () => {
      window.removeEventListener('orientationchange', updateOrientation);
      window.removeEventListener('resize', updateOrientation);
    };
  }, []);

  return orientation;
}
