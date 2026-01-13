import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Award, Users } from 'lucide-react';
import { Loader } from '../../components/common/Loader';
import { ErrorBanner } from '../../components/common/ErrorBanner';

interface ScoreboardEntry {
  rank: number;
  teamName: string;
  score: number;
  teamId: number;
}

interface Quiz {
  id: number;
  title: string;
  status: 'DRAFT' | 'READY' | 'ACTIVE' | 'ARCHIVED';
}

export default function ScoreboardPage({ quizId }: { quizId: number }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [scoreboard, setScoreboard] = useState<ScoreboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadScoreboard();
    
    if (autoRefresh) {
      const interval = setInterval(loadScoreboard, 2000);
      return () => clearInterval(interval);
    }
  }, [quizId, autoRefresh]);

  const loadScoreboard = async () => {
    setLoading(true);
    try {
      const [quizRes, scoreboardRes] = await Promise.all([
        fetch(`/api/quizzes/${quizId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch(`/api/quizzes/${quizId}/scoreboard`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      if (!quizRes.ok || !scoreboardRes.ok) {
        throw new Error('Failed to load scoreboard');
      }

      const quizData = await quizRes.json();
      const scoreboardData = await scoreboardRes.json();
      
      setQuiz(quizData);
      setScoreboard(scoreboardData.entries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scoreboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !quiz) return <Loader />;

  const topThree = scoreboard.slice(0, 3);
  const rest = scoreboard.slice(3);
  const maxScore = scoreboard[0]?.score || 0;

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            <Trophy className="w-10 h-10 text-yellow-400" />
            {quiz?.title} - Scoreboard
          </h1>
          <p className="text-gray-300 mt-2">Live Rankings</p>
        </div>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            autoRefresh
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
        </button>
      </div>

      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {scoreboard.length === 0 ? (
        <div className="bg-white bg-opacity-10 rounded-lg p-12 text-center backdrop-blur">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-xl text-gray-200">No teams registered yet</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {/* 2nd Place */}
              {topThree.length >= 2 && (
                <div className="relative">
                  <div className="bg-gradient-to-b from-gray-400 to-gray-500 rounded-lg p-6 text-center text-white h-full flex flex-col justify-between">
                    <div>
                      <div className="text-6xl font-bold mb-2">2️⃣</div>
                      <p className="text-2xl font-bold mb-2">{topThree[1].teamName}</p>
                    </div>
                    <div>
                      <p className="text-4xl font-bold">{topThree[1].score}</p>
                      <p className="text-sm opacity-90">points</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {topThree.length >= 1 && (
                <div className="relative transform scale-105">
                  <div className="bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-lg p-6 text-center text-gray-900 h-full flex flex-col justify-between shadow-2xl">
                    <div>
                      <div className="text-6xl font-bold mb-2">🥇</div>
                      <p className="text-2xl font-bold mb-2">{topThree[0].teamName}</p>
                    </div>
                    <div>
                      <p className="text-5xl font-bold">{topThree[0].score}</p>
                      <p className="text-sm font-semibold">points</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {topThree.length >= 3 && (
                <div className="relative">
                  <div className="bg-gradient-to-b from-orange-400 to-orange-500 rounded-lg p-6 text-center text-white h-full flex flex-col justify-between">
                    <div>
                      <div className="text-6xl font-bold mb-2">3️⃣</div>
                      <p className="text-2xl font-bold mb-2">{topThree[2].teamName}</p>
                    </div>
                    <div>
                      <p className="text-4xl font-bold">{topThree[2].score}</p>
                      <p className="text-sm opacity-90">points</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white bg-opacity-10 backdrop-blur rounded-lg p-6 border border-white border-opacity-20">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <p className="text-gray-300 text-sm">Total Teams</p>
              </div>
              <p className="text-3xl font-bold text-white">{scoreboard.length}</p>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur rounded-lg p-6 border border-white border-opacity-20">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <p className="text-gray-300 text-sm">Leading Score</p>
              </div>
              <p className="text-3xl font-bold text-white">{maxScore}</p>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur rounded-lg p-6 border border-white border-opacity-20">
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-5 h-5 text-purple-400" />
                <p className="text-gray-300 text-sm">Average Score</p>
              </div>
              <p className="text-3xl font-bold text-white">
                {Math.round(scoreboard.reduce((sum, e) => sum + e.score, 0) / scoreboard.length)}
              </p>
            </div>
          </div>

          {/* Full Rankings */}
          {rest.length > 0 && (
            <div className="bg-white bg-opacity-10 backdrop-blur rounded-lg border border-white border-opacity-20 overflow-hidden">
              <div className="bg-white bg-opacity-5 px-6 py-4 border-b border-white border-opacity-20">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  All Standings
                </h2>
              </div>

              <div className="divide-y divide-white divide-opacity-10">
                {rest.map((entry) => (
                  <div 
                    key={entry.teamId}
                    className="px-6 py-4 hover:bg-white hover:bg-opacity-5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-2xl font-bold text-white w-10">{entry.rank}</span>
                        <div className="flex-1">
                          <p className="text-lg font-semibold text-white">{entry.teamName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">{entry.score}</p>
                        <p className="text-sm text-gray-300">points</p>
                      </div>
                      
                      {/* Score Progress Bar */}
                      <div className="w-32 ml-4">
                        <div className="bg-white bg-opacity-10 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-400 to-purple-400 h-full transition-all duration-300"
                            style={{ width: `${maxScore > 0 ? (entry.score / maxScore) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Auto-refresh indicator */}
          {autoRefresh && (
            <div className="text-center text-gray-300 text-sm">
              <span className="inline-block">
                Updates every 2 seconds
                <span className="inline-block ml-2">
                  <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                </span>
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
