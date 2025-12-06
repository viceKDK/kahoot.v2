// ============================================================================
// PARTICLE EXPLOSION - NEO-ARCADE Effect
// Efecto de explosión de partículas para respuestas correctas
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  angle: number;
  velocity: number;
}

interface ParticleExplosionProps {
  trigger: boolean;
  color?: 'success' | 'error';
}

export default function ParticleExplosion({ trigger, color = 'success' }: ParticleExplosionProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (trigger) {
      // Crear 30 partículas que explotan desde el centro
      const newParticles: Particle[] = [];
      const colors = color === 'success'
        ? ['#00ff88', '#00ffff', '#ffff00', '#ff00ff', '#ff8800']
        : ['#ff0066', '#ff3366', '#ff6666', '#cc0044', '#990033'];

      for (let i = 0; i < 30; i++) {
        newParticles.push({
          id: i,
          x: 50, // Centro
          y: 50,
          size: Math.random() * 15 + 5,
          color: colors[Math.floor(Math.random() * colors.length)],
          angle: (i / 30) * Math.PI * 2,
          velocity: Math.random() * 300 + 200,
        });
      }

      setParticles(newParticles);

      // Limpiar después de la animación
      setTimeout(() => setParticles([]), 2000);
    }
  }, [trigger, color]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size}px ${particle.color}`,
            left: '50%',
            top: '50%',
          }}
          initial={{
            x: 0,
            y: 0,
            scale: 0,
            opacity: 1
          }}
          animate={{
            x: Math.cos(particle.angle) * particle.velocity,
            y: Math.sin(particle.angle) * particle.velocity,
            scale: [0, 1, 0.5],
            opacity: [1, 1, 0],
            rotate: Math.random() * 720,
          }}
          transition={{
            duration: 1.5,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        />
      ))}
    </div>
  );
}
