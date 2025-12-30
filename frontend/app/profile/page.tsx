'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { fetchBackend } from '@/lib/api';

// Definimos la interfaz de stats
interface PlayerStats {
  total_games_played: number;
  total_wins: number;
  total_podiums: number;
  total_correct_answers: number;
  total_questions_answered: number;
  current_streak: number;
  best_streak: number;
  xp: number;
  level: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (user) {
      fetchStats();
    }
  }, [user, loading]);

  const fetchStats = async () => {
    if (!user) return;
    
    setLoadingStats(true);
    try {
      const response = await fetchBackend(`/api/players/${user.id}/stats`);
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Calcular porcentaje de acierto
  const accuracy = stats 
    ? Math.round((stats.total_correct_answers / (stats.total_questions_answered || 1)) * 100) 
    : 0;

  // Calcular progreso de nivel (XP para siguiente nivel = nivel * 1000)
  const xpForNextLevel = (stats?.level || 1) * 1000;
  const xpProgress = stats ? (stats.xp % 1000) / 10 : 0; // % simple

  return (
    <div className="min-h-screen bg-slate-900 p-8 pt-24">
      <div className="max-w-4xl mx-auto">
        
        {/* Profile Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 mb-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl relative overflow-hidden"
        >
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>

          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-1">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                {user.user_metadata.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-white">
                    {(user.email?.[0] || 'U').toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-black font-black px-3 py-1 rounded-full border-4 border-slate-900">
              Lvl {stats?.level || 1}
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <h1 className="text-4xl font-black text-white">
              {user.user_metadata.full_name || user.email?.split('@')[0]}
            </h1>
            <p className="text-white/40 font-mono text-sm">{user.email}</p>
            
            {/* XP Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs font-bold text-purple-300 mb-1">
                <span>XP {stats?.xp || 0}</span>
                <span>Siguiente Nivel: {xpForNextLevel}</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon="🎮" label="Partidas" value={stats?.total_games_played} delay={0.1} />
          <StatCard icon="🏆" label="Victorias" value={stats?.total_wins} delay={0.2} />
          <StatCard icon="🎯" label="Precisión" value={`${accuracy}%`} delay={0.3} />
          <StatCard icon="🔥" label="Racha Máx." value={stats?.best_streak} delay={0.4} />
        </div>

        {/* Recent History Placeholder */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span>📜</span> Historial Reciente
          </h2>
          
          <div className="space-y-3">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="bg-white/5 p-4 rounded-xl flex items-center justify-between hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold">
                    #{i + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Quiz de Cultura General</h3>
                    <p className="text-xs text-white/40">Hace {i + 2} días</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-emerald-400">Top {i + 1}</div>
                  <div className="text-xs text-white/40">1,250 pts</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}

function StatCard({ icon, label, value, delay }: { icon: string, label: string, value: any, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center hover:bg-white/10 transition-colors"
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-black text-white mb-1">{value || 0}</div>
      <div className="text-xs text-white/40 uppercase font-bold tracking-wider">{label}</div>
    </motion.div>
  );
}
