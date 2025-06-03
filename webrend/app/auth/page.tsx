'use client';

import React, { useState, FormEvent, Suspense, useEffect } from 'react';
import { auth } from '../lib/firebase-client';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  AuthError 
} from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '../components/ThemeProvider/ThemeProvider';
import './auth.scss';

// Add SF Pro font
if (typeof window !== 'undefined') {
  const link = document.createElement('link');
  link.href = 'https://applesocial.s3.amazonaws.com/assets/styles/fonts/sanfrancisco/sanfranciscodisplay-regular-webfont.woff';
  link.rel = 'preload';
  link.as = 'font';
  link.type = 'font/woff';
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

interface FormData {
  email: string;
  password: string;
}

interface AuthFormProps {
  onSubmit: (redirectPath: string) => Promise<void>;
  isSignUp: boolean;
  setIsSignUp: (value: boolean) => void;
  isLoading: boolean;
  error: string;
  formData: FormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleGoogleSignIn: () => Promise<void>;
}

function AuthForm({ 
  onSubmit, 
  isSignUp,
  setIsSignUp,
  isLoading, 
  error, 
  formData, 
  handleInputChange,
  handleGoogleSignIn
}: AuthFormProps): React.ReactElement {
  const searchParams = useSearchParams();
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    await onSubmit(searchParams.get('from') ?? '/');
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="form-groups">
        <div className="form-group">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="form-input"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
          />
        </div>
        <div className="form-group">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            required
            className="form-input"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
          />
        </div>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <button
        type="submit"
        className="submit-button"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="loading-spinner">
            <svg className="spinner-icon" viewBox="0 0 24 24">
              <circle className="spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"></circle>
              <path className="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
        ) : isSignUp ? 'Create Account' : 'Sign In'}
      </button>

      <div className="divider-container">
        <div className="divider-line"></div>
        <span className="divider-text">or</span>
        <div className="divider-line"></div>
      </div>

      <button
        type="button"
        className="google-button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
      >
        <svg className="google-icon" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span>Continue with Google</span>
      </button>

      <div className="auth-footer">
        <button
          type="button"
          className="toggle-link"
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
        </button>
      </div>
    </form>
  );
}

export default function AuthPage(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const { theme } = useTheme();
  
  const [isSignUp, setIsSignUp] = useState<boolean>(mode === 'signup');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    setIsSignUp(mode === 'signup');
  }, [mode]);

  // Determine if dark mode should be applied
  const isDarkMode = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleFormSubmit = async (redirectTo: string): Promise<void> => {
    setError('');
    setIsLoading(true);

    try {
      const { email, password } = formData;
      const authFunction = isSignUp ? createUserWithEmailAndPassword : signInWithEmailAndPassword;
      const userCredential = await authFunction(auth, email, password);

      const idToken = await userCredential.user.getIdToken();

      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      setFormData({ email: '', password: '' });
      router.push(redirectTo);
      router.refresh();

    } catch (error) {
      const authError = error as AuthError;
      if (authError.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else if (authError.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters');
      } else if (authError.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGoogleSignIn = async (): Promise<void> => {
    setError('');
    setIsLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      const idToken = await userCredential.user.getIdToken();

      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const redirectTo = searchParams.get('from') ?? '/';
      router.push(redirectTo);
      router.refresh();

    } catch (error) {
      const authError = error as AuthError;
      if (authError.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled');
      } else if (authError.code === 'auth/popup-blocked') {
        setError('Pop-up blocked. Please allow pop-ups for this site.');
      } else {
        setError('Failed to sign in with Google. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`auth-container ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      <div className="auth-wrapper">
        <div className="auth-card">
          <h2 className="auth-title">
            {isSignUp ? 'Create your account' : 'Sign in to WebRend'}
          </h2>
          
          <Suspense fallback={<div className="loading-fallback"></div>}>
            <AuthForm 
              onSubmit={handleFormSubmit}
              isSignUp={isSignUp}
              setIsSignUp={setIsSignUp}
              isLoading={isLoading}
              error={error}
              formData={formData}
              handleInputChange={handleInputChange}
              handleGoogleSignIn={handleGoogleSignIn}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}