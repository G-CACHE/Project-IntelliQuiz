import React, { useState } from 'react';

interface QuestionEditorProps {
  onSave?: (question: any) => void;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({ onSave }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);

  const handleSave = () => {
    onSave?.({ question, options });
  };

  return (
    <div className="bg-gray-900 p-6 rounded-lg">
      <h2 className="text-2xl font-bold text-[#f8c107] mb-4">Question Editor</h2>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Enter question"
        className="w-full bg-gray-800 text-white p-3 rounded-lg mb-4"
      />
      <div className="space-y-2 mb-4">
        {options.map((option, i) => (
          <input
            key={i}
            value={option}
            onChange={(e) => {
              const newOptions = [...options];
              newOptions[i] = e.target.value;
              setOptions(newOptions);
            }}
            placeholder={`Option ${i + 1}`}
            className="w-full bg-gray-800 text-white p-2 rounded-lg"
          />
        ))}
      </div>
      <button onClick={handleSave} className="bg-[#f8c107] text-black px-6 py-2 rounded-lg font-bold">
        Save Question
      </button>
    </div>
  );
};
