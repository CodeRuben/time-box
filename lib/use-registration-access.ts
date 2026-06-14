"use client";

import { useEffect, useState } from "react";

type AccessResponse = {
  allowed?: boolean;
  error?: string;
};

export function useRegistrationAccess() {
  const [isLoading, setIsLoading] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      setIsLoading(true);

      try {
        const response = await fetch("/api/settings/access?feature=registration");
        const result = (await response.json()) as AccessResponse;

        if (!cancelled) {
          setIsEnabled(response.ok && result.allowed === true);
        }
      } catch {
        if (!cancelled) {
          setIsEnabled(false);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void checkAccess();

    return () => {
      cancelled = true;
    };
  }, []);

  return { isLoading, isEnabled };
}
