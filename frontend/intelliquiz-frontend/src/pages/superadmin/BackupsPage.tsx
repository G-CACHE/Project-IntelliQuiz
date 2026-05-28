import { useState, useEffect } from 'react';
import {
  BiPlus, BiDownload, BiTrash, BiX,
  BiErrorCircle, BiCheckCircle, BiTime, BiHistory,
} from 'react-icons/bi';
import { backupsApi, type BackupRecord } from '../../services/api';

export default function BackupsPage() {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null);

  useEffect(() => { loadBackups(); }, []);

  const loadBackups = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await backupsApi.getAll();
      setBackups(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load backups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    setSuccess(null);
    try {
      const newBackup = await backupsApi.create();
      setBackups((prev) => [newBackup, ...prev]);
      setSuccess('Backup created successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create backup');
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedBackup) return;
    setRestoring(selectedBackup.id);
    setError(null);
    setSuccess(null);
    setShowRestoreModal(false);
    try {
      await backupsApi.restore(selectedBackup.id);
      setSuccess(`Database restored from "${selectedBackup.filename}"`);
      await loadBackups();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore backup');
    } finally {
      setRestoring(null);
      setSelectedBackup(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedBackup) return;
    try {
      await backupsApi.delete(selectedBackup.id);
      setBackups((prev) => prev.filter((b) => b.id !== selectedBackup.id));
      setShowDeleteModal(false);
      setSelectedBackup(null);
      setSuccess('Backup deleted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete backup');
    }
  };

  const handleDownload = (backup: BackupRecord) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    fetch(`${baseUrl}/api/backups/${backup.id}/download`, { credentials: 'include' })
      .then((r) => r.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = backup.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      })
      .catch(() => setError('Failed to download backup'));
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (d: string) => new Date(d).toLocaleString();

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'SUCCESS') return <span className="badge badge-success"><BiCheckCircle size={12} /> Success</span>;
    if (status === 'FAILED') return <span className="badge badge-danger"><BiErrorCircle size={12} /> Failed</span>;
    return <span className="badge badge-warning"><BiTime size={12} /> In Progress</span>;
  };

  if (loading) {
    return <div className="loading-container"><div className="loading-spinner" /></div>;
  }

  return (
    <div className="superadmin-page">

      {/* Hero */}
      <div className="sa-page-hero">
        <div className="sa-page-hero-content">
          <div>
            <h1 className="sa-page-hero-title">Database Backups</h1>
            <p className="sa-page-hero-subtitle">Create, restore, and manage database snapshots</p>
          </div>
          <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
            {creating
              ? <><div className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Creating…</>
              : <><BiPlus size={16} /> Create Backup</>}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error">
          <div className="alert-content"><BiErrorCircle size={18} /><span>{error}</span></div>
          <button onClick={() => setError(null)} className="btn-icon"><BiX size={18} /></button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <div className="alert-content"><BiCheckCircle size={18} /><span>{success}</span></div>
          <button onClick={() => setSuccess(null)} className="btn-icon"><BiX size={18} /></button>
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>FILENAME</th>
              <th>STATUS</th>
              <th>SIZE</th>
              <th>CREATED BY</th>
              <th>DATE</th>
              <th style={{ textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {backups.length > 0 ? (
              backups.map((backup) => (
                <tr key={backup.id}>
                  <td>
                    <span className="sa-table-username">{backup.filename}</span>
                    {backup.status === 'FAILED' && backup.errorMessage && (
                      <span
                        className="sa-table-sub"
                        title={backup.errorMessage}
                        style={{ color: '#b91c1c' }}
                      >
                        {backup.errorMessage.length > 48
                          ? backup.errorMessage.slice(0, 48) + '…'
                          : backup.errorMessage}
                      </span>
                    )}
                  </td>
                  <td><StatusBadge status={backup.status} /></td>
                  <td className="sa-table-muted">{formatSize(backup.fileSizeBytes)}</td>
                  <td className="sa-table-muted">{backup.createdByUsername || '—'}</td>
                  <td className="sa-table-muted">{formatDate(backup.createdAt)}</td>
                  <td>
                    <div className="sa-table-actions">
                      <button
                        className="btn-icon"
                        onClick={() => handleDownload(backup)}
                        title="Download"
                        disabled={backup.status !== 'SUCCESS'}
                        style={{ opacity: backup.status !== 'SUCCESS' ? 0.35 : 1 }}
                      >
                        <BiDownload size={16} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => { setSelectedBackup(backup); setShowRestoreModal(true); }}
                        title="Restore"
                        disabled={backup.status !== 'SUCCESS' || restoring !== null}
                        style={{ opacity: backup.status !== 'SUCCESS' || restoring !== null ? 0.35 : 1 }}
                      >
                        {restoring === backup.id
                          ? <div className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                          : <BiHistory size={16} />}
                      </button>
                      <button
                        className="btn-icon danger"
                        onClick={() => { setSelectedBackup(backup); setShowDeleteModal(true); }}
                        title="Delete"
                      >
                        <BiTrash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <h3>No backups yet</h3>
                    <p>Create your first backup to protect your data</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Restore Modal */}
      {showRestoreModal && selectedBackup && (
        <div className="modal-overlay" onClick={() => setShowRestoreModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Restore Database</h2>
              <button onClick={() => setShowRestoreModal(false)} className="btn-icon"><BiX size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ margin: '0 0 12px', color: '#374151', lineHeight: 1.6 }}>
                Restore from <strong style={{ color: '#111111' }}>{selectedBackup.filename}</strong>?
              </p>
              <div style={{ padding: '12px 14px', background: '#faf2df', border: '1px solid #eadfc2', borderRadius: 10 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#7a5a13', lineHeight: 1.5 }}>
                  A pre-restore backup will be created automatically. This will replace all current data.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowRestoreModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleRestore} className="btn btn-warning">Restore</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedBackup && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Delete Backup</h2>
              <button onClick={() => setShowDeleteModal(false)} className="btn-icon"><BiX size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ margin: 0, color: '#374151', lineHeight: 1.6 }}>
                Delete <strong style={{ color: '#111111' }}>{selectedBackup.filename}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="btn btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
