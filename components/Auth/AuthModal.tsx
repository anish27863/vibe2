'use client';

/**
 * AuthModal component
 * Full-featured login/signup modal with Supabase auth.
 * Supports email/password and Google OAuth.
 */

import React, { useState, useCallback } from 'react';
import { X, Mail, Lock, User, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface AuthModalProps {
  isOpen:  boolean;
  onClose: () => void;
}

type AuthMode = 'signin' | 'signup';

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode,    setMode]    = useState<AuthMode>('signin');
  const [email,   setEmail]   = useState('');
  const [password, setPassword] = useState('');
  const [name,    setName]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const reset = () => {
    setError(null);
    setSuccess(null);
  };

  const handleEmailAuth = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    reset();

    try {
      const result = mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password, name);

      if (result.error) {
        setError(result.error);
      } else {
        if (mode === 'signup') {
          setSuccess('Account created! Check your email to confirm, then sign in.');
        } else {
          onClose();
        }
      }
    } finally {
      setLoading(false);
    }
  }, [mode, email, password, name, signIn, signUp, onClose]);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-surface-card/90 backdrop-blur-xl shadow-glass p-6 animate-slide-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo & title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
            <span className="text-lg">🗺</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              {mode === 'signin' ? 'Welcome back' : 'Get started'}
            </h2>
            <p className="text-xs text-white/40">SmartRoute • Intelligent Navigation</p>
          </div>
        </div>


        {/* Email form */}
        <form onSubmit={handleEmailAuth} className="space-y-3">
          {mode === 'signup' && (
            <div className="relative">
              <User className="absolute left-3 top-3.5 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm outline-none focus:border-brand-400/60 focus:ring-1 focus:ring-brand-400/30 transition-all"
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 w-4 h-4 text-white/30" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm outline-none focus:border-brand-400/60 focus:ring-1 focus:ring-brand-400/30 transition-all"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 w-4 h-4 text-white/30" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              minLength={6}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm outline-none focus:border-brand-400/60 focus:ring-1 focus:ring-brand-400/30 transition-all"
            />
          </div>

          {/* Error / Success messages */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-300">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-all duration-150 disabled:opacity-50 shadow-glow"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Mode switch */}
        <p className="text-center text-xs text-white/40 mt-4">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); reset(); }}
            className="text-brand-300 hover:text-brand-200 font-medium transition-colors"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
