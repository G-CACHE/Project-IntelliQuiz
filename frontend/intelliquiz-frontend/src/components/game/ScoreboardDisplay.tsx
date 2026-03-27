import React from 'react';
import type { RankingEntry } from '../../services/api';

interface ScoreboardDisplayProps {
  rankings: RankingEntry[];
  highlightTeamId?: number;
  isFinal?: boolean;
  variant?: 'proctor' | 'participant';
  title?: string;
}

const ScoreboardDisplay: React.FC<ScoreboardDisplayProps> = ({
  rankings,
  highlightTeamId,
  isFinal = false,
  variant = 'proctor',
  title,
}) => {
  const prefix = variant === 'participant' ? 'participant' : 'proctor';

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getInitials = (teamName: string) => {
    const words = teamName.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '?';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  // Calculate ranks with ties
  const rankedTeams = rankings.map((team, index) => {
    // Find the actual rank (accounting for ties)
    let actualRank = 1;
    for (let i = 0; i < index; i++) {
      if (rankings[i].score > team.score) {
        actualRank = i + 2;
      } else if (rankings[i].score === team.score) {
        actualRank = rankings[i].rank || i + 1;
      }
    }
    return { ...team, displayRank: team.rank || actualRank };
  });

  if (rankings.length === 0) {
    return (
      <div className={`${prefix}-scoreboard-empty`}>
        <p>No scores yet</p>
      </div>
    );
  }

  return (
    <div className={`${prefix}-scoreboard`}>
      {/* Header */}
      <div className={`${prefix}-scoreboard-header`}>
        <h2 className={`${prefix}-scoreboard-title`}>
          {title ?? (isFinal ? '🏆 Final Results' : 'Scoreboard')}
        </h2>
        {isFinal && (
          <p className={`${prefix}-scoreboard-subtitle`}>Congratulations to all participants!</p>
        )}
      </div>

      {/* Podium for Final Results */}
      {isFinal && rankings.length >= 3 && (
        <div className={`${prefix}-podium`}>
          {/* 2nd Place */}
          <div className={`${prefix}-podium-item ${prefix}-podium-second`}>
            <div className={`${prefix}-podium-icon`}>🥈</div>
            <div className={`${prefix}-podium-info`}>
              <p className={`${prefix}-podium-name`}>{rankedTeams[1]?.teamName}</p>
              <p className={`${prefix}-podium-score`}>{rankedTeams[1]?.score} pts</p>
            </div>
          </div>

          {/* 1st Place */}
          <div className={`${prefix}-podium-item ${prefix}-podium-first`}>
            <div className={`${prefix}-podium-icon`}>🥇</div>
            <div className={`${prefix}-podium-info`}>
              <p className={`${prefix}-podium-name`}>{rankedTeams[0]?.teamName}</p>
              <p className={`${prefix}-podium-score`}>{rankedTeams[0]?.score} pts</p>
            </div>
          </div>

          {/* 3rd Place */}
          <div className={`${prefix}-podium-item ${prefix}-podium-third`}>
            <div className={`${prefix}-podium-icon`}>🥉</div>
            <div className={`${prefix}-podium-info`}>
              <p className={`${prefix}-podium-name`}>{rankedTeams[2]?.teamName}</p>
              <p className={`${prefix}-podium-score`}>{rankedTeams[2]?.score} pts</p>
            </div>
          </div>
        </div>
      )}

      {/* Rankings List */}
      <div className={`${prefix}-rankings-list`}>
        {rankedTeams.map((entry, index) => {
          const isHighlighted = entry.teamId === highlightTeamId;
          const isTopThree = entry.displayRank <= 3;

          return (
            <div
              key={entry.teamId}
              className={`${prefix}-ranking-item ${
                entry.displayRank === 1 ? `${prefix}-ranking-gold` :
                entry.displayRank === 2 ? `${prefix}-ranking-silver` :
                entry.displayRank === 3 ? `${prefix}-ranking-bronze` :
                `${prefix}-ranking-default`
              } ${isHighlighted ? `${prefix}-ranking-highlight` : ''}`}
              style={{ ['--row-index' as string]: index } as React.CSSProperties}
            >
              {/* Rank */}
              <div className={`${prefix}-ranking-rank ${isTopThree ? `${prefix}-ranking-rank-top` : ''}`}>
                <span>{getRankIcon(entry.displayRank)}</span>
              </div>

              {/* Team Avatar */}
              <div className={`${prefix}-ranking-avatar ${prefix}-ranking-avatar-${index % 5}`}>
                {getInitials(entry.teamName)}
              </div>

              {/* Team Name */}
              <div className={`${prefix}-ranking-team`}>
                <p className={`${prefix}-ranking-name`}>
                  {entry.teamName}
                </p>
                {isHighlighted && (
                  <p className={`${prefix}-ranking-label`}>Your Team</p>
                )}
              </div>

              {/* Score */}
              <div className={`${prefix}-ranking-score-container`}>
                <p className={`${prefix}-ranking-score ${isTopThree ? `${prefix}-ranking-score-top` : ''}`}>
                  {entry.score}
                </p>
                <p className={`${prefix}-ranking-points-label`}>points</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScoreboardDisplay;
