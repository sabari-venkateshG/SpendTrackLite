
'use client';

import { useState, useEffect } from 'react';

// This hook is deprecated and will be removed.
// The app has been refactored to use a context-based approach for client-side state.
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}
