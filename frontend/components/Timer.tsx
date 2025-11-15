// ============================================================================
// TIMER COMPONENT
// Timer circular que muestra el tiempo restante para responder
// ============================================================================

'use client';

import { useEffect, useState } from 'react';

interface TimerProps {
  startTime: number; // timestamp de inicio
  duration: number; // duración en milliseconds
  onTimeUp?: () => void;
}

export default function Timer({ startTime, duration, onTimeUp }: TimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [percentage, setPercentage] = useState(100);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTime;
      const remaining = Math.max(0, duration - elapsed);

      setTimeRemaining(remaining);
      setPercentage((remaining / duration) * 100);

      if (remaining === 0 && onTimeUp) {
        onTimeUp();
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [startTime, duration, onTimeUp]);

  const seconds = Math.ceil(timeRemaining / 1000);
  const circumference = 2 * Math.PI * 45; // radio = 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Color basado en el tiempo restante
  const getColor = () => {
    if (percentage > 50) return '#2ecc71'; // verde
    if (percentage > 25) return '#f1c40f'; // amarillo
    return '#e74c3c'; // rojo
  };

  return (
    <div className="relative w-32 h-32">
      <svg className="transform -rotate-90 w-full h-full">
        {/* Círculo de fondo */}
        <circle
          cx="50%"
          cy="50%"
          r="45"
          stroke="#ffffff20"
          strokeWidth="8"
          fill="none"
        />
        {/* Círculo de progreso */}
        <circle
          cx="50%"
          cy="50%"
          r="45"
          stroke={getColor()}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-100"
        />
      </svg>
      {/* Número en el centro */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-4xl font-bold text-white text-shadow">{seconds}</span>
      </div>
    </div>
  );
}
