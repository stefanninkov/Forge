import { useState, useCallback } from 'react';
import { X, Upload, Loader2, Globe, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useWebflowSites, useWebflowPages } from '@/hooks/use-webflow-push';
import { useMCPConnection } from '@/hooks/use-mcp-connection';

interface PushToWebflowDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  onPush: (params: { siteId: string; pageId: string; parentNodeId?: string }) => void;
  isPending: boolean;
  isSuccess: boolean;
  children?: React.ReactNode;
}

export function PushToWebflowDialog({
  open,
  onClose,
  title,
  description,
  onPush,
  isPending,
  isSuccess,
  children,
}: PushToWebflowDialogProps) {
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  const mcpStatus = useMCPConnection((s) => s.status);
  const { data: sites, isLoading: sitesLoading, error: sitesError } = useWebflowSites();
  const { data: pages, isLoading: pagesLoading } = useWebflowPages(selectedSiteId);

  const handlePush = useCallback(() => {
    if (!selectedSiteId || !selectedPageId) return;
    onPush({ siteId: selectedSiteId, pageId: selectedPageId });
  }, [selectedSiteId, selectedPageId, onPush]);

  const handleSiteChange = useCallback((siteId: string) => {
    setSelectedSiteId(siteId);
    setSelectedPageId(null);
  }, []);

  if (!open) return null;

  const canPush = selectedSiteId && selectedPageId && !isPending && !isSuccess;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      />

      {/* Dialog */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 520,
          maxHeight: '85vh',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 'var(--text-md)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {title}
            </h2>
            {description && (
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-tertiary)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: 4,
              color: 'var(--text-tertiary)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Success state */}
          {isSuccess && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                padding: '24px 0',
              }}
            >
              <CheckCircle size={40} color="var(--accent)" />
              <p
                style={{
                  margin: 0,
                  fontSize: 'var(--text-base)',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Pushed successfully
              </p>
            </div>
          )}

          {/* Not connected warning */}
          {mcpStatus === 'disconnected' && !isSuccess && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              <AlertCircle size={16} color="var(--error)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                    color: 'var(--error)',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  Webflow not connected
                </p>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-tertiary)',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  Add your Webflow API token in Settings → Integrations to enable push.
                </p>
              </div>
            </div>
          )}

          {/* Site selector */}
          {!isSuccess && (
            <>
              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    marginBottom: 6,
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <Globe size={14} />
                  Webflow Site
                </label>
                {sitesLoading ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    <Loader2 size={14} className="animate-spin" />
                    Loading sites...
                  </div>
                ) : sitesError ? (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 'var(--text-sm)',
                      color: 'var(--error)',
                    }}
                  >
                    Failed to load sites. Check your Webflow token.
                  </p>
                ) : (
                  <select
                    value={selectedSiteId ?? ''}
                    onChange={(e) => handleSiteChange(e.target.value)}
                    style={{
                      width: '100%',
                      height: 36,
                      padding: '0 10px',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--text-sm)',
                      fontFamily: 'var(--font-sans)',
                      outline: 'none',
                    }}
                  >
                    <option value="">Select a site...</option>
                    {sites?.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.displayName || site.shortName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Page selector */}
              {selectedSiteId && (
                <div>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 'var(--text-sm)',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: 6,
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <FileText size={14} />
                    Target Page
                  </label>
                  {pagesLoading ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 12px',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      <Loader2 size={14} className="animate-spin" />
                      Loading pages...
                    </div>
                  ) : (
                    <select
                      value={selectedPageId ?? ''}
                      onChange={(e) => setSelectedPageId(e.target.value)}
                      style={{
                        width: '100%',
                        height: 36,
                        padding: '0 10px',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: 'var(--text-sm)',
                        fontFamily: 'var(--font-sans)',
                        outline: 'none',
                      }}
                    >
                      <option value="">Select a page...</option>
                      {pages?.map((page) => (
                        <option key={page.id} value={page.id}>
                          {page.title} ({page.slug || '/'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Extra content (review panel etc) */}
              {children}
            </>
          )}
        </div>

        {/* Footer */}
        {!isSuccess && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 8,
              padding: '12px 20px',
              borderTop: '1px solid var(--border-default)',
            }}
          >
            <button
              onClick={onClose}
              style={{
                height: 36,
                padding: '0 14px',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handlePush}
              disabled={!canPush}
              className="flex items-center"
              style={{
                gap: 6,
                height: 36,
                padding: '0 16px',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                backgroundColor: canPush ? 'var(--accent)' : 'var(--surface-hover)',
                color: canPush ? '#fff' : 'var(--text-tertiary)',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                cursor: canPush ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Pushing...
                </>
              ) : (
                <>
                  <Upload size={14} />
                  Push to Webflow
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
