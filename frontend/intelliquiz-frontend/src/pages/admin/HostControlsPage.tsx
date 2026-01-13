import { useState, useEffect } from 'react';
import { Play, Pause, Eye, Trophy, Users, Clock } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Loader } from '../../components/common/Loader';
import { ErrorBanner } from '../../components/common/ErrorBanner';

interface Quiz {
  id: number;
  title: string;
  status: 'DRAFT' | 'READY' | 'ACTIVE' | 'ARCHIVED';
}

interface ScoreboardEntry {
  rank: number;
  teamName: string;
  score: number;
  teamId: number;
}



interface HostGameState {
  quizId: number;
  isActive: boolean;
  currentQuestion?: number;
  procatorPIN: string;
  timeStarted?: string;
}

export default function HostControlsPage({ quizId }: { quizId: number }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [scoreboard, setScoreboard] = useState<ScoreboardEntry[]>([]);
  const [gameState, setGameState] = useState<HostGameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showScoreboard, setShowScoreboard] = useState(true);
  const [showPINModal, setShowPINModal] = useState(false);
  const [copiedPIN, setCopiedPIN] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000); // Refresh every 3 seconds
    return () => clearInterval(interval);
  }, [quizId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
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
        throw new Error('Failed to load data');
      }

      const quizData = await quizRes.json();
      const scoreboardData = await scoreboardRes.json();
      
      setQuiz(quizData);
      setScoreboard(scoreboardData.entries || []);
      
      // Generate proctor PIN if not exists
      if (!gameState?.procatorPIN) {
        const pin = Math.random().toString().substring(2, 8);
        setGameState({
          quizId,
          isActive: quizData.status === 'ACTIVE',
          procatorPIN: pin,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateQuiz = async () => {
    try {
      const response = await fetch(`/api/quizzes/${quizId}/activate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to activate quiz');
      
      setSuccess('Quiz activated successfully');
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate quiz');
    }
  };

  const handleDeactivateQuiz = async () => {
    try {
      const response = await fetch(`/api/quizzes/${quizId}/deactivate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to deactivate quiz');
      
      setSuccess('Quiz deactivated successfully');
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate quiz');
    }
  };

  const copyPINToClipboard = () => {
    if (gameState?.procatorPIN) {
      navigator.clipboard.writeText(gameState.procatorPIN);
      setCopiedPIN(true);
      setTimeout(() => setCopiedPIN(false), 2000);
    }
  };

  if (loading && !quiz) return <Loader />;

  return (
    <div className="space-y-6 p-6 bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{quiz?.title}</h1>
          <p className="text-gray-400 mt-1">Live Game Host Controls</p>
        </div>
        <div className="flex gap-3">
          {quiz?.status === 'READY' && (
            <Button 
              onClick={handleActivateQuiz}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Play className="w-5 h-5" />
              Start Game
            </Button>
          )}
          {quiz?.status === 'ACTIVE' && (
            <Button 
              onClick={handleDeactivateQuiz}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
            >
              <Pause className="w-5 h-5" />
              Stop Game
            </Button>
          )}
        </div>
      </div>

      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
          {success}
        </div>
      )}

      {/* Status Bar */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">Quiz Status</p>
          <p className={`text-2xl font-bold ${
            quiz?.status === 'ACTIVE' ? 'text-green-400' : 'text-yellow-400'
          }`}>
            {quiz?.status}
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <Users className="w-4 h-4" />
            Teams
          </div>
          <p className="text-2xl font-bold text-white">{scoreboard.length}</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <Trophy className="w-4 h-4" />
            Leader
          </div>
          <p className="text-lg font-bold text-white">{scoreboard[0]?.teamName || '-'}</p>
          <p className="text-sm text-gray-400">{scoreboard[0]?.score || 0} pts</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <button
            onClick={() => setShowPINModal(true)}
            className="w-full text-left"
          >
            <p className="text-gray-400 text-sm mb-1">Proctor PIN</p>
            <p className="text-2xl font-mono font-bold text-blue-400 hover:text-blue-300">
              {gameState?.procatorPIN || '------'}
            </p>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Scoreboard */}
        <div className="col-span-2 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="bg-gray-900 px-6 py-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Live Scoreboard
            </h2>
            <button
              onClick={() => setShowScoreboard(!showScoreboard)}
              className="text-gray-400 hover:text-white"
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>

          {showScoreboard ? (
            <div className="overflow-y-auto max-h-96">
              <table className="w-full">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-400">Rank</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-400">Team Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-400">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {scoreboard.map((entry, idx) => (
                    <tr key={entry.teamId} className="hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {idx === 0 && <Trophy className="w-5 h-5 text-yellow-400" />}
                          {idx === 1 && <Trophy className="w-5 h-5 text-gray-400" />}
                          {idx === 2 && <Trophy className="w-5 h-5 text-orange-600" />}
                          <span className="font-bold text-white">{entry.rank}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white font-medium">{entry.teamName}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-900 text-blue-200">
                          {entry.score}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {scoreboard.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  No teams registered yet
                </div>
              )}
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center text-gray-400">
              Scoreboard hidden
            </div>
          )}
        </div>

        {/* Control Panel */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button
                disabled={quiz?.status !== 'ACTIVE'}
                className="w-full flex items-center justify-center gap-2"
              >
                <Clock className="w-5 h-5" />
                Next Question
              </Button>
              <Button
                variant="secondary"
                className="w-full"
              >
                Show Answers
              </Button>
              <Button
                variant="secondary"
                className="w-full"
              >
                Pause Timer
              </Button>
            </div>
          </div>

          {/* Session Info */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Session Info</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-400">Status</p>
                <p className={`font-bold ${
                  quiz?.status === 'ACTIVE' ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {quiz?.status}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Teams Registered</p>
                <p className="font-bold text-white">{scoreboard.length}</p>
              </div>
              <div>
                <p className="text-gray-400">Highest Score</p>
                <p className="font-bold text-white">{scoreboard[0]?.score || 0}</p>
              </div>
            </div>
          </div>

          {/* Host Tips */}
          <div className="bg-blue-900 bg-opacity-30 rounded-lg border border-blue-700 p-6">
            <h3 className="text-lg font-bold text-blue-200 mb-2">Host Tips</h3>
            <ul className="text-sm text-blue-100 space-y-2">
              <li>• Share Proctor PIN with co-hosts</li>
              <li>• Monitor submissions in real-time</li>
              <li>• Use quick actions to control game</li>
              <li>• Keep scoreboard visible to players</li>
            </ul>
          </div>
        </div>
      </div>

      {/* PIN Modal */}
      <Modal 
        isOpen={showPINModal}
        onClose={() => setShowPINModal(false)}
        title="Proctor PIN"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Share this PIN with other hosts/proctors to give them control access.
          </p>
          
          <div className="bg-gray-100 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-600 mb-2">PIN</p>
            <p className="text-4xl font-mono font-bold text-gray-900 tracking-widest">
              {gameState?.procatorPIN}
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={copyPINToClipboard}
              className="flex-1"
            >
              {copiedPIN ? 'Copied!' : 'Copy PIN'}
            </Button>
            <Button 
              onClick={() => setShowPINModal(false)}
              variant="secondary"
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
