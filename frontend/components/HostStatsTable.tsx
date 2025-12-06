// ============================================================================
// HOST STATS TABLE COMPONENT
// Muestra estadísticas en tiempo real de todos los jugadores para el host
// ============================================================================

'use client';

import { PlayerStats } from '@/shared/types';
import { motion } from 'framer-motion';
import Avatar from './Avatar';

interface HostStatsTableProps {
  playerStats: PlayerStats[];
  currentQuestionNumber: number;
  totalQuestions: number;
}

export default function HostStatsTable({
  playerStats,
  currentQuestionNumber,
  totalQuestions,
}: HostStatsTableProps) {
  return (
    <div className="space-y-6">
      {/* Header con info de pregunta actual */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-white p-6 text-center"
      >
        <h2 className="text-3xl font-bold text-gray-900">
          Pregunta {currentQuestionNumber + 1} de {totalQuestions}
        </h2>
        <p className="text-gray-600 mt-2">Estadísticas en vivo</p>
      </motion.div>

      {/* Tabla de estadísticas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card-white overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-primary text-white">
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                  Pos
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                  Jugador
                </th>
                <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">
                  Puntaje
                </th>
                <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">
                  Correctas
                </th>
                <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">
                  Incorrectas
                </th>
                <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">
                  % Correctas
                </th>
                <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">
                  % Incorrectas
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {playerStats.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No hay jugadores todavía...
                  </td>
                </tr>
              ) : (
                playerStats.map((stat, index) => (
                  <motion.tr
                    key={stat.player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Posición */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold">
                        {index + 1}
                      </div>
                    </td>

                    {/* Jugador */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <Avatar avatar={stat.player.avatar} size="sm" />
                        <div>
                          <div className="text-sm font-bold text-gray-900">
                            {stat.player.name}
                          </div>
                          {stat.player.streak > 0 && (
                            <div className="text-xs text-orange-500 font-semibold">
                              Racha: {stat.player.streak}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Puntaje */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-xl font-bold text-primary">
                        {stat.score.toLocaleString()}
                      </div>
                    </td>

                    {/* Correctas */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 font-semibold">
                        {stat.correctAnswers}
                      </div>
                    </td>

                    {/* Incorrectas */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-800 font-semibold">
                        {stat.incorrectAnswers}
                      </div>
                    </td>

                    {/* Total */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {stat.totalAnswers}
                      </div>
                    </td>

                    {/* % Correctas */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col items-center">
                        <div className="text-sm font-bold text-green-600 mb-1">
                          {stat.correctPercentage.toFixed(1)}%
                        </div>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${stat.correctPercentage}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* % Incorrectas */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col items-center">
                        <div className="text-sm font-bold text-red-600 mb-1">
                          {stat.incorrectPercentage.toFixed(1)}%
                        </div>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${stat.incorrectPercentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Resumen general */}
      {playerStats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="card-white p-4 text-center">
            <div className="text-sm text-gray-600 mb-1">Total Jugadores</div>
            <div className="text-3xl font-bold text-primary">
              {playerStats.length}
            </div>
          </div>

          <div className="card-white p-4 text-center">
            <div className="text-sm text-gray-600 mb-1">Puntaje Promedio</div>
            <div className="text-3xl font-bold text-blue-600">
              {Math.round(
                playerStats.reduce((sum, s) => sum + s.score, 0) /
                  playerStats.length
              ).toLocaleString()}
            </div>
          </div>

          <div className="card-white p-4 text-center">
            <div className="text-sm text-gray-600 mb-1">Precisión Promedio</div>
            <div className="text-3xl font-bold text-green-600">
              {(
                playerStats.reduce((sum, s) => sum + s.correctPercentage, 0) /
                playerStats.length
              ).toFixed(1)}
              %
            </div>
          </div>

          <div className="card-white p-4 text-center">
            <div className="text-sm text-gray-600 mb-1">Puntaje Más Alto</div>
            <div className="text-3xl font-bold text-purple-600">
              {Math.max(...playerStats.map((s) => s.score)).toLocaleString()}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
