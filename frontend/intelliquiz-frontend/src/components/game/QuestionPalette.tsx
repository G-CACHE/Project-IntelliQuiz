import React from 'react';

interface QuestionPaletteProps {
  totalQuestions: number;
  currentQuestion: number; // 1-based
  answeredQuestions: Set<number>; // 1-based question numbers
  onNavigate: (questionIndex: number) => void; // 0-based index
  disabled?: boolean;
}

/**
 * QuestionPalette - Grid navigator for NON_LINEAR assessment mode.
 * Shows answered/unanswered/current question status with clickable tiles.
 */
const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  totalQuestions,
  currentQuestion,
  answeredQuestions,
  onNavigate,
  disabled = false,
}) => {
  const getButtonStyle = (qNum: number): React.CSSProperties => {
    const isCurrent = qNum === currentQuestion;
    const isAnswered = answeredQuestions.has(qNum);

    let background = '#f3f4f6'; // default: unanswered
    let color = '#374151';
    let border = '2px solid #e5e7eb';
    let fontWeight = 500;

    if (isCurrent) {
      background = 'linear-gradient(135deg, #880015 0%, #a50019 100%)';
      color = '#fff';
      border = '2px solid #880015';
      fontWeight = 700;
    } else if (isAnswered) {
      background = '#d1fae5';
      color = '#065f46';
      border = '2px solid #6ee7b7';
      fontWeight = 600;
    }

    return {
      width: '44px',
      height: '44px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight,
      background,
      color,
      border,
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s',
      fontFamily: 'Montserrat, sans-serif',
      opacity: disabled ? 0.6 : 1,
    };
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: 700,
          color: '#1f2937',
          margin: 0,
          fontFamily: 'Montserrat, sans-serif',
        }}>
          Question Navigator
        </h3>
        <span style={{
          fontSize: '12px',
          color: '#6b7280',
          fontWeight: 500,
        }}>
          {answeredQuestions.size}/{totalQuestions} answered
        </span>
      </div>

      {/* Question Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))',
        gap: '8px',
        marginBottom: '16px',
      }}>
        {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((qNum) => (
          <button
            key={qNum}
            onClick={() => !disabled && onNavigate(qNum - 1)}
            disabled={disabled}
            style={getButtonStyle(qNum)}
            title={`Question ${qNum}${answeredQuestions.has(qNum) ? ' (Answered)' : ' (Unanswered)'}`}
          >
            {qNum}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        gap: '16px',
        fontSize: '11px',
        color: '#9ca3af',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{
            width: '12px',
            height: '12px',
            borderRadius: '4px',
            background: 'linear-gradient(135deg, #880015 0%, #a50019 100%)',
            display: 'inline-block',
          }}></span>
          Current
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{
            width: '12px',
            height: '12px',
            borderRadius: '4px',
            background: '#d1fae5',
            border: '1px solid #6ee7b7',
            display: 'inline-block',
          }}></span>
          Answered
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{
            width: '12px',
            height: '12px',
            borderRadius: '4px',
            background: '#f3f4f6',
            border: '1px solid #e5e7eb',
            display: 'inline-block',
          }}></span>
          Unanswered
        </div>
      </div>
    </div>
  );
};

export default QuestionPalette;
