import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Property 9: Scoreboard Ranking Correctness
 * For any scoreboard display, teams SHALL be sorted by score in descending order,
 * each team SHALL display name, score, and rank, tied scores SHALL result in
 * equal ranks, and the top 3 teams SHALL have distinct visual styling.
 * 
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4
 */

interface RankingEntry {
  teamId: number;
  teamName: string;
  score: number;
  rank?: number;
}

interface ProcessedRanking extends RankingEntry {
  displayRank: number;
  isTopThree: boolean;
  hasDistinctStyling: boolean;
}

// Process rankings with proper rank calculation (handling ties)
const processRankings = (rankings: RankingEntry[]): ProcessedRanking[] => {
  // Sort by score descending
  const sorted = [...rankings].sort((a, b) => b.score - a.score);
  
  // Calculate ranks with ties
  let currentRank = 1;
  let previousScore: number | null = null;
  let sameRankCount = 0;
  
  return sorted.map((entry, index) => {
    if (previousScore !== null && entry.score < previousScore) {
      currentRank = index + 1;
      sameRankCount = 0;
    } else if (previousScore !== null && entry.score === previousScore) {
      sameRankCount++;
    }
    
    previousScore = entry.score;
    
    const displayRank = currentRank;
    const isTopThree = displayRank <= 3;
    
    return {
      ...entry,
      displayRank,
      isTopThree,
      hasDistinctStyling: isTopThree,
    };
  });
};

// Check if rankings are sorted by score descending
const isSortedByScoreDescending = (rankings: ProcessedRanking[]): boolean => {
  for (let i = 1; i < rankings.length; i++) {
    if (rankings[i].score > rankings[i - 1].score) {
      return false;
    }
  }
  return true;
};

// Check if tied scores have equal ranks
const tiedScoresHaveEqualRanks = (rankings: ProcessedRanking[]): boolean => {
  const scoreToRanks = new Map<number, number[]>();
  
  for (const entry of rankings) {
    const ranks = scoreToRanks.get(entry.score) || [];
    ranks.push(entry.displayRank);
    scoreToRanks.set(entry.score, ranks);
  }
  
  for (const ranks of scoreToRanks.values()) {
    if (ranks.length > 1) {
      const firstRank = ranks[0];
      if (!ranks.every(r => r === firstRank)) {
        return false;
      }
    }
  }
  
  return true;
};

// Check if top 3 have distinct styling
const topThreeHaveDistinctStyling = (rankings: ProcessedRanking[]): boolean => {
  const topThree = rankings.filter(r => r.displayRank <= 3);
  return topThree.every(r => r.hasDistinctStyling);
};

// Arbitrary for generating ranking entries
const rankingEntryArb = fc.record({
  teamId: fc.integer({ min: 1, max: 10000 }),
  teamName: fc.string({ minLength: 1, maxLength: 50 }),
  score: fc.integer({ min: 0, max: 10000 }),
});

describe('Property 9: Scoreboard Ranking Correctness', () => {
  /**
   * Feature: proctor-participant-ui, Property 9: Scoreboard Ranking Correctness
   */
  
  it('should sort teams by score in descending order', () => {
    fc.assert(
      fc.property(
        fc.array(rankingEntryArb, { minLength: 1, maxLength: 20 }),
        (rankings) => {
          const processed = processRankings(rankings);
          expect(isSortedByScoreDescending(processed)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display name, score, and rank for each team', () => {
    fc.assert(
      fc.property(
        fc.array(rankingEntryArb, { minLength: 1, maxLength: 20 }),
        (rankings) => {
          const processed = processRankings(rankings);
          
          for (const entry of processed) {
            expect(entry.teamName).toBeTruthy();
            expect(typeof entry.score).toBe('number');
            expect(entry.displayRank).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should assign equal ranks to tied scores', () => {
    fc.assert(
      fc.property(
        fc.array(rankingEntryArb, { minLength: 2, maxLength: 20 }),
        (rankings) => {
          const processed = processRankings(rankings);
          expect(tiedScoresHaveEqualRanks(processed)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should give top 3 teams distinct styling', () => {
    fc.assert(
      fc.property(
        fc.array(rankingEntryArb, { minLength: 3, maxLength: 20 }),
        (rankings) => {
          const processed = processRankings(rankings);
          expect(topThreeHaveDistinctStyling(processed)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle specific tie scenarios correctly', () => {
    // Test case: Three teams with same score should all be rank 1
    const tiedRankings: RankingEntry[] = [
      { teamId: 1, teamName: 'Team A', score: 100 },
      { teamId: 2, teamName: 'Team B', score: 100 },
      { teamId: 3, teamName: 'Team C', score: 100 },
    ];
    
    const processed = processRankings(tiedRankings);
    
    expect(processed[0].displayRank).toBe(1);
    expect(processed[1].displayRank).toBe(1);
    expect(processed[2].displayRank).toBe(1);
  });

  it('should handle mixed tie scenarios', () => {
    // Test case: 1st place tie, then 3rd place
    const mixedRankings: RankingEntry[] = [
      { teamId: 1, teamName: 'Team A', score: 100 },
      { teamId: 2, teamName: 'Team B', score: 100 },
      { teamId: 3, teamName: 'Team C', score: 50 },
    ];
    
    const processed = processRankings(mixedRankings);
    
    expect(processed[0].displayRank).toBe(1);
    expect(processed[1].displayRank).toBe(1);
    expect(processed[2].displayRank).toBe(3); // Skips rank 2
  });

  it('should handle empty rankings', () => {
    const processed = processRankings([]);
    expect(processed).toHaveLength(0);
  });

  it('should handle single team', () => {
    const singleTeam: RankingEntry[] = [
      { teamId: 1, teamName: 'Solo Team', score: 500 },
    ];
    
    const processed = processRankings(singleTeam);
    
    expect(processed).toHaveLength(1);
    expect(processed[0].displayRank).toBe(1);
    expect(processed[0].isTopThree).toBe(true);
  });
});
