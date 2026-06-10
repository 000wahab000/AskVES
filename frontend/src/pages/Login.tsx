import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithGoogle, getSession, SUPABASE_CONFIGURED } from "../lib/supabase";

export function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect straight to chat
  useEffect(() => {
    getSession().then(session => {
      if (session) navigate('/chat', { replace: true });
    });
  }, [navigate]);

  async function handleGoogleLogin() {
    if (!SUPABASE_CONFIGURED) {
      // Dev mode: skip auth
      navigate('/chat')
      return
    }
    setLoading(true);
    setError('');
    try {
      const { error: oauthError } = await signInWithGoogle();
      if (oauthError) throw oauthError;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      gap: '16px',
      background: 'var(--bg, #060e1f)',
      color: 'var(--t1, #dce8f5)',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      <div style={{
        background: 'var(--card, #0d1b2e)',
        border: '1px solid var(--border, rgba(255,255,255,0.08))',
        borderRadius: '16px',
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        maxWidth: '360px',
        width: '90%',
      }}>
        <div style={{ fontSize: '2.5rem' }}>🎓</div>
        <h1 style={{ fontSize: '1.6rem', margin: 0, fontFamily: 'Space Grotesk, sans-serif' }}>
          Welcome to AskVES
        </h1>
        <p style={{ color: 'var(--t2, #8ca4bf)', margin: 0, textAlign: 'center', fontSize: '0.95rem' }}>
          Sign in with your <strong>@ves.ac.in</strong> Google account to continue.
        </p>

        {error && (
          <p style={{
            color: '#f87171',
            background: 'rgba(248,113,113,0.1)',
            border: '1px solid rgba(248,113,113,0.25)',
            borderRadius: '8px',
            padding: '10px 16px',
            margin: 0,
            fontSize: '0.9rem',
            width: '100%',
            boxSizing: 'border-box',
          }}>
            {error}
          </p>
        )}

        <button
          id="google-login-btn"
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '12px 24px',
            background: loading ? 'rgba(255,255,255,0.05)' : 'white',
            color: loading ? 'var(--t2)' : '#1a1a2e',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            width: '100%',
            transition: 'opacity 0.2s',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {!loading && (
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          {loading ? 'Redirecting…' : 'Sign in with Google'}
        </button>

        <p style={{ color: 'var(--t3, #4d6a87)', fontSize: '0.78rem', margin: 0, textAlign: 'center' }}>
          Only @ves.ac.in accounts are accepted.
        </p>
      </div>
    </div>
  );
}