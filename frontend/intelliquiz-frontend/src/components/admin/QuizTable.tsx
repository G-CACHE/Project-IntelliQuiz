import React from 'react';

interface Quiz {
  id: string;
  title: string;
  questions: number;
  createdAt: string;
}

interface QuizTableProps {
  quizzes: Quiz[];
}

export const QuizTable: React.FC<QuizTableProps> = ({ quizzes }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-white">
        <thead>
          <tr className="border-b border-accent/30">
            <th className="px-4 py-2 text-left">Title</th>
            <th className="px-4 py-2 text-left">Questions</th>
            <th className="px-4 py-2 text-left">Created</th>
            <th className="px-4 py-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {quizzes.map((quiz) => (
            <tr key={quiz.id} className="border-b border-gray-700 hover:bg-gray-900/50">
              <td className="px-4 py-2">{quiz.title}</td>
              <td className="px-4 py-2">{quiz.questions}</td>
              <td className="px-4 py-2">{quiz.createdAt}</td>
              <td className="px-4 py-2 text-center">
                <button className="text-accent hover:underline">Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
