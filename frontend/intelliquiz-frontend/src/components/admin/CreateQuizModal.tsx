import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BiX } from 'react-icons/bi';
import CustomSelect from '../common/CustomSelect';
import { useCreateQuiz } from '../../hooks';
import type { CreateQuizRequest } from '../../services/api';

interface Props {
  onClose: () => void;
}

const defaultForm: CreateQuizRequest = {
  title: '',
  description: '',
  accessMode: 'RESTRICTED',
  navigationMode: 'TOURNAMENT',
  globalTimeLimitSeconds: 0,
  randomizeQuestions: false,
};

export default function CreateQuizModal({ onClose }: Props) {
  const navigate = useNavigate();
  const createQuiz = useCreateQuiz();

  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<CreateQuizRequest>(defaultForm);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    try {
      setCreating(true);
      const created = await createQuiz.mutateAsync(form);
      onClose();
      if (created && typeof created.id === 'number') {
        navigate(`/admin/quizzes/${created.id}`, { state: { tab: 'overview' } });
      }
    } catch (err) {
      console.error('Failed to create quiz:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header quiz-list-modal-create-header">
          <h2 className="admin-modal-title">{step === 1 ? 'Create New Quiz' : 'Configure Quiz'}</h2>
          <button onClick={onClose} className="admin-btn-icon quiz-list-modal-close"><BiX size={18} /></button>
        </div>

        <div className="admin-modal-body">
          {/* Step indicators */}
          <div className="quiz-create-steps">
            <div className={`quiz-create-step ${step >= 1 ? 'active' : ''}`}>
              <span className="quiz-create-step-num">1</span>
              <span className="quiz-create-step-label">Basics</span>
            </div>
            <div className="quiz-create-step-divider" />
            <div className={`quiz-create-step ${step >= 2 ? 'active' : ''}`}>
              <span className="quiz-create-step-num">2</span>
              <span className="quiz-create-step-label">Configuration</span>
            </div>
          </div>

          {step === 1 && (
            <>
              <div className="admin-form-group">
                <label className="admin-form-label">Quiz Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="admin-form-input"
                  placeholder="Enter quiz title..."
                  maxLength={200}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter' && form.title.trim()) setStep(2); }}
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Description (Optional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="admin-form-input admin-form-textarea"
                  placeholder="Enter quiz description..."
                  rows={4}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="admin-form-label">Access Mode</label>
                <CustomSelect
                  value={form.accessMode || 'RESTRICTED'}
                  options={[
                    { value: 'RESTRICTED', label: 'Restricted' },
                    { value: 'PUBLIC', label: 'Public' },
                  ]}
                  onChange={(v) => setForm({ ...form, accessMode: v as 'PUBLIC' | 'RESTRICTED' })}
                />
                <p className="admin-form-hint" style={{ marginTop: 4 }}>
                  {form.accessMode === 'RESTRICTED'
                    ? 'Entry requires a pre-registered team access code.'
                    : 'Anyone can join using the quiz code.'}
                </p>
              </div>
              <div>
                <label className="admin-form-label">Quiz Mode</label>
                <CustomSelect
                  value={form.navigationMode || 'TOURNAMENT'}
                  options={[
                    { value: 'TOURNAMENT', label: 'Tournament' },
                    { value: 'CLASS', label: 'Class' },
                  ]}
                  onChange={(v) => setForm({
                    ...form,
                    navigationMode: v as 'TOURNAMENT' | 'CLASS',
                    globalTimeLimitSeconds: v === 'TOURNAMENT' ? 0 : form.globalTimeLimitSeconds,
                  })}
                />
                <p className="admin-form-hint" style={{ marginTop: 4 }}>
                  {form.navigationMode === 'TOURNAMENT'
                    ? 'Host controls question pacing for all participants.'
                    : 'Participants navigate at their own pace within a time limit.'}
                </p>
              </div>
              {form.navigationMode === 'CLASS' && (
                <div>
                  <label className="admin-form-label">Quiz Duration (minutes)</label>
                  <input
                    type="number"
                    min={1}
                    className="admin-form-input"
                    value={form.globalTimeLimitSeconds ? Math.floor(form.globalTimeLimitSeconds / 60) : ''}
                    placeholder="e.g. 30"
                    onChange={(e) => setForm({ ...form, globalTimeLimitSeconds: Number(e.target.value || 0) * 60 })}
                  />
                </div>
              )}
              {form.navigationMode === 'CLASS' && (
                <label className="admin-form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!!form.randomizeQuestions}
                    onChange={(e) => setForm({ ...form, randomizeQuestions: e.target.checked })}
                  />
                  Randomize question order per participant
                </label>
              )}
            </div>
          )}
        </div>

        <div className="admin-modal-footer">
          {step === 1 ? (
            <>
              <button onClick={onClose} className="admin-btn admin-btn-secondary">Cancel</button>
              <button onClick={() => setStep(2)} className="admin-btn admin-btn-primary" disabled={!form.title.trim()}>
                Next
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep(1)} className="admin-btn admin-btn-secondary">Back</button>
              <button onClick={handleCreate} className="admin-btn admin-btn-primary" disabled={creating}>
                {creating ? 'Creating...' : 'Create Quiz'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
