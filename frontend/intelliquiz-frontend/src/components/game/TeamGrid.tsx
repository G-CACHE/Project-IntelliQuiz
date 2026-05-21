import React from 'react';
import type { ConnectedTeam } from '../../hooks/useSSE';
import { parseSmartName } from '../../utils/nameUtils';

const PAGE_SIZE = 20;

interface TeamGridProps {
  teams: ConnectedTeam[];
  highlightTeamId?: number;
  variant?: 'proctor' | 'participant';
  page?: number;
  onPageChange?: React.Dispatch<React.SetStateAction<number>>;
}

const TeamGrid: React.FC<TeamGridProps> = ({
  teams,
  highlightTeamId,
  variant = 'proctor',
  page = 0,
}) => {
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

  const safePage = Math.min(page, Math.ceil(teams.length / PAGE_SIZE) - 1);
  const pageTeams = teams.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  return (
    <div
      className={`${prefix}-team-grid ${teams.length > 16 ? 'scrollable' : ''}`}
      data-count={String(pageTeams.length)}
    >
      {pageTeams.map((team, index) => {
        const { name, avatarId } = parseSmartName(team.name);
        return (
          <div
            key={team.id}
            className={`${prefix}-team-card ${highlightTeamId === team.id ? `${prefix}-team-card-highlight` : ''}`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div
              className={`${prefix}-team-avatar ${prefix}-team-avatar-${index % 5} ${avatarId ? 'has-avatar' : ''}`}
              aria-hidden="true"
            >
              {avatarId ? (
                <img src={`/avatars/${avatarId}`} alt="" className={`${prefix}-team-avatar-img`} />
              ) : (
                (name?.trim()?.charAt(0) || '?').toUpperCase()
              )}
            </div>
            <div className={`${prefix}-team-status`}>
              <span className={`${prefix}-status-dot ${prefix}-status-connected`}></span>
              <span className={`${prefix}-team-status-text`}>Connected</span>
            </div>
            <p className={`${prefix}-team-name`} title={name}>
              {name}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default TeamGrid;
