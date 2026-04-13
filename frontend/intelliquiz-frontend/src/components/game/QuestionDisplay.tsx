import React from 'react';
import { CheckCircle, XCircle, Check } from 'lucide-react';
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

  const getOptionClass = (option: string, letter: string) => {
    const isSelected = selectedOption === option || selectedOption === letter;
    const isCorrect = correctAnswer === option || correctAnswer === letter;
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
          const isSelected = selectedOption === option || selectedOption === letter;
          const isCorrect = showCorrectAnswer && (correctAnswer === option || correctAnswer === letter);

          return (
            <button
              key={index}
              onClick={() => !disabled && onSelectOption?.(option)}
              disabled={disabled}
              className={getOptionClass(option, letter)}
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
                    <CheckCircle className={`${prefix}-answer-indicator-icon`} color="#ffffff" strokeWidth={2.5} />
                  ) : (
                    <XCircle className={`${prefix}-answer-indicator-icon`} color="#ffffff" strokeWidth={2.5} />
                  )}
                </div>
              )}

              {/* Selection Indicator */}
              {isSelected && !showCorrectAnswer && (
                <div className={`${prefix}-answer-selected-indicator`}>
                  <Check className={`${prefix}-answer-selected-icon`} strokeWidth={4} />
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
