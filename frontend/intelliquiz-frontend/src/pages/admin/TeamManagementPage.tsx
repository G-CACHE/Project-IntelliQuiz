import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, RotateCcw, Copy } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Loader } from '../../components/common/Loader';
import { ErrorBanner } from '../../components/common/ErrorBanner';

interface Team {
  id: number;
  name: string;
  accessCode: string;
  score: number;
  memberCount: number;
  quizId: number;
}

export default function TeamManagementPage({ quizId }: { quizId: number }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamName, setTeamName] = useState('');
  const [copiedCodeId, setCopiedCodeId] = useState<number | null>(null);

  useEffect(() => {
    loadTeams();
  }, [quizId]);

  const loadTeams = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/quizzes/${quizId}/teams`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to load teams');
      const data = await response.json();
      setTeams(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      setError('Team name is required');
      return;
    }

    try {
      const response = await fetch(`/api/quizzes/${quizId}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ name: teamName }),
      });

      if (!response.ok) throw new Error('Failed to create team');
      
      setShowCreateModal(false);
      setTeamName('');
      setSuccess('Team created successfully');
      loadTeams();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team');
    }
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeam) return;

    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete team');
      
      setShowDeleteConfirm(false);
      setSelectedTeam(null);
      setSuccess('Team deleted successfully');
      loadTeams();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete team');
    }
  };

  const handleResetScores = async () => {
    try {
      const response = await fetch(`/api/quizzes/${quizId}/teams/reset-scores`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to reset scores');
      
      setShowResetConfirm(false);
      setSuccess('All team scores reset successfully');
      loadTeams();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset scores');
    }
  };

  const copyAccessCode = (code: string, teamId: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(teamId);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const openDeleteConfirm = (team: Team) => {
    setSelectedTeam(team);
    setShowDeleteConfirm(true);
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
        </div>
        <div className="flex gap-2">
          {teams.length > 0 && (
            <Button 
              onClick={() => setShowResetConfirm(true)}
              variant="secondary"
              className="flex items-center gap-2 text-amber-600 hover:bg-amber-50"
            >
              <RotateCcw className="w-5 h-5" />
              Reset Scores
            </Button>
          )}
          <Button 
            onClick={() => {
              setTeamName('');
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Register Team
          </Button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Team Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Access Code</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Members</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Score</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {teams.map(team => (
              <tr key={team.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{team.name}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 px-3 py-1 rounded text-gray-900 font-mono">
                      {team.accessCode}
                    </code>
                    <button
                      onClick={() => copyAccessCode(team.accessCode, team.id)}
                      className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                      title="Copy access code"
                    >
                      <Copy className={`w-4 h-4 transition-colors ${
                        copiedCodeId === team.id ? 'text-green-600' : ''
                      }`} />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {team.memberCount} members
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{team.score}</td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <button
                    onClick={() => openDeleteConfirm(team)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded inline-flex items-center gap-1"
                    title="Delete team"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {teams.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No teams registered yet. Register the first team to get started.
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      <Modal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Register Team"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Create a new team for this quiz. An access code will be automatically generated.
          </p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team Name *
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter team name"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateTeam()}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleCreateTeam}
              className="flex-1"
            >
              Register
            </Button>
            <Button 
              onClick={() => setShowCreateModal(false)}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Team"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <strong>{selectedTeam?.name}</strong>? 
            This will also remove all their submissions.
          </p>
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleDeleteTeam}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
            <Button 
              onClick={() => setShowDeleteConfirm(false)}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reset Scores Confirmation Modal */}
      <Modal 
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="Reset All Scores"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to reset all team scores to zero? 
            This action cannot be undone.
          </p>
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleResetScores}
              className="flex-1 bg-amber-600 hover:bg-amber-700"
            >
              Reset
            </Button>
            <Button 
              onClick={() => setShowResetConfirm(false)}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
