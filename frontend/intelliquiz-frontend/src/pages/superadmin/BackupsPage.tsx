import { useState, useEffect } from 'react';
import {
  BiPlus, BiDownload, BiTrash, BiX,
  BiErrorCircle, BiCheckCircle, BiTime, BiHistory,
  BiData, BiWrench, BiShield, BiRefresh,
  BiInfoCircle, BiServer, BiCog,
} from 'react-icons/bi';
import { backupsApi, type BackupRecord } from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type MaintenanceTab = 'backups' | 'health' | 'tools';

interface SystemHealthItem {
  label: string;
  value: string;
  status: 'ok' | 'warn' | 'error';
  detail?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (d: string) => new Date(d).toLocaleString();

const StatusBadge = ({ status }: { status: string }) => {
  if (status === 'SUCCESS')
    return <span className="badge badge-success"><BiCheckCircle size={12} /> Success</span>;
  if (status === 'FAILED')
    return <span className="badge badge-danger"><BiErrorCircle size={12} /> Failed</span>;
  return <span className="badge badge-warning"><BiTime size={12} /> In Progress</span>;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BackupsPage() {
  const [activeTab, setActiveTab] = useState<MaintenanceTab>('backups');

  // Backup state
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [backupsLoading, setBackupsLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null);

  // Health state
  const [healthItems, setHealthItems] = useState<SystemHealthItem[]>([]);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthLastChecked, setHealthLastChecked] = useState<Date | null>(null);

  // Shared alerts
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Maintenance tools state
  const [maintenanceLog, setMaintenanceLog] = useState<string[]>([]);

  useEffect(() => {
    loadBackups();
  }, []);

  // ── Backup actions ──────────────────────────────────────────────────────────

  const loadBackups = async () => {
    setBackupsLoading(true);
    setError(null);
    try {
      const data = await backupsApi.getAll();
      setBackups(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load backups');
    } finally {
      setBackupsLoading(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    setSuccess(null);
    try {
      const newBackup = await backupsApi.create();
      setBackups((prev) => [newBackup, ...prev]);
      if (newBackup.status === 'FAILED') {
        setError(
          newBackup.errorMessage
            ? `Backup failed: ${newBackup.errorMessage}`
            : 'Backup failed. Check server configuration (pg_dump / docker exec).'
        );
        appendLog('Backup FAILED: ' + (newBackup.errorMessage ?? 'unknown error'));
      } else {
        setSuccess('Backup created successfully');
        appendLog('Database backup created: ' + newBackup.filename);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create backup');
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedBackup) return;
    const backupToRestore = selectedBackup;
    setRestoring(backupToRestore.id);
    setError(null);
    setSuccess(null);
    setShowRestoreModal(false);
    setSelectedBackup(null);
    try {
      await backupsApi.restore(backupToRestore.id);
      setSuccess(`Database restored from "${backupToRestore.filename}"`);
      appendLog('Database restored from backup: ' + backupToRestore.filename);
      await loadBackups();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore backup');
    } finally {
      setRestoring(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedBackup) return;
    const backupToDelete = selectedBackup;
    setShowDeleteModal(false);
    setSelectedBackup(null);
    setError(null);
    setSuccess(null);
    try {
      await backupsApi.delete(backupToDelete.id);
      setBackups((prev) => prev.filter((b) => b.id !== backupToDelete.id));
      setSuccess('Backup deleted');
      appendLog('Backup deleted: ' + backupToDelete.filename);
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
        appendLog('Backup downloaded: ' + backup.filename);
      })
      .catch(() => setError('Failed to download backup'));
  };

  // ── Health check ────────────────────────────────────────────────────────────

  const runHealthCheck = async () => {
    setHealthLoading(true);
    setError(null);
    try {
      // ── 1. Database + API: fetch backups list and measure latency ──
      const dbStart = Date.now();
      const backupData = await backupsApi.getAll();
      const dbLatency = Date.now() - dbStart;
      // Keep backup list in sync
      setBackups(backupData);

      const successCount = backupData.filter((b) => b.status === 'SUCCESS').length;
      const failedCount = backupData.filter((b) => b.status === 'FAILED').length;
      const latestBackup = backupData[0] ?? null;

      const latestBackupAge = latestBackup
        ? Math.floor((Date.now() - new Date(latestBackup.createdAt).getTime()) / (1000 * 60 * 60))
        : null;

      // ── 2. Auth service: verify session is still valid ──
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      let authStatus: 'ok' | 'warn' | 'error' = 'ok';
      let authValue = 'Active';
      let authDetail = 'Session validated successfully';
      try {
        const authStart = Date.now();
        const authRes = await fetch(`${baseUrl}/api/users/me`, { credentials: 'include' });
        const authLatency = Date.now() - authStart;
        if (!authRes.ok) {
          authStatus = 'error';
          authValue = `HTTP ${authRes.status}`;
          authDetail = 'Session may have expired — try refreshing';
        } else if (authLatency > 1000) {
          authStatus = 'warn';
          authValue = `Slow (${authLatency}ms)`;
          authDetail = 'Auth service responding slowly';
        }
      } catch {
        authStatus = 'error';
        authValue = 'Unreachable';
        authDetail = 'Could not reach authentication service';
      }

      const items: SystemHealthItem[] = [
        {
          label: 'Database Connection',
          value: `${dbLatency}ms`,
          status: dbLatency < 500 ? 'ok' : dbLatency < 2000 ? 'warn' : 'error',
          detail: dbLatency < 500 ? 'Responding normally' : 'Elevated response time',
        },
        {
          label: 'API Server',
          value: dbLatency < 2000 ? 'Online' : 'Degraded',
          status: dbLatency < 500 ? 'ok' : dbLatency < 2000 ? 'warn' : 'error',
          detail: `Round-trip: ${dbLatency}ms`,
        },
        {
          label: 'Backup Storage',
          value: `${successCount} backup${successCount !== 1 ? 's' : ''} available`,
          status: successCount > 0 ? 'ok' : 'warn',
          detail: failedCount > 0 ? `${failedCount} failed backup(s) on record` : 'No failed backups',
        },
        {
          label: 'Latest Backup Age',
          value: latestBackupAge !== null ? `${latestBackupAge}h ago` : 'No backups',
          status:
            latestBackupAge === null
              ? 'error'
              : latestBackupAge < 24
              ? 'ok'
              : latestBackupAge < 72
              ? 'warn'
              : 'error',
          detail:
            latestBackupAge === null
              ? 'No backups found — create one now'
              : latestBackupAge < 24
              ? 'Backup is recent'
              : 'Consider creating a fresh backup',
        },
        {
          label: 'Authentication Service',
          value: authValue,
          status: authStatus,
          detail: authDetail,
        },
      ];

      setHealthItems(items);
      setHealthLastChecked(new Date());
      appendLog('System health check completed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Health check failed');
    } finally {
      setHealthLoading(false);
    }
  };

  // ── Maintenance log ─────────────────────────────────────────────────────────

  const appendLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setMaintenanceLog((prev) => [`[${timestamp}] ${msg}`, ...prev].slice(0, 50));
  };

  const clearLog = () => setMaintenanceLog([]);

  // ── Render ──────────────────────────────────────────────────────────────────

  const overallHealth =
    healthItems.length === 0
      ? null
      : healthItems.some((i) => i.status === 'error')
      ? 'error'
      : healthItems.some((i) => i.status === 'warn')
      ? 'warn'
      : 'ok';

  return (
    <div className="superadmin-page">

      {/* ── Page Hero ── */}
      <div className="sa-page-hero">
        <div className="sa-page-hero-content">
          <div>
            <h1 className="sa-page-hero-title">System Maintenance</h1>
            <p className="sa-page-hero-subtitle">
              Database backups, health monitoring, and maintenance tools
            </p>
          </div>
          {activeTab === 'backups' && (
            <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
              {creating ? (
                <>
                  <div className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Creating…
                </>
              ) : (
                <>
                  <BiPlus size={16} /> Create Backup
                </>
              )}
            </button>
          )}
          {activeTab === 'health' && (
            <button className="btn btn-primary" onClick={runHealthCheck} disabled={healthLoading}>
              {healthLoading ? (
                <>
                  <div className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Checking…
                </>
              ) : (
                <>
                  <BiRefresh size={16} /> Run Health Check
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Alerts ── */}
      {error && (
        <div className="alert alert-error">
          <div className="alert-content">
            <BiErrorCircle size={18} />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="btn-icon">
            <BiX size={18} />
          </button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <div className="alert-content">
            <BiCheckCircle size={18} />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="btn-icon">
            <BiX size={18} />
          </button>
        </div>
      )}

      {/* ── Tab Bar ── */}
      <div className="maintenance-tabs">
        <button
          className={`maintenance-tab ${activeTab === 'backups' ? 'active' : ''}`}
          onClick={() => setActiveTab('backups')}
        >
          <BiData size={16} />
          Database Backups
        </button>
        <button
          className={`maintenance-tab ${activeTab === 'health' ? 'active' : ''}`}
          onClick={() => { setActiveTab('health'); if (healthItems.length === 0) runHealthCheck(); }}
        >
          <BiShield size={16} />
          System Health
          {overallHealth === 'error' && <span className="tab-dot dot-error" />}
          {overallHealth === 'warn' && <span className="tab-dot dot-warn" />}
          {overallHealth === 'ok' && <span className="tab-dot dot-ok" />}
        </button>
        <button
          className={`maintenance-tab ${activeTab === 'tools' ? 'active' : ''}`}
          onClick={() => setActiveTab('tools')}
        >
          <BiWrench size={16} />
          Maintenance Tools
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: DATABASE BACKUPS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'backups' && (
        <>
          {/* Stats row */}
          <div className="maintenance-stats-row">
            <div className="maintenance-stat-card">
              <div className="maintenance-stat-icon" style={{ background: 'rgba(122,23,51,0.08)', color: '#7a1733' }}>
                <BiData size={20} />
              </div>
              <div>
                <div className="maintenance-stat-value">{backups.length}</div>
                <div className="maintenance-stat-label">Total Backups</div>
              </div>
            </div>
            <div className="maintenance-stat-card">
              <div className="maintenance-stat-icon" style={{ background: 'rgba(16,185,129,0.08)', color: '#059669' }}>
                <BiCheckCircle size={20} />
              </div>
              <div>
                <div className="maintenance-stat-value">
                  {backups.filter((b) => b.status === 'SUCCESS').length}
                </div>
                <div className="maintenance-stat-label">Successful</div>
              </div>
            </div>
            <div className="maintenance-stat-card">
              <div className="maintenance-stat-icon" style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626' }}>
                <BiErrorCircle size={20} />
              </div>
              <div>
                <div className="maintenance-stat-value">
                  {backups.filter((b) => b.status === 'FAILED').length}
                </div>
                <div className="maintenance-stat-label">Failed</div>
              </div>
            </div>
            <div className="maintenance-stat-card">
              <div className="maintenance-stat-icon" style={{ background: 'rgba(59,130,246,0.08)', color: '#2563eb' }}>
                <BiServer size={20} />
              </div>
              <div>
                <div className="maintenance-stat-value">
                  {formatSize(backups.reduce((acc, b) => acc + (b.fileSizeBytes || 0), 0))}
                </div>
                <div className="maintenance-stat-label">Total Size</div>
              </div>
            </div>
          </div>

          {/* Info banner */}
          <div className="maintenance-info-banner">
            <BiInfoCircle size={16} />
            <span>
              Backups are stored as PostgreSQL dumps. Restoring will replace all current data — a
              pre-restore snapshot is created automatically before any restore operation.
            </span>
          </div>

          {/* Backups table */}
          {backupsLoading ? (
            <div className="loading-container">
              <div className="loading-spinner" />
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>FILENAME</th>
                    <th>STATUS</th>
                    <th>SIZE</th>
                    <th>CREATED BY</th>
                    <th>DATE</th>
                    <th>LAST RESTORED</th>
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
                        <td>
                          <StatusBadge status={backup.status} />
                        </td>
                        <td className="sa-table-muted">{formatSize(backup.fileSizeBytes)}</td>
                        <td className="sa-table-muted">{backup.createdByUsername || '—'}</td>
                        <td className="sa-table-muted">{formatDate(backup.createdAt)}</td>
                        <td className="sa-table-muted">
                          {backup.lastRestoredAt ? formatDate(backup.lastRestoredAt) : '—'}
                        </td>
                        <td>
                          <div className="sa-table-actions">
                            <button
                              className="btn-icon"
                              onClick={() => handleDownload(backup)}
                              title="Download backup file"
                              disabled={backup.status !== 'SUCCESS'}
                              style={{ opacity: backup.status !== 'SUCCESS' ? 0.35 : 1 }}
                            >
                              <BiDownload size={16} />
                            </button>
                            <button
                              className="btn-icon"
                              onClick={() => {
                                setSelectedBackup(backup);
                                setShowRestoreModal(true);
                              }}
                              title="Restore database from this backup"
                              disabled={backup.status !== 'SUCCESS' || restoring !== null}
                              style={{
                                opacity:
                                  backup.status !== 'SUCCESS' || restoring !== null ? 0.35 : 1,
                              }}
                            >
                              {restoring === backup.id ? (
                                <div
                                  className="loading-spinner"
                                  style={{ width: 16, height: 16, borderWidth: 2 }}
                                />
                              ) : (
                                <BiHistory size={16} />
                              )}
                            </button>
                            <button
                              className="btn-icon danger"
                              onClick={() => {
                                setSelectedBackup(backup);
                                setShowDeleteModal(true);
                              }}
                              title="Delete backup"
                            >
                              <BiTrash size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7}>
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
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: SYSTEM HEALTH
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'health' && (
        <div className="maintenance-health-section">
          {healthLastChecked && (
            <p className="maintenance-last-checked">
              Last checked: {healthLastChecked.toLocaleTimeString()}
            </p>
          )}

          {healthLoading ? (
            <div className="loading-container">
              <div className="loading-spinner" />
              <p style={{ marginTop: 12, color: '#6b7280', fontSize: 14 }}>
                Running health checks…
              </p>
            </div>
          ) : healthItems.length === 0 ? (
            <div className="maintenance-health-empty">
              <BiShield size={48} style={{ color: '#d1d5db', marginBottom: 12 }} />
              <p>Click "Run Health Check" to inspect system status</p>
            </div>
          ) : (
            <>
              {/* Overall status banner */}
              <div
                className={`maintenance-overall-status ${
                  overallHealth === 'ok'
                    ? 'status-ok'
                    : overallHealth === 'warn'
                    ? 'status-warn'
                    : 'status-error'
                }`}
              >
                {overallHealth === 'ok' && <BiCheckCircle size={20} />}
                {overallHealth === 'warn' && <BiInfoCircle size={20} />}
                {overallHealth === 'error' && <BiErrorCircle size={20} />}
                <span>
                  {overallHealth === 'ok' && 'All systems operational'}
                  {overallHealth === 'warn' && 'System running with warnings'}
                  {overallHealth === 'error' && 'One or more systems need attention'}
                </span>
              </div>

              {/* Health items grid */}
              <div className="maintenance-health-grid">
                {healthItems.map((item) => (
                  <div key={item.label} className={`maintenance-health-card health-${item.status}`}>
                    <div className="maintenance-health-card-header">
                      <span className="maintenance-health-label">{item.label}</span>
                      <span
                        className={`badge ${
                          item.status === 'ok'
                            ? 'badge-success'
                            : item.status === 'warn'
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}
                      >
                        {item.status === 'ok' ? (
                          <><BiCheckCircle size={11} /> OK</>
                        ) : item.status === 'warn' ? (
                          <><BiInfoCircle size={11} /> Warning</>
                        ) : (
                          <><BiErrorCircle size={11} /> Error</>
                        )}
                      </span>
                    </div>
                    <div className="maintenance-health-value">{item.value}</div>
                    {item.detail && (
                      <div className="maintenance-health-detail">{item.detail}</div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: MAINTENANCE TOOLS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'tools' && (
        <div className="maintenance-tools-section">
          <div className="maintenance-tools-grid">

            {/* Quick Backup */}
            <div className="maintenance-tool-card">
              <div className="maintenance-tool-icon" style={{ background: 'rgba(122,23,51,0.08)', color: '#7a1733' }}>
                <BiData size={24} />
              </div>
              <div className="maintenance-tool-body">
                <h3 className="maintenance-tool-title">Quick Backup</h3>
                <p className="maintenance-tool-desc">
                  Create an immediate database snapshot. Recommended before any major changes or
                  deployments.
                </p>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setActiveTab('backups');
                  handleCreate();
                }}
                disabled={creating}
              >
                {creating ? 'Creating…' : 'Create Now'}
              </button>
            </div>

            {/* Health Check */}
            <div className="maintenance-tool-card">
              <div className="maintenance-tool-icon" style={{ background: 'rgba(16,185,129,0.08)', color: '#059669' }}>
                <BiShield size={24} />
              </div>
              <div className="maintenance-tool-body">
                <h3 className="maintenance-tool-title">System Health Check</h3>
                <p className="maintenance-tool-desc">
                  Verify database connectivity, API availability, and backup storage status.
                </p>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setActiveTab('health');
                  runHealthCheck();
                }}
                disabled={healthLoading}
              >
                {healthLoading ? 'Checking…' : 'Run Check'}
              </button>
            </div>

            {/* Refresh Backup List */}
            <div className="maintenance-tool-card">
              <div className="maintenance-tool-icon" style={{ background: 'rgba(59,130,246,0.08)', color: '#2563eb' }}>
                <BiRefresh size={24} />
              </div>
              <div className="maintenance-tool-body">
                <h3 className="maintenance-tool-title">Refresh Backup List</h3>
                <p className="maintenance-tool-desc">
                  Reload the backup records from the server to see the latest state of all snapshots.
                </p>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setActiveTab('backups');
                  loadBackups();
                }}
              >
                Refresh
              </button>
            </div>

            {/* Maintenance Log */}
            <div className="maintenance-tool-card maintenance-tool-card-wide">
              <div className="maintenance-tool-icon" style={{ background: 'rgba(107,114,128,0.08)', color: '#6b7280' }}>
                <BiCog size={24} />
              </div>
              <div className="maintenance-tool-body" style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <h3 className="maintenance-tool-title" style={{ margin: 0 }}>Activity Log</h3>
                  {maintenanceLog.length > 0 && (
                    <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: 12 }} onClick={clearLog}>
                      Clear
                    </button>
                  )}
                </div>
                <p className="maintenance-tool-desc">
                  A session log of maintenance actions performed during this visit.
                </p>
                <div className="maintenance-log-box">
                  {maintenanceLog.length === 0 ? (
                    <span className="maintenance-log-empty">No activity yet this session</span>
                  ) : (
                    maintenanceLog.map((entry, i) => (
                      <div key={i} className="maintenance-log-entry">{entry}</div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Restore Modal ── */}
      {showRestoreModal && selectedBackup && (
        <div className="modal-overlay" onClick={() => setShowRestoreModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Restore Database</h2>
              <button onClick={() => setShowRestoreModal(false)} className="btn-icon">
                <BiX size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ margin: '0 0 12px', color: '#374151', lineHeight: 1.6 }}>
                Restore from{' '}
                <strong style={{ color: '#111111' }}>{selectedBackup.filename}</strong>?
              </p>
              <div
                style={{
                  padding: '12px 14px',
                  background: '#faf2df',
                  border: '1px solid #eadfc2',
                  borderRadius: 10,
                }}
              >
                <p style={{ margin: 0, fontSize: 13, color: '#7a5a13', lineHeight: 1.5 }}>
                  A pre-restore backup will be created automatically. This will replace all current
                  data with the selected snapshot.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowRestoreModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleRestore} className="btn btn-warning">
                Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {showDeleteModal && selectedBackup && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Delete Backup</h2>
              <button onClick={() => setShowDeleteModal(false)} className="btn-icon">
                <BiX size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ margin: 0, color: '#374151', lineHeight: 1.6 }}>
                Delete{' '}
                <strong style={{ color: '#111111' }}>{selectedBackup.filename}</strong>? This
                action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleDelete} className="btn btn-danger">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
