import React from 'react';
import type { QuestionData } from '../../services/api';

interface QuestionDisplayProps {
  question: QuestionData;
  questionNumber: number;
  totalQuestions: number;
  selectedOption?: string | null;
  correctAnswer?: string | null;
  showCorrectAnswer?: boolean;
  onSelectOption?: (option: string) => void;
  disabled?: boolean;
  variant?: 'proctor' | 'participant';
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  questionNumber,
  totalQuestions,
  selectedOption = null,
  correctAnswer = null,
  showCorrectAnswer = false,
  onSelectOption,
  disabled = false,
  variant = 'proctor',
}) => {
  const prefix = variant === 'participant' ? 'participant' : 'proctor';
  const OPTION_COLORS = ['red', 'blue', 'yellow', 'green'];

  const getOptionClass = (option: string, index: number) => {
    const color = OPTION_COLORS[index % OPTION_COLORS.length];
    const isSelected = selectedOption === option;
    const isCorrect = correctAnswer === option;
    const isWrong = showCorrectAnswer && isSelected && !isCorrect;

    let classes = `${prefix}-answer-btn ${prefix}-answer-btn-${color}`;

    if (showCorrectAnswer) {
      if (isCorrect) {
        classes += ` ${prefix}-answer-btn-correct`;
      } else if (isWrong) {
        classes += ` ${prefix}-answer-btn-wrong`;
      } else {
        classes += ` ${prefix}-answer-btn-faded`;
      }
    } else if (isSelected) {
      classes += ` ${prefix}-answer-btn-selected`;
    }

    if (disabled) {
      classes += ` ${prefix}-answer-btn-disabled`;
    }

    return classes;
  };

  return (
    <div className={`${prefix}-question-display`}>
      {/* Question Header */}
      <div className={`${prefix}-question-header`}>
        <p className={`${prefix}-question-number`}>
          Question {questionNumber} of {totalQuestions}
        </p>
        <span className={`${prefix}-badge-accent`}>{question.points} pts</span>
      </div>

      {/* Question Text */}
      <div className={`${prefix}-question-card`}>
        <h2 className={`${prefix}-question-text`}>
          {question.text}
        </h2>
      </div>

      {/* Options Grid */}
      <div className={`${prefix}-answer-grid`}>
        {question.options.map((option, index) => {
          const letter = String.fromCharCode(65 + index);
          const isSelected = selectedOption === option;
          const isCorrect = showCorrectAnswer && correctAnswer === option;

          return (
            <button
              key={index}
              onClick={() => !disabled && onSelectOption?.(option)}
              disabled={disabled}
              className={getOptionClass(option, index)}
            >
              {/* Option Letter Badge */}
              <div className={`${prefix}-answer-letter`}>
                <span>{letter}</span>
              </div>

              {/* Option Text */}
              <div className={`${prefix}-answer-text`}>
                {option}
              </div>

              {/* Correct/Wrong Indicator */}
              {showCorrectAnswer && (isCorrect || (isSelected && !isCorrect)) && (
                <div className={`${prefix}-answer-indicator`}>
                  {isCorrect ? (
                    <svg className={`${prefix}-answer-indicator-icon`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className={`${prefix}-answer-indicator-icon`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              )}

              {/* Selection Indicator */}
              {isSelected && !showCorrectAnswer && (
                <div className={`${prefix}-answer-selected-indicator`}>
                  <svg className={`${prefix}-answer-selected-icon`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionDisplay;
