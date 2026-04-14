import { useEffect, useRef, useState, useCallback } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

// Module-level variable to track if google.accounts.id.initialize was already called
// for this specific CLIENT_ID.
let lastInitializedClientId: string | null = null;

interface UseGoogleLoginOptions {
  onSuccess: (credential: string) => void;
  onError: (message: string) => void;
}

export function useGoogleLogin({ onSuccess, onError }: UseGoogleLoginOptions) {
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Use refs for callbacks to avoid re-triggering the initialization effect
  // when these functions change (e.g. if not memoized in the parent).
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  const handleCredentialResponse = useCallback((response: { credential: string }) => {
    setIsLoading(true);
    onSuccessRef.current(response.credential);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      if (onErrorRef.current) onErrorRef.current('Google Sign-In is not configured. Missing VITE_GOOGLE_CLIENT_ID.');
      return;
    }

    const setupGoogle = () => {
      if (!window.google?.accounts?.id) return;

      // Only call initialize once per Client ID
      if (lastInitializedClientId !== GOOGLE_CLIENT_ID) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          ux_mode: "popup",
        });
        lastInitializedClientId = GOOGLE_CLIENT_ID;
      }

      // Always try to render the button if the ref is available
      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(
          googleButtonRef.current,
          {
            type: "standard",
            theme: "filled_black",
            size: "large",
            text: "continue_with",
            shape: "rectangular",
            width: 350,
          }
        );
      }
    };

    if (window.google?.accounts?.id) {
      setupGoogle();
    } else {
      const checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkInterval);
          setupGoogle();
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }
  }, [handleCredentialResponse]); // only depend on the stabilized callback

  return { googleButtonRef, isLoading };
}
