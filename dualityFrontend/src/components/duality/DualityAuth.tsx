import { useState } from 'react';
import { Chrome, ArrowLeft } from 'lucide-react';
import { dualityGoogleLogin } from '../../services/duality.service';
import { useGoogleLogin } from '../../hooks/useGoogleLogin';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            ux_mode?: 'popup' | 'redirect';
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              type?: string;
              theme?: string;
              size?: string;
              text?: string;
              shape?: string;
              width?: number;
            }
          ) => void;
          prompt: (callback?: (notification: { isDisplayMoment: () => boolean;[key: string]: any }) => void) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}



export function DualityAuth({
  onLogin,
  onBack
}: {
  onLogin: (userType: 'admin' | 'student', userName: string) => void;
  onBack: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { googleButtonRef, isLoading: isGoogleLoading } = useGoogleLogin({
    onSuccess: async (credential) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await dualityGoogleLogin(credential);
        if (result.success) {
          localStorage.setItem('dualityToken', result.data.token);
          localStorage.setItem('dualityUser', JSON.stringify(result.data.user));
          onLogin(result.data.user.role, result.data.user.name);
        } else {
          setError(result.message || 'Login failed');
        }
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        setError(error.response?.data?.message || 'Authentication failed');
      } finally {
        setIsLoading(false);
      }
    },
    onError: (message) => setError(message),
  });

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Platform Selection</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Chrome className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Sign in to Assignments
          </h1>
          <p className="text-gray-400">
            Continue with your @bmu.edu.in Google account
          </p>
        </div>

        {/* Login Container */}
        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-4 mb-4">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-400">Signing in...</span>
            </div>
          )}

          {/* Google Sign-In Button (rendered by Google) */}
          <div className="flex justify-center">
            <div ref={googleButtonRef}></div>
          </div>

          <div className="w-full h-10"></div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-zinc-900 text-gray-500">
                Secure authentication
              </span>
            </div>
          </div>

          {/* Info Text */}
          <div className="space-y-3 text-sm text-gray-500 text-center">
            <p>
              Only @bmu.edu.in accounts are allowed.
            </p>
            <p className="text-xs">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
