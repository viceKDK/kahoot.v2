'use client';

import Link from 'next/link';
import AuthButton from './AuthButton';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 p-4">
      <div className="max-w-7xl mx-auto bg-gray-900/90 backdrop-blur-md rounded-full border border-gray-800 px-6 py-3 flex justify-between items-center shadow-lg">
        {/* Logo */}
        <Link 
          href="/" 
          className="text-2xl font-black text-white hover:scale-105 transition-transform"
        >
          QUIZ<span className="text-purple-500">ARENA</span>
        </Link>

        {/* Auth Button */}
        <div>
          <AuthButton />
        </div>
      </div>
    </nav>
  );
}