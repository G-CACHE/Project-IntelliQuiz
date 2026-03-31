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
  const questionType = question.type || 'MULTIPLE_CHOICE';
  const optionList = questionType === 'TRUE_FALSE'
    ? (question.options.length >= 2 ? question.options.slice(0, 2) : ['True', 'False'])
    : question.options;

  const getOptionClass = (option: string) => {
    const isSelected = selectedOption === option;
    const isCorrect = correctAnswer === option;
    const isWrong = showCorrectAnswer && isSelected && !isCorrect;

    let classes = `${prefix}-answer-btn`;

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

      {/* Answer UI */}
      {questionType === 'IDENTIFICATION' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="text"
            value={selectedOption ?? ''}
            onChange={(e) => !disabled && onSelectOption?.(e.target.value)}
            placeholder="Type your answer"
            disabled={disabled}
            className={`${prefix}-answer-btn`}
            style={{
              width: '100%',
              cursor: disabled ? 'not-allowed' : 'text',
              textAlign: 'left',
              padding: '14px 16px',
            }}
          />
          {showCorrectAnswer && correctAnswer && (
            <div className={`${prefix}-question-card`} style={{ padding: '12px 16px' }}>
              <p style={{ margin: 0, fontWeight: 700 }}>Accepted Answer: {correctAnswer}</p>
            </div>
          )}
        </div>
      ) : (
        <div className={`${prefix}-answer-grid`}>
          {optionList.map((option, index) => {
          const letter = String.fromCharCode(65 + index);
          const isSelected = selectedOption === option;
          const isCorrect = showCorrectAnswer && correctAnswer === option;

          return (
            <button
              key={index}
              onClick={() => !disabled && onSelectOption?.(option)}
              disabled={disabled}
              className={getOptionClass(option)}
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
      )}
    </div>
  );
};

export default QuestionDisplay;
