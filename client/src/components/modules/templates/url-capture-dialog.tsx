import { useState, useCallback } from 'react';
import { Globe, Loader2, X, Copy, Check, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface UrlCaptureDialogProps {
  open: boolean;
  onClose: () => void;
  onCaptured?: (html: string, url: string) => void;
}

export function UrlCaptureDialog({ open, onClose, onCaptured }: UrlCaptureDialogProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = useCallback(async () => {
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post<{ html: string }>('/sections/capture/url', { url: url.trim() });
      setResult(response.html);
      onCaptured?.(response.html, url.trim());
      toast.success('Page captured successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to capture page';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [url, onCaptured]);

  const handleCopyHtml = useCallback(async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success('HTML copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const handleClose = useCallback(() => {
    setUrl('');
    setResult(null);
    setError(null);
    setLoading(false);
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      className="flex items-center justify-center"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 100,
      }}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          width: 520,
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflow: 'auto',
          animation: 'fadeIn 150ms ease-out',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <div className="flex items-center" style={{ gap: 8 }}>
            <Globe size={16} style={{ color: 'var(--accent-text)' }} />
            <div>
              <h2
                style={{
                  fontSize: 'var(--text-md)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: 0,
                }}
              >
                Capture from URL
              </h2>
              <p
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-tertiary)',
                  margin: '2px 0 0',
                }}
              >
                Fetch a live page and extract sections
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex items-center justify-center border-none bg-transparent cursor-pointer"
            style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-tertiary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* URL input */}
          <div>
            <label
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                color: 'var(--text-primary)',
                display: 'block',
                marginBottom: 6,
              }}
            >
              Page URL
            </label>
            <div className="flex" style={{ gap: 8 }}>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCapture();
                }}
                style={{
                  flex: 1,
                  height: 36,
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                  fontFamily: 'var(--font-sans)',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleCapture}
                disabled={loading || !url.trim()}
                className="flex items-center border-none cursor-pointer"
                style={{
                  height: 36,
                  padding: '0 14px',
                  gap: 6,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--accent)',
                  color: '#fff',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  fontFamily: 'var(--font-sans)',
                  opacity: loading || !url.trim() ? 0.6 : 1,
                  cursor: loading || !url.trim() ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!loading && url.trim())
                    e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent)';
                }}
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ArrowRight size={14} />
                )}
                {loading ? 'Fetching...' : 'Capture'}
              </button>
            </div>
            <p
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
                marginTop: 6,
              }}
            >
              The server will fetch the page, extract HTML structure, and return it for section selection.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                fontSize: 'var(--text-sm)',
                color: 'var(--error)',
              }}
            >
              {error}
            </div>
          )}

          {/* Result preview */}
          {result && (
            <div>
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: 8 }}
              >
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Captured HTML
                </span>
                <button
                  onClick={handleCopyHtml}
                  className="flex items-center border-none cursor-pointer"
                  style={{
                    gap: 4,
                    height: 24,
                    padding: '0 8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--surface-hover)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-sans)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-active)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                  }}
                >
                  {copied ? <Check size={11} /> : <Copy size={11} />}
                  {copied ? 'Copied' : 'Copy HTML'}
                </button>
              </div>
              <pre
                style={{
                  maxHeight: 240,
                  overflow: 'auto',
                  padding: 12,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-secondary)',
                  fontSize: 'var(--text-xs)',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                }}
              >
                {result.slice(0, 5000)}
                {result.length > 5000 && '\n\n... (truncated)'}
              </pre>
              <p
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-tertiary)',
                  marginTop: 6,
                }}
              >
                {result.length.toLocaleString()} characters captured
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
