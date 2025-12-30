'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import LoginModal from './LoginModal';

export default function AuthButton() {
  const { user, loading, signOut } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading) {
    return <div className="animate-pulse bg-gray-700 h-10 w-24 rounded-full"></div>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {/* Avatar (usamos primera letra del email si no hay foto) */}
          <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold border-2 border-purple-400 overflow-hidden">
              {user.user_metadata.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                (user.email?.[0] || 'U').toUpperCase()
              )}
            </div>
            <span className="hidden md:block text-white font-medium text-sm">
              {user.user_metadata.full_name || user.email?.split('@')[0]}
            </span>
          </Link>
        </div>
        
        <button
          onClick={() => signOut()}
          className="bg-red-500/20 hover:bg-red-500/40 text-red-200 px-4 py-2 rounded-full text-sm font-bold transition-all border border-red-500/50"
        >
          Salir
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-white text-black px-5 py-2 rounded-full font-bold hover:bg-gray-200 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
      >
        Iniciar Sesión
      </button>

      <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
