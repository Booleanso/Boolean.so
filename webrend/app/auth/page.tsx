'use client';

import React, { useState, FormEvent, Suspense, useEffect } from 'react';
import { auth } from '../lib/firebase-client';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, AuthError } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import './auth.scss';

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
}

function AuthForm({ 
  onSubmit, 
  isSignUp,
  setIsSignUp,
  isLoading, 
  error, 
  formData, 
  handleInputChange 
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
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="form-input"
            placeholder="m@example.com"
            value={formData.email}
            onChange={handleInputChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            required
            className="form-input"
            placeholder="••••••••"
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

      <div>
        <button
          type="submit"
          className="submit-button"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="loading-spinner">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      </div>

      <div className="toggle-auth-mode">
        <button
          type="button"
          className="toggle-button"
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
        </button>
      </div>

      {/* Commenting out social login buttons for now
      <div className="divider">
        <div className="divider-text">
          <span>Or</span>
        </div>
      </div>

      <div className="social-buttons">
        <button
          type="button"
          className="social-button"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
          </svg>
          <span>Continue with Apple</span>
        </button>

        <button
          type="button"
          className="social-button"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
            <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
          </svg>
          <span>Continue with Google</span>
        </button>
      </div>
      */}

      <p className="terms-text">
        By clicking continue, you agree to our{' '}
        <a href="#">Terms of Service</a> and{' '}
        <a href="#">Privacy Policy</a>
      </p>
    </form>
  );
}

export default function AuthPage(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  
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

  return (
    <div className="auth-container">
      <div className="auth-content">
        <div className="auth-header">
          <h2 className="auth-title">Welcome to WebRend.</h2>
          <p className="auth-subtitle">
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setIsSignUp(false)}
                  className="auth-toggle-button"
                >
                  Login
                </button>
              </>
            ) : (
              <>
                Do not have an account?{' '}
                <button
                  onClick={() => setIsSignUp(true)}
                  className="auth-toggle-button"
                >
                  Sign up
                </button>
              </>
            )}
          </p>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <AuthForm 
            onSubmit={handleFormSubmit}
            isSignUp={isSignUp}
            setIsSignUp={setIsSignUp}
            isLoading={isLoading}
            error={error}
            formData={formData}
            handleInputChange={handleInputChange}
          />
        </Suspense>
      </div>
    </div>
  );
}