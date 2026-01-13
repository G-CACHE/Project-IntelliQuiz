import { useState, useEffect } from 'react';
import {
  BiData,
  BiPlus,
  BiDownload,
  BiTrash,
  BiRefresh,
  BiX,
  BiErrorCircle,
  BiCheckCircle,
  BiTime,
  BiHistory,
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

  useEffect(() => {
    loadBackups();
  }, []);

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
      setBackups(prev => [newBackup, ...prev]);
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
      setSuccess(`Database restored from backup "${selectedBackup.filename}"`);
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
      setBackups(prev => prev.filter(b => b.id !== selectedBackup.id));
      setShowDeleteModal(false);
      setSelectedBackup(null);
      setSuccess('Backup deleted successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete backup');
    }
  };

  const handleDownload = (backup: BackupRecord) => {
    const token = localStorage.getItem('token');
    const url = `http://localhost:8090/api/backups/${backup.id}/download`;
    
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(response => response.blob())
      .then(blob => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = backup.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        a.remove();
      })
      .catch(() => setError('Failed to download backup'));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <span className="badge badge-success"><BiCheckCircle size={14} /> Success</span>;
      case 'FAILED':
        return <span className="badge badge-danger"><BiErrorCircle size={14} /> Failed</span>;
      case 'IN_PROGRESS':
        return <span className="badge badge-warning"><BiTime size={14} /> In Progress</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }


  return (
    <div>
      {/* Page Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--spacing-xl)',
        marginBottom: 'var(--spacing-xl)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: -30,
          right: 80,
          width: 120,
          height: 120,
          background: 'rgba(248, 193, 7, 0.1)',
          borderRadius: '50%',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -20,
          right: 200,
          width: 80,
          height: 80,
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '50%',
        }} />
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <div style={{
              width: 56,
              height: 56,
              background: 'rgba(248, 193, 7, 0.2)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-accent)',
            }}>
              <BiData size={28} />
            </div>
            <div>
              <h1 style={{ color: 'var(--color-white)', fontSize: 'var(--font-size-2xl)', fontWeight: 700, margin: 0 }}>
                Database Backups
              </h1>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 'var(--font-size-sm)', margin: '4px 0 0' }}>
                Create, restore, and manage database backups
              </p>
            </div>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={handleCreate}
            disabled={creating}
          >
            {creating ? (
              <><div className="loading-spinner" style={{ width: 18, height: 18 }} /> Creating...</>
            ) : (
              <><BiPlus size={18} /> Create Backup</>
            )}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <div className="alert-content">
            <BiErrorCircle size={20} />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="btn-icon">
            <BiX size={20} />
          </button>
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <div className="alert-content">
            <BiCheckCircle size={20} />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="btn-icon">
            <BiX size={20} />
          </button>
        </div>
      )}


      {/* Backups Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>BACKUP</th>
              <th>STATUS</th>
              <th>SIZE</th>
              <th>CREATED BY</th>
              <th>LAST RESTORED</th>
              <th style={{ textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {backups.length > 0 ? (
              backups.map((backup) => (
                <tr key={backup.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 'var(--radius-lg)',
                        background: backup.status === 'SUCCESS' 
                          ? 'linear-gradient(135deg, #10b981, #059669)'
                          : backup.status === 'FAILED'
                          ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                          : 'linear-gradient(135deg, #f59e0b, #d97706)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                      }}>
                        <BiData size={22} />
                      </div>
                      <div>
                        <span style={{ fontWeight: 600, display: 'block', color: 'var(--text-primary)' }}>
                          {backup.filename}
                        </span>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                          {formatDate(backup.createdAt)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>{getStatusBadge(backup.status)}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{formatFileSize(backup.fileSizeBytes)}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{backup.createdByUsername || '-'}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                    {backup.lastRestoredAt ? formatDate(backup.lastRestoredAt) : '-'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'flex-end' }}>
                      <button 
                        className="btn-icon" 
                        onClick={() => handleDownload(backup)} 
                        title="Download"
                        disabled={backup.status !== 'SUCCESS'}
                        style={{ opacity: backup.status !== 'SUCCESS' ? 0.4 : 1 }}
                      >
                        <BiDownload size={18} />
                      </button>
                      <button 
                        className="btn-icon" 
                        onClick={() => { setSelectedBackup(backup); setShowRestoreModal(true); }} 
                        title="Restore"
                        disabled={backup.status !== 'SUCCESS' || restoring !== null}
                        style={{ opacity: backup.status !== 'SUCCESS' || restoring !== null ? 0.4 : 1 }}
                      >
                        {restoring === backup.id ? (
                          <div className="loading-spinner" style={{ width: 18, height: 18 }} />
                        ) : (
                          <BiHistory size={18} />
                        )}
                      </button>
                      <button
                        className="btn-icon danger"
                        onClick={() => { setSelectedBackup(backup); setShowDeleteModal(true); }}
                        title="Delete"
                      >
                        <BiTrash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <BiData size={56} className="empty-state-icon" />
                    <p style={{ fontWeight: 600, marginTop: 'var(--spacing-md)' }}>No backups found</p>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                      Create your first backup to protect your data
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>


      {/* Restore Confirmation Modal */}
      {showRestoreModal && selectedBackup && (
        <div className="modal-overlay" onClick={() => setShowRestoreModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Restore Database</h2>
              <button onClick={() => setShowRestoreModal(false)} className="btn-icon"><BiX size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: 'var(--spacing-md)' }}>
                <div style={{
                  width: 64,
                  height: 64,
                  margin: '0 auto var(--spacing-md)',
                  background: 'rgba(245, 158, 11, 0.1)',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f59e0b',
                }}>
                  <BiHistory size={28} />
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
                  Are you sure you want to restore the database from:
                </p>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--spacing-md)' }}>
                  {selectedBackup.filename}
                </p>
                <div style={{ 
                  background: 'rgba(245, 158, 11, 0.1)', 
                  padding: 'var(--spacing-md)', 
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                }}>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: '#b45309', margin: 0 }}>
                    ⚠️ A pre-restore backup will be created automatically. This operation will replace all current data.
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowRestoreModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleRestore} className="btn btn-warning">Restore Database</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedBackup && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Delete Backup</h2>
              <button onClick={() => setShowDeleteModal(false)} className="btn-icon"><BiX size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: 'var(--spacing-md)' }}>
                <div style={{
                  width: 64,
                  height: 64,
                  margin: '0 auto var(--spacing-md)',
                  background: 'rgba(136, 0, 21, 0.1)',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary)',
                }}>
                  <BiTrash size={28} />
                </div>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{selectedBackup.filename}</strong>?
                </p>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginTop: 'var(--spacing-xs)' }}>
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="btn btn-danger">Delete Backup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
