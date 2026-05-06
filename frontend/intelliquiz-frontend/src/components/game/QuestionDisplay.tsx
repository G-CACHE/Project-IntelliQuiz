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

  const normalize = (val: string | null | undefined) => (val || '').trim().toLowerCase();

  const getOptionClass = (option: string, letter: string) => {
    const normSelected = normalize(selectedOption);
    const isSelected = normSelected === normalize(option) || normSelected === letter.toLowerCase();
    const isCorrect = showCorrectAnswer && (normalize(correctAnswer) === normalize(option) || normalize(correctAnswer) === letter.toLowerCase());
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
        <div className={`${prefix}-question-number-badge`}>
          <span className={`${prefix}-question-number-label`}>Question</span>
          <span className={`${prefix}-question-number-value`}>{questionNumber}</span>
          <span className={`${prefix}-question-number-total`}>/ {totalQuestions}</span>
        </div>
        <div className={`${prefix}-badge-points`}>
          <span className={`${prefix}-points-value`}>{question.points}</span>
          <span className={`${prefix}-points-label`}>PTS</span>
        </div>
      </div>

      {/* Question Card */}
      <div className={`${prefix}-question-card-wrapper`}>
        <div className={`${prefix}-question-card`}>
          <h2 className={`${prefix}-question-text`}>
            {question.text}
          </h2>
        </div>
        <div className={`${prefix}-question-card-glow`}></div>
      </div>

      {/* Answer UI */}
      {questionType === 'IDENTIFICATION' ? (
        <div className={`${prefix}-identification-container`}>
          <div className={`${prefix}-input-wrapper`}>
            <input
              type="text"
              value={selectedOption ?? ''}
              onChange={(e) => !disabled && onSelectOption?.(e.target.value)}
              placeholder="Type your answer here..."
              disabled={disabled}
              className={`${prefix}-answer-input`}
            />
            <div className={`${prefix}-input-focus-border`}></div>
          </div>
          {showCorrectAnswer && correctAnswer && (
            <div className={`${prefix}-accepted-answer-card`}>
              <div className={`${prefix}-accepted-label`}>Accepted Answer</div>
              <div className={`${prefix}-accepted-value`}>{correctAnswer}</div>
            </div>
          )}
        </div>
      ) : (
        <div className={`${prefix}-answer-grid`}>
          {optionList.map((option, index) => {
          const letter = String.fromCharCode(65 + index);
          const normSelected = normalize(selectedOption);
          const isSelected = normSelected === normalize(option) || normSelected === letter.toLowerCase();
          
          const normCorrect = normalize(correctAnswer);
          const isCorrect = showCorrectAnswer && (normCorrect === normalize(option) || normCorrect === letter.toLowerCase());

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
                    <CheckCircle className={`${prefix}-answer-indicator-icon`} color="#ffffff" strokeWidth={3} />
                  ) : (
                    <XCircle className={`${prefix}-answer-indicator-icon`} color="#ffffff" strokeWidth={3} />
                  )}
                </div>
              )}

              {/* Selection Indicator */}
              {isSelected && !showCorrectAnswer && (
                <div className={`${prefix}-answer-selected-indicator`}>
                  <Check className={`${prefix}-answer-selected-icon`} strokeWidth={4} />
                </div>
              )}
              
              {/* Hover/Active Glow */}
              <div className={`${prefix}-answer-glow`}></div>
            </button>
          );
          })}
        </div>
      )}
    </div>
  );
};

export default QuestionDisplay;
