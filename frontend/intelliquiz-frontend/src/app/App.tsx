import React from 'react';
import { RoleGuard } from './RoleGuard';
import { SessionGuard } from './SessionGuard';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-black">
      {/* Root SPA wrapper */}
      <main>
        {/* Routes will be rendered here */}
      </main>
    </div>
  );
};

export default App;
