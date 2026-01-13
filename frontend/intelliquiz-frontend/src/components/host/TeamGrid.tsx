import React from 'react';

interface Team {
  id: string;
  name: string;
  score: number;
  memberCount: number;
}

interface TeamGridProps {
  teams: Team[];
}

export const TeamGrid: React.FC<TeamGridProps> = ({ teams }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {teams.map((team) => (
        <div
          key={team.id}
          className="bg-gray-900 border border-accent/30 rounded-lg p-6 hover:border-accent"
        >
          <h3 className="text-xl font-bold text-accent mb-2">{team.name}</h3>
          <p className="text-gray-300">Members: {team.memberCount}</p>
          <p className="text-2xl font-bold text-accent mt-2">Score: {team.score}</p>
        </div>
      ))}
    </div>
  );
};
