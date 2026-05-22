import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { fetchWithRetry } from '@/utils/api';
import { LecternHeader, type NavView } from '@/components/lectern/LecternHeader';
import { LecternSidebar, type HistoryItem, type FolderItem } from '@/components/lectern/LecternSidebar';
import { LecternEmpty } from '@/components/lectern/LecternEmpty';
import { LecternDragging } from '@/components/lectern/LecternDragging';
import { LecternQueued } from '@/components/lectern/LecternQueued';
import { LecternProcessing } from '@/components/lectern/LecternProcessing';
import { LecternResult } from '@/components/lectern/LecternResult';
import { LecternLibrary } from '@/components/lectern/LecternLibrary';
import { LecternSettings } from '@/components/lectern/LecternSettings';
import { injectLecternAnimations } from '@/components/lectern/styles';

const HISTORY_KEY = 'glm_ocr_history';
const MAX_HISTORY = 50;

interface JobResult {
  job_id: string;
  status: string;
  created_at: string;
  file_hash?: string | null;
  result?: { markdown?: string } | null;
  error_msg?: string | null;
  filename?: string | null;
  folder_id?: string | null;
}

interface ActiveJob {
  job_id: string;
  filename: string;
  status: string;
}

const App: React.FC = () => {
  const { isDark, toggle: toggleDark } = useDarkMode();
  const [activeView, setActiveView] = useState<NavView>('documents');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [url, setUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [job, setJob] = useState<JobResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      return stored.map((h: any) => ({
        id: h.job_id,
        name: h.filename,
        status: h.status,
        time: h.created_at,
        pages: 1,
      }));
    } catch {
      return [];
    }
  });
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const [polling, setPolling] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef(1000);

  useEffect(() => {
    injectLecternAnimations();
  }, []);

  const refreshFolders = useCallback(async () => {
    try {
      const res = await fetchWithRetry(`/api/v1/folders`);
      if (!res.ok) throw new Error('Failed to fetch folders');
      const data = await res.json();
      setFolders(data);
    } catch {
      setFolders([]);
    }
  }, []);

  useEffect(() => {
    refreshFolders();
  }, [refreshFolders]);

  const clearPolling = () => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
    intervalRef.current = 1000;
    setPolling(false);
  };

  const addToHistory = (item: { job_id: string; filename: string; created_at: string; status: string }) => {
    setHistory((prev) => {
      const filtered = prev.filter((p) => p.id !== item.job_id);
      const next: HistoryItem[] = [
        {
          id: item.job_id,
          name: item.filename,
          status: item.status,
          time: item.created_at,
          pages: 1,
        },
        ...filtered,
      ].slice(0, MAX_HISTORY);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next.map((n) => ({
        job_id: n.id,
        filename: n.name,
        status: n.status,
        created_at: n.time,
      }))));
      return next;
    });
  };

  const startPolling = useCallback((jobId: string) => {
    setPolling(true);
    intervalRef.current = 1000;

    const poll = async () => {
      try {
        const res = await fetchWithRetry(`/api/v1/jobs/${jobId}`);
        if (!res.ok) throw new Error('Poll failed');
        const data: JobResult = await res.json();
        setJob(data);
        setActiveJobs((prev) =>
          prev.map((j) => (j.job_id === jobId ? { ...j, status: data.status } : j))
        );

        if (data.status === 'completed' || data.status === 'failed') {
          clearPolling();
          setActiveJobs((prev) => prev.filter((j) => j.job_id !== jobId));
          return;
        }

        const retryAfter = res.headers.get('Retry-After');
        const nextInterval = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : Math.min(intervalRef.current * 2, 8000);
        intervalRef.current = nextInterval;

        pollingRef.current = setTimeout(() => poll(), nextInterval);
      } catch (e) {
        pollingRef.current = setTimeout(() => poll(), Math.min(intervalRef.current * 2, 8000));
      }
    };

    poll();
  }, []);

  useEffect(() => {
    return () => clearPolling();
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        if (pollingRef.current) clearTimeout(pollingRef.current);
      } else if (job && job.status === 'processing') {
        startPolling(job.job_id);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [job, startPolling]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = Array.from(e.dataTransfer.files).filter(
        (f) => f.size <= 20 * 1024 * 1024
      );
      if (dropped.length > 0) {
        setFiles((prev) => [...prev, ...dropped]);
        setError(null);
        setJob(null);
        setActiveView('documents');
        clearPolling();
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files).filter(
        (f) => f.size <= 20 * 1024 * 1024
      );
      setFiles((prev) => [...prev, ...selected]);
      setError(null);
      setJob(null);
      clearPolling();
    }
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetchWithRetry(`/api/v1/ocr/upload`, {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || 'Upload failed');
        }
        const data: JobResult = await res.json();
        addToHistory({
          job_id: data.job_id,
          filename: file.name,
          created_at: data.created_at,
          status: data.status,
        });
        setActiveJobs((prev) => [...prev, { job_id: data.job_id, filename: file.name, status: data.status }]);
        if (data.status === 'pending' || data.status === 'processing') {
          startPolling(data.job_id);
        }
      }
      setFiles([]);
    } catch (e: any) {
      setError(`[ERROR: ${e.message}]`);
    } finally {
      setUploading(false);
    }
  };

  const uploadUrl = async () => {
    if (!url) return;
    setUploading(true);
    setError(null);
    try {
      const res = await fetchWithRetry(`/api/v1/ocr/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Upload failed');
      }
      const data: JobResult = await res.json();
      addToHistory({
        job_id: data.job_id,
        filename: url,
        created_at: data.created_at,
        status: data.status,
      });
      setJob(data);
      if (data.status === 'pending' || data.status === 'processing') {
        startPolling(data.job_id);
      }
    } catch (e: any) {
      setError(`[ERROR: ${e.message}]`);
    } finally {
      setUploading(false);
    }
  };

  const loadHistoryJob = async (jobId: string) => {
    try {
      const res = await fetchWithRetry(`/api/v1/jobs/${jobId}`);
      if (!res.ok) throw new Error('Failed to load job');
      const data: JobResult = await res.json();
      setJob(data);
      setFiles([]);
      setActiveView('documents');
      if (data.status === 'processing') {
        startPolling(data.job_id);
      }
    } catch (e: any) {
      setError(`[ERROR: ${e.message}]`);
    }
  };

  const copyMarkdown = () => {
    const md = job?.result?.markdown;
    if (md) navigator.clipboard.writeText(md);
  };

  const downloadMarkdown = () => {
    const md = job?.result?.markdown;
    if (!md) return;
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const base = (job?.filename || 'result').replace(/\.[^/.]+$/, '');
    a.download = `${base}.md`;
    a.click();
  };

  const deleteJob = async (jobId: string) => {
    try {
      const res = await fetchWithRetry(`/api/v1/jobs/${jobId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setHistory((prev) => prev.filter((h) => h.id !== jobId));
      setActiveJobs((prev) => prev.filter((j) => j.job_id !== jobId));
      if (job?.job_id === jobId) {
        setJob(null);
        clearPolling();
      }
      const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      localStorage.setItem(HISTORY_KEY, JSON.stringify(stored.filter((h: any) => h.job_id !== jobId)));
    } catch (e: any) {
      setError(`[ERROR: ${e.message}]`);
    }
  };

  const handleSelectFolder = (folderId: string | null) => {
    setSelectedFolderId(folderId);
    setActiveView('library');
  };

  const handleMoveJob = async (jobId: string, folderId: string | null) => {
    try {
      const res = await fetchWithRetry(`/api/v1/jobs/${jobId}/folder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder_id: folderId }),
      });
      if (!res.ok) throw new Error('Failed to move job');
      const data: JobResult = await res.json();
      if (job?.job_id === jobId) {
        setJob(data);
      }
    } catch (e: any) {
      setError(`[ERROR: ${e.message}]`);
    }
  };

  // Documents sub-view
  let docView: 'empty' | 'dragging' | 'queued' | 'processing' | 'result' = 'empty';
  if (activeView === 'documents') {
    if (dragActive) {
      docView = 'dragging';
    } else if (files.length > 0 && !uploading) {
      docView = 'queued';
    } else if (uploading || polling || (job && (job.status === 'pending' || job.status === 'processing'))) {
      docView = 'processing';
    } else if (job && (job.status === 'completed' || job.status === 'failed')) {
      docView = 'result';
    }
  }

  const firstFile = files[0] || null;
  const currentJobId = job?.job_id || null;
  const currentFilename = activeJobs.find((a) => a.job_id === currentJobId)?.filename || firstFile?.name || job?.filename || job?.job_id || 'document';

  const queuedFiles = files.map((f) => ({
    name: f.name,
    size: f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(1)} MB` : `${(f.size / 1024).toFixed(0)} KB`,
    pages: 1,
  }));

  const fileNamesStr = files.map((f) => f.name).join(", ");

  return (
    <div
      className={isDark ? 'dark' : ''}
      style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <LecternHeader
        isDark={isDark}
        onToggleDark={toggleDark}
        activeView={activeView}
        onChangeView={setActiveView}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
      />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {!sidebarCollapsed && (
          <LecternSidebar
            history={history}
            activeId={job?.job_id || null}
            onSelect={loadHistoryJob}
            isDark={isDark}
            selectedFolderId={selectedFolderId}
            onSelectFolder={handleSelectFolder}
          />
        )}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {activeView === 'documents' && (
            <>
              {docView === 'empty' && (
                <LecternEmpty
                  isDark={isDark}
                  inputRef={inputRef}
                  onBrowse={() => inputRef.current?.click()}
                  url={url}
                  onUrlChange={setUrl}
                  onFetch={uploadUrl}
                />
              )}
              {docView === 'dragging' && (
                <LecternDragging
                  isDark={isDark}
                  fileCount={files.length}
                  fileNames={fileNamesStr}
                />
              )}
              {docView === 'queued' && (
                <LecternQueued
                  isDark={isDark}
                  files={queuedFiles}
                  onRemove={removeFile}
                  onAddMore={() => inputRef.current?.click()}
                  onReadAll={uploadFiles}
                />
              )}
              {docView === 'processing' && (
                <LecternProcessing
                  isDark={isDark}
                  filename={currentFilename}
                  progress={job?.status === 'completed' ? 100 : job?.status === 'failed' ? 0 : 62}
                  file={firstFile}
                  jobId={currentJobId}
                />
              )}
              {docView === 'result' && (
                <LecternResult
                  isDark={isDark}
                  filename={currentFilename}
                  latency={job?.created_at ? `${new Date(job.created_at).toLocaleTimeString()}` : ''}
                  markdown={job?.result?.markdown || ''}
                  file={firstFile}
                  jobId={currentJobId}
                  folderId={job?.folder_id || null}
                  folders={folders}
                  onCopy={copyMarkdown}
                  onDownload={downloadMarkdown}
                  onDelete={() => job?.job_id && deleteJob(job.job_id)}
                  onMoveFolder={handleMoveJob}
                />
              )}
            </>
          )}

          {activeView === 'library' && (
                <LecternLibrary
                  isDark={isDark}
                  selectedFolderId={selectedFolderId}
                  folders={folders}
                  onSelectJob={(id) => loadHistoryJob(id)}
                  onDeleteJob={deleteJob}
                  onMoveJob={handleMoveJob}
                />
          )}

          {activeView === 'settings' && (
            <LecternSettings
              isDark={isDark}
              onToggleDark={toggleDark}
            />
          )}

          {/* Hidden file input */}
          <input
            ref={inputRef}
            type="file"
            accept="image/*,.pdf"
            multiple
            style={{ display: 'none' }}
            onChange={handleChange}
          />

          {/* Error toast */}
          {error && (
            <div
              style={{
                position: 'absolute',
                bottom: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                background: isDark ? '#2A251D' : '#FFFFFF',
                border: `1px solid ${isDark ? '#D5655A' : '#B5453A'}`,
                borderRadius: 10,
                padding: '12px 20px',
                color: isDark ? '#D5655A' : '#B5453A',
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
              {error}
              <button
                onClick={() => setError(null)}
                style={{
                  marginLeft: 8,
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
