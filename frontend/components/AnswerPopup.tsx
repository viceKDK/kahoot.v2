// ============================================================================
// ANSWER POPUP COMPONENT
// Pop-up que muestra los puntos ganados después de responder
// ============================================================================

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface AnswerPopupProps {
  isCorrect: boolean;
  pointsEarned: number;
  show: boolean;
  onComplete?: () => void;
}

export default function AnswerPopup({
  isCorrect,
  pointsEarned,
  show,
  onComplete,
}: AnswerPopupProps) {
  const [displayPoints, setDisplayPoints] = useState(0);

  useEffect(() => {
    if (show && pointsEarned > 0) {
      // Animación de conteo de puntos
      let current = 0;
      const increment = Math.ceil(pointsEarned / 20);
      const timer = setInterval(() => {
        current += increment;
        if (current >= pointsEarned) {
          setDisplayPoints(pointsEarned);
          clearInterval(timer);
        } else {
          setDisplayPoints(current);
        }
      }, 30);

      return () => clearInterval(timer);
    } else {
      setDisplayPoints(0);
    }
  }, [show, pointsEarned]);

  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, 2500);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            {/* Popup */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', duration: 0.6, bounce: 0.5 }}
              className={`
                relative rounded-3xl p-12 shadow-2xl max-w-md w-full mx-4
                ${
                  isCorrect
                    ? 'bg-gradient-to-br from-green-400 to-green-600'
                    : 'bg-gradient-to-br from-red-400 to-red-600'
                }
              `}
            >
              {/* Confetti effect for correct answers */}
              {isCorrect && (
                <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{
                        x: '50%',
                        y: '50%',
                        scale: 0,
                      }}
                      animate={{
                        x: `${Math.random() * 100}%`,
                        y: `${Math.random() * 100}%`,
                        scale: [0, 1, 0],
                        rotate: Math.random() * 360,
                      }}
                      transition={{
                        duration: 1.5,
                        delay: Math.random() * 0.3,
                      }}
                      className={`absolute w-3 h-3 ${
                        ['bg-yellow-300', 'bg-blue-300', 'bg-pink-300', 'bg-purple-300'][
                          i % 4
                        ]
                      } rounded-full`}
                    />
                  ))}
                </div>
              )}

              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-center mb-6"
              >
                <div className="text-9xl">
                  {isCorrect ? '✅' : '❌'}
                </div>
              </motion.div>

              {/* Text */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl font-black text-white text-center mb-4 drop-shadow-lg"
              >
                {isCorrect ? '¡CORRECTO!' : '¡OOPS!'}
              </motion.h2>

              {/* Points */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: 'spring' }}
                className="text-center"
              >
                <div className="text-7xl font-black text-white drop-shadow-lg">
                  +{displayPoints}
                </div>
                <div className="text-2xl font-bold text-white/90 mt-2">
                  puntos
                </div>
              </motion.div>

              {/* Pulse animation */}
              {isCorrect && (
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                  }}
                  className="absolute inset-0 bg-white/10 rounded-3xl -z-10"
                />
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
