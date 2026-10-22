import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Terminal, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const { loginWithGoogle, googleClientId, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // Handle Google Credential response from Google Identity Services
  const handleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      setErrorMsg('No credential returned from Google.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    const res = await loginWithGoogle({ credential: response.credential });
    setLoading(false);

    if (res.success) {
      navigate('/', { replace: true });
    } else {
      setErrorMsg(res.error || 'Google authentication failed.');
    }
  };

  // Check for authorization code in URL query params if returning from OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const oauthError = params.get('error');

    if (oauthError) {
      setErrorMsg(`Google OAuth error: ${oauthError}`);
      return;
    }

    if (code) {
      const exchangeCode = async () => {
        setLoading(true);
        setErrorMsg(null);
        const res = await loginWithGoogle({
          code,
          redirectUri: `${window.location.origin}/login`
        });
        setLoading(false);
        if (res.success) {
          navigate('/', { replace: true });
        } else {
          setErrorMsg(res.error || 'Failed to authenticate authorization code.');
        }
      };
      exchangeCode();
    }
  }, [location.search, loginWithGoogle, navigate]);

  // Initialize Google Identity Services without rendering a redundant second button
  useEffect(() => {
    const isGsiLoaded = typeof window !== 'undefined' && window.google?.accounts?.id;

    if (isGsiLoaded && googleClientId) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        });
      } catch (err) {
        console.warn('Google Identity Services notice:', err);
      }
    }
  }, [googleClientId]);

  // Trigger Google OAuth flow when clicking the single "Continue with Google" button
  const handleGoogleSignIn = () => {
    setErrorMsg(null);

    if (!googleClientId) {
      setErrorMsg(
        'Google Client ID is not configured. Please set GOOGLE_CLIENT_ID in server/.env and VITE_GOOGLE_CLIENT_ID in client/.env from your Google Cloud Console.'
      );
      return;
    }

    // Use Google Identity Services popup code client if available
    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initCodeClient({
          client_id: googleClientId,
          scope: 'openid email profile',
          ux_mode: 'popup',
          callback: async (response) => {
            if (response.code) {
              setLoading(true);
              setErrorMsg(null);
              const res = await loginWithGoogle({
                code: response.code,
                redirectUri: 'postmessage'
              });
              setLoading(false);
              if (res.success) {
                navigate('/', { replace: true });
              } else {
                setErrorMsg(res.error || 'Google authentication failed.');
              }
            }
          },
          error_callback: (err) => {
            if (err?.type !== 'popup_closed') {
              setErrorMsg(`Google login error: ${err.message || err.type || 'Popup closed'}`);
            }
          }
        });
        client.requestCode();
        return;
      } catch (err) {
        console.warn('Popup client fallback:', err);
      }
    }

    // Fallback: Redirect flow to Google OAuth endpoint
    const redirectUri = `${window.location.origin}/login`;
    const scope = encodeURIComponent('openid email profile');
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      googleClientId
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${scope}&prompt=select_account&access_type=offline`;
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#090D16] text-gray-100 selection:bg-purple-600 selection:text-white">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md p-8 sm:p-10 rounded-3xl bg-[#0F172A]/90 backdrop-blur-xl border border-purple-500/20 shadow-2xl shadow-purple-950/40 text-center space-y-8">
        {/* Brand Icon & Title */}
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-lg shadow-purple-500/30">
            <Terminal className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            DSA Placement <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">OS</span>
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">
            Your personal workspace for DSA preparation and placement readiness.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-left flex items-start gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* Google Authentication Actions — EXACTLY ONE BUTTON */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3.5 px-5 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-semibold text-sm shadow-lg shadow-white/5 border border-gray-200 transition-all flex items-center justify-center gap-3 group active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            <span className="text-gray-900 font-medium">
              {loading ? 'Authenticating with Google...' : 'Continue with Google'}
            </span>
          </button>

          {/* Security guarantee text */}
          <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1.5 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>Sign in securely with your Google account to access your progress.</span>
          </p>
        </div>

        {/* Footer Meta */}
        <div className="pt-6 border-t border-gray-800/80 text-center">
          <p className="text-[11px] text-gray-400 font-mono">
            BCA 180 Problem Engine &bull; Language Practice &bull; Spaced Repetition
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
