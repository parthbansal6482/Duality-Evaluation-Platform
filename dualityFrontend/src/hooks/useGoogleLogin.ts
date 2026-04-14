import { useEffect, useRef, useState } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
let gsiInitialized = false;

interface UseGoogleLoginOptions {
  onSuccess: (credential: string) => void;
  onError: (message: string) => void;
}

export function useGoogleLogin({ onSuccess, onError }: UseGoogleLoginOptions) {
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      onError('Google Sign-In is not configured. Missing VITE_GOOGLE_CLIENT_ID.');
      return;
    }

    const initializeGoogle = () => {
      // Re-initialize if the button ref is present, even if gsiInitialized is true
      // strictly to handle remounts and multiple buttons in the same SPA session.
      if (window.google?.accounts?.id && googleButtonRef.current) {
        gsiInitialized = true;
        googleButtonRef.current.innerHTML = '';
        
        window.google.accounts.id.disableAutoSelect();
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: { credential: string }) => {
            setIsLoading(true);
            onSuccess(response.credential);
            setIsLoading(false);
          },
          auto_select: false,
          ux_mode: "popup",
        });

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
      initializeGoogle();
    } else {
      const checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkInterval);
          initializeGoogle();
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }
  }, [onSuccess, onError]);

  return { googleButtonRef, isLoading };
}
