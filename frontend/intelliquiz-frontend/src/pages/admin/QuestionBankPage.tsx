import React, { useState, useEffect, useCallback } from 'react';
import { questionBankApi, quizzesApi } from '../../services/api';
import type { QuestionBankItem, Quiz } from '../../services/api';
import '../../styles/admin.css';

const QuestionBankPage: React.FC = () => {
  const [bankItems, setBankItems] = useState<QuestionBankItem[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Harvest modal state
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  const [selectedQuizForHarvest, setSelectedQuizForHarvest] = useState<number | null>(null);
  const [harvesting, setHarvesting] = useState(false);

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedQuizForImport, setSelectedQuizForImport] = useState<number | null>(null);
  const [selectedBankItems, setSelectedBankItems] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);

  // Fetch bank items and quizzes
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [items, quizList] = await Promise.all([
        questionBankApi.getAll(),
        quizzesApi.getAll(),
      ]);
      setBankItems(items);
      setQuizzes(quizList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Harvest questions from quiz
  const handleHarvest = async () => {
    if (!selectedQuizForHarvest) return;
    try {
      setHarvesting(true);
      const harvested = await questionBankApi.harvestFromQuiz(selectedQuizForHarvest);
      setBankItems(prev => [...prev, ...harvested]);
      setSuccessMessage(`Harvested ${harvested.length} question(s) to the bank.`);
      setShowHarvestModal(false);
      setSelectedQuizForHarvest(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to harvest questions');
    } finally {
      setHarvesting(false);
    }
  };

  // Import selected items to quiz
  const handleImport = async () => {
    if (!selectedQuizForImport || selectedBankItems.size === 0) return;
    try {
      setImporting(true);
      const ids = Array.from(selectedBankItems);
      await questionBankApi.importToQuiz(selectedQuizForImport, ids);
      setSuccessMessage(`Imported ${ids.length} question(s) to quiz.`);
      setShowImportModal(false);
      setSelectedBankItems(new Set());
      setSelectedQuizForImport(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import questions');
    } finally {
      setImporting(false);
    }
  };

  // Delete bank item
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this question from the bank?')) return;
    try {
      await questionBankApi.delete(id);
      setBankItems(prev => prev.filter(item => item.id !== id));
      setSuccessMessage('Question removed from bank.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question');
    }
  };

  // Toggle bank item selection for import
  const toggleBankItem = (id: number) => {
    setSelectedBankItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Difficulty badge color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return { bg: '#d1fae5', text: '#065f46' };
      case 'MEDIUM': return { bg: '#fef3c7', text: '#92400e' };
      case 'HARD': return { bg: '#fee2e2', text: '#991b1b' };
      default: return { bg: '#e5e7eb', text: '#374151' };
    }
  };

  return (
    <div style={{ padding: '0' }}>
      {/* Page Header */}
      <div style={{
        background: 'linear-gradient(135deg, #880015 0%, #a50019 50%, #6b0012 100%)',
        borderRadius: '20px',
        padding: '24px 32px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#fff',
        boxShadow: '0 10px 40px rgba(136, 0, 21, 0.3)',
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, fontFamily: 'Montserrat, sans-serif' }}>
            📚 Question Bank
          </h1>
          <p style={{ fontSize: '14px', opacity: 0.8, margin: '4px 0 0' }}>
            Manage your harvested and reusable questions
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowHarvestModal(true)}
            style={{
              background: '#f8c107',
              color: '#1f2937',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: 'Montserrat, sans-serif',
            }}
          >
            🌾 Harvest from Quiz
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            disabled={bankItems.length === 0}
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '10px',
              padding: '10px 20px',
              cursor: bankItems.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 700,
              opacity: bankItems.length === 0 ? 0.5 : 1,
              fontFamily: 'Montserrat, sans-serif',
            }}
          >
            📥 Import to Quiz
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div style={{
          background: '#d1fae5',
          border: '1px solid #6ee7b7',
          borderRadius: '12px',
          padding: '12px 20px',
          marginBottom: '16px',
          color: '#065f46',
          fontSize: '14px',
          fontWeight: 600,
        }}>
          ✓ {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          padding: '12px 20px',
          marginBottom: '16px',
          color: '#991b1b',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
          <p style={{ fontSize: '16px' }}>Loading question bank...</p>
        </div>
      ) : bankItems.length === 0 ? (
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '48px',
          textAlign: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <p style={{ fontSize: '48px', marginBottom: '16px' }}>📭</p>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>
            No Questions in Bank
          </h3>
          <p style={{ fontSize: '14px', color: '#6b7280', maxWidth: '400px', margin: '0 auto' }}>
            Harvest questions from completed quizzes to build your reusable question bank.
          </p>
        </div>
      ) : (
        /* Question Bank Table */
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Question</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Difficulty</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Points</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bankItems.map((item) => {
                const diffColor = getDifficultyColor(item.difficulty);
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '14px 20px', fontSize: '14px', color: '#1f2937', maxWidth: '400px' }}>
                      <p style={{ margin: 0, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.text}
                      </p>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#4b5563',
                        background: '#f3f4f6',
                        padding: '3px 8px',
                        borderRadius: '6px',
                      }}>
                        {item.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: diffColor.text,
                        background: diffColor.bg,
                        padding: '3px 10px',
                        borderRadius: '6px',
                      }}>
                        {item.difficulty}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>
                      {item.points}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', color: '#6b7280' }}>
                      {item.category || '—'}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDelete(item.id)}
                        style={{
                          background: 'none',
                          border: '1px solid #fecaca',
                          color: '#ef4444',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Harvest Modal */}
      {showHarvestModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '32px',
            maxWidth: '480px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1f2937', marginBottom: '8px', fontFamily: 'Montserrat, sans-serif' }}>
              🌾 Harvest Questions
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
              Select a quiz to harvest its questions into the bank.
            </p>
            <select
              value={selectedQuizForHarvest || ''}
              onChange={(e) => setSelectedQuizForHarvest(parseInt(e.target.value) || null)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '8px',
                border: '1px solid #d1d5db', fontSize: '14px', marginBottom: '20px',
              }}
            >
              <option value="">Select a quiz...</option>
              {quizzes.map((q) => (
                <option key={q.id} value={q.id}>{q.title}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowHarvestModal(false); setSelectedQuizForHarvest(null); }}
                style={{
                  background: '#f3f4f6', color: '#374151', border: 'none',
                  borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleHarvest}
                disabled={!selectedQuizForHarvest || harvesting}
                style={{
                  background: selectedQuizForHarvest ? '#880015' : '#d1d5db',
                  color: '#fff', border: 'none', borderRadius: '8px',
                  padding: '10px 20px', cursor: selectedQuizForHarvest ? 'pointer' : 'not-allowed',
                  fontSize: '14px', fontWeight: 700,
                }}
              >
                {harvesting ? 'Harvesting...' : 'Harvest'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '32px',
            maxWidth: '600px', width: '100%', maxHeight: '80vh', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1f2937', marginBottom: '8px', fontFamily: 'Montserrat, sans-serif' }}>
              📥 Import Questions to Quiz
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
              Select a target quiz and choose questions to import.
            </p>

            <select
              value={selectedQuizForImport || ''}
              onChange={(e) => setSelectedQuizForImport(parseInt(e.target.value) || null)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '8px',
                border: '1px solid #d1d5db', fontSize: '14px', marginBottom: '16px',
              }}
            >
              <option value="">Select target quiz...</option>
              {quizzes.map((q) => (
                <option key={q.id} value={q.id}>{q.title}</option>
              ))}
            </select>

            {/* Bank items to select */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px' }}>
              {bankItems.map((item) => (
                <label
                  key={item.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                    background: selectedBankItems.has(item.id) ? '#f0fdf4' : '#fff',
                    border: `1px solid ${selectedBankItems.has(item.id) ? '#86efac' : '#e5e7eb'}`,
                    marginBottom: '6px',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedBankItems.has(item.id)}
                    onChange={() => toggleBankItem(item.id)}
                    style={{ width: '18px', height: '18px', accentColor: '#880015' }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#1f2937' }}>
                      {item.text}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                      {item.type.replace('_', ' ')} · {item.difficulty} · {item.points} pts
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                {selectedBankItems.size} selected
              </span>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => { setShowImportModal(false); setSelectedBankItems(new Set()); setSelectedQuizForImport(null); }}
                  style={{
                    background: '#f3f4f6', color: '#374151', border: 'none',
                    borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={!selectedQuizForImport || selectedBankItems.size === 0 || importing}
                  style={{
                    background: (selectedQuizForImport && selectedBankItems.size > 0) ? '#880015' : '#d1d5db',
                    color: '#fff', border: 'none', borderRadius: '8px',
                    padding: '10px 20px', fontSize: '14px', fontWeight: 700,
                    cursor: (selectedQuizForImport && selectedBankItems.size > 0) ? 'pointer' : 'not-allowed',
                  }}
                >
                  {importing ? 'Importing...' : `Import ${selectedBankItems.size} Question(s)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBankPage;
