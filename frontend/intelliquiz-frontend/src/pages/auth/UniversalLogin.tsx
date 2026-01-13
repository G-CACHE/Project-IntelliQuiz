import React, { useState } from 'react';

const UniversalLogin: React.FC = () => {
  const [role, setRole] = useState<'admin' | 'host' | 'player'>('player');

  const handleLogin = (selectedRole: 'admin' | 'host' | 'player') => {
    setRole(selectedRole);
    // Navigate to respective route
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-black text-accent mb-8">IntelliQuiz</h1>
        <div className="flex gap-4">
          <button
            onClick={() => handleLogin('admin')}
            className="px-6 py-3 bg-accent text-black font-bold rounded-lg"
          >
            Admin Login
          </button>
          <button
            onClick={() => handleLogin('host')}
            className="px-6 py-3 bg-primary text-white font-bold rounded-lg"
          >
            Host Login
          </button>
          <button
            onClick={() => handleLogin('player')}
            className="px-6 py-3 bg-gray-600 text-white font-bold rounded-lg"
          >
            Player Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default UniversalLogin;
