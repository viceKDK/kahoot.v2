// ============================================================================
// OPTION BUTTON COMPONENT
// Botón de opción de respuesta estilo Kahoot
// ============================================================================

'use client';

import { QuestionOption } from '@/shared/types';

interface OptionButtonProps {
  option: QuestionOption;
  index: number;
  onClick: () => void;
  isSelected: boolean;
  isDisabled: boolean;
  showCorrect?: boolean;
}

const optionColors = ['option-red', 'option-blue', 'option-yellow', 'option-green'];
const optionShapes = ['△', '◇', '○', '□'];

export default function OptionButton({
  option,
  index,
  onClick,
  isSelected,
  isDisabled,
  showCorrect = false,
}: OptionButtonProps) {
  const colorClass = optionColors[index % 4];
  const shape = optionShapes[index % 4];

  const getButtonClass = () => {
    let classes = 'option-btn ';

    if (showCorrect) {
      if (option.isCorrect) {
        classes += 'bg-correct hover:bg-correct ring-4 ring-white';
      } else if (isSelected && !option.isCorrect) {
        classes += 'bg-incorrect hover:bg-incorrect ring-4 ring-white';
      } else {
        classes += 'opacity-50';
      }
    } else {
      classes += colorClass;
      if (isSelected) {
        classes += ' ring-4 ring-white scale-105';
      }
    }

    if (isDisabled) {
      classes += ' cursor-not-allowed';
    }

    return classes;
  };

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={getButtonClass()}
    >
      <div className="flex items-center gap-6 px-6">
        <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center bg-white/20 rounded-2xl">
          <span className="text-5xl drop-shadow-lg">{shape}</span>
        </div>
        <span className="flex-1 text-left font-black tracking-tight leading-tight">
          {option.text}
        </span>
      </div>
    </button>
  );
}
