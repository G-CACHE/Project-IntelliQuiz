import React from 'react';
import type { ConnectedTeam } from '../../hooks/useWebSocket';

interface TeamGridProps {
  teams: ConnectedTeam[];
  highlightTeamId?: number;
  variant?: 'proctor' | 'participant';
}

const TeamGrid: React.FC<TeamGridProps> = ({ teams, highlightTeamId, variant = 'proctor' }) => {
  const prefix = variant === 'participant' ? 'participant' : 'proctor';

  if (teams.length === 0) {
    return (
      <div className={`${prefix}-empty-teams`}>
        <div className={`${prefix}-loading-spinner`}></div>
        <p className={`${prefix}-empty-teams-title`}>Waiting for teams to join...</p>
        <p className={`${prefix}-empty-teams-subtitle`}>
          Share the team codes with participants
        </p>
      </div>
    );
  }

  return (
    <div className={`${prefix}-team-grid`}>
      {teams.map((team, index) => (
        <div
          key={team.id}
          className={`${prefix}-team-card ${highlightTeamId === team.id ? `${prefix}-team-card-highlight` : ''}`}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className={`${prefix}-team-status`}>
            <span className={`${prefix}-status-dot ${prefix}-status-connected`}></span>
            <span className={`${prefix}-team-status-text`}>Connected</span>
          </div>
          <p className={`${prefix}-team-name`} title={team.name}>
            {team.name}
          </p>
        </div>
      ))}
    </div>
  );
};

export default TeamGrid;
