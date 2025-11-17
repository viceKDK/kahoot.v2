// ============================================================================
// QUESTION EDITOR COMPONENT
// Componente para agregar/editar una pregunta con 4 opciones
// ============================================================================

'use client';

import { useState } from 'react';
import { Question, QuestionOption } from '@/shared/types';
import { motion } from 'framer-motion';

interface QuestionEditorProps {
  question?: Omit<Question, 'id'>;
  onSave: (question: Omit<Question, 'id'>) => void;
  onCancel: () => void;
  questionNumber: number;
}

const optionColors = ['bg-option-red', 'bg-option-blue', 'bg-option-yellow', 'bg-option-green'];
const optionLabels = ['A', 'B', 'C', 'D'];

export default function QuestionEditor({
  question,
  onSave,
  onCancel,
  questionNumber,
}: QuestionEditorProps) {
  const [questionText, setQuestionText] = useState(question?.text || '');
  const [imageUrl, setImageUrl] = useState(question?.imageUrl || '');
  const [timeLimit, setTimeLimit] = useState((question?.timeLimit || 15000) / 1000); // en segundos
  const [options, setOptions] = useState<Omit<QuestionOption, 'id'>[]>(
    question?.options.map(o => ({ text: o.text, isCorrect: o.isCorrect })) || [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ]
  );

  const handleOptionChange = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], text };
    setOptions(newOptions);
  };

  const handleCorrectChange = (index: number) => {
    const newOptions = options.map((opt, i) => ({
      ...opt,
      isCorrect: i === index,
    }));
    setOptions(newOptions);
  };

  const handleSave = () => {
    // Validaciones
    if (!questionText.trim()) {
      alert('Por favor ingresa el texto de la pregunta');
      return;
    }

    const filledOptions = options.filter(opt => opt.text.trim());
    if (filledOptions.length !== 4) {
      alert('Debes completar las 4 opciones');
      return;
    }

    const correctCount = options.filter(opt => opt.isCorrect).length;
    if (correctCount !== 1) {
      alert('Debes marcar exactamente 1 opción como correcta');
      return;
    }

    onSave({
      text: questionText.trim(),
      imageUrl: imageUrl.trim() || undefined,
      timeLimit: timeLimit * 1000,
      options: options.map((opt, index) => ({
        id: `temp_${index}`,
        text: opt.text.trim(),
        isCorrect: opt.isCorrect,
      })),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-white p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <h3 className="text-2xl font-bold text-gray-900">
          Pregunta {questionNumber}
        </h3>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
            Cancelar
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">
            Guardar
          </button>
        </div>
      </div>

      {/* Question Text */}
      <div>
        <label className="block text-sm font-bold mb-2 text-gray-900">
          Texto de la Pregunta *
        </label>
        <textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="¿Cuál es la capital de Francia?"
          rows={3}
          maxLength={500}
          className="w-full px-4 py-3 rounded-xl bg-gray-100 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          {questionText.length}/500 caracteres
        </p>
      </div>

      {/* Image URL (opcional) */}
      <div>
        <label className="block text-sm font-bold mb-2 text-gray-900">
          URL de Imagen (Opcional)
        </label>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://ejemplo.com/imagen.jpg"
          className="w-full px-4 py-3 rounded-xl bg-gray-100 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {imageUrl && (
          <div className="mt-2">
            <img
              src={imageUrl}
              alt="Preview"
              className="max-h-48 rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      {/* Time Limit */}
      <div>
        <label className="block text-sm font-bold mb-2 text-gray-900">
          Tiempo Límite
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="10"
            max="60"
            step="5"
            value={timeLimit}
            onChange={(e) => setTimeLimit(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-2xl font-bold text-primary w-20 text-right">
            {timeLimit}s
          </span>
        </div>
      </div>

      {/* Options */}
      <div>
        <label className="block text-sm font-bold mb-2 text-gray-900">
          Opciones de Respuesta *
        </label>
        <p className="text-xs text-gray-600 mb-3">
          Marca la opción correcta haciendo clic en el círculo
        </p>
        <div className="space-y-3">
          {options.map((option, index) => (
            <div
              key={index}
              className={`
                flex items-center gap-3 p-4 rounded-xl border-2 transition-all
                ${option.isCorrect ? 'border-correct bg-correct/10' : 'border-gray-300'}
              `}
            >
              {/* Correct Radio */}
              <button
                type="button"
                onClick={() => handleCorrectChange(index)}
                className={`
                  w-8 h-8 rounded-full border-4 flex items-center justify-center
                  ${option.isCorrect ? 'border-correct bg-correct' : 'border-gray-300 bg-white'}
                  hover:scale-110 transition-transform
                `}
              >
                {option.isCorrect && (
                  <span className="text-white text-xl">✓</span>
                )}
              </button>

              {/* Label */}
              <div
                className={`
                  w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl
                  ${optionColors[index]}
                `}
              >
                {optionLabels[index]}
              </div>

              {/* Input */}
              <input
                type="text"
                value={option.text}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Opción ${optionLabels[index]}`}
                maxLength={200}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          💡 <strong>Tip:</strong> Las 4 opciones son obligatorias. Marca exactamente 1 opción como correcta.
        </p>
      </div>
    </motion.div>
  );
}
