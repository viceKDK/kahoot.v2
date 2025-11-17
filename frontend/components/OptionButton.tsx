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
      <div className="flex items-center justify-between px-4">
        <span className="text-3xl mr-4">{shape}</span>
        <span className="flex-1 text-center">{option.text}</span>
      </div>
    </button>
  );
}
