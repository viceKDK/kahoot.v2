'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('¡Cuenta creada! Revisa tu email para confirmar o inicia sesión.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onClose();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'apple' | 'google') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl relative overflow-hidden text-gray-900">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors text-2xl"
        >
          ✕
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-primary mb-2">
            {isSignUp ? 'Crear Cuenta' : '¡Hola de nuevo!'}
          </h2>
          <p className="text-gray-500 font-medium">
            {isSignUp ? 'Únete a la arena de QuizArena' : 'Ingresa para guardar tu progreso'}
          </p>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1 ml-1 text-gray-700">Email</label>
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-gray-100 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl px-4 py-3 text-gray-900 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1 ml-1 text-gray-700">Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-gray-100 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl px-4 py-3 text-gray-900 outline-none transition-all"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-xl font-medium border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 text-lg uppercase tracking-wider"
          >
            {loading ? 'Procesando...' : (isSignUp ? 'Registrarse' : 'Iniciar Sesión')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary font-bold hover:underline transition-colors"
          >
            {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase font-black tracking-widest">
            <span className="px-4 bg-white text-gray-400">O continúa con</span>
          </div>
        </div>

        {/* Social Login (Apple at bottom) */}
        <button
          onClick={() => handleSocialLogin('apple')}
          className="w-full bg-black text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-900 transition-all active:scale-95 shadow-xl"
        >
          <img src="/apple-logo.svg" alt="Apple" className="w-6 h-6 invert" />
          Apple
        </button>
      </div>
    </div>
  );
}