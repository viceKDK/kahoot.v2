// ============================================================================
// ROOT LAYOUT
// Layout raíz de Next.js 15
// ============================================================================

import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'QuizArena - Kahoot-like Quiz Game',
  description: 'Real-time multiplayer quiz game inspired by Kahoot',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
