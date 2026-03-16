import { useState, useRef, useEffect, useCallback } from 'react';
import { Folder, FolderPlus, Pencil, Trash2, Check, X, LayoutGrid } from 'lucide-react';

export interface TemplateFolder {
  id: string;
  name: string;
  count: number;
  color?: string;
}

interface TemplateFoldersProps {
  folders: TemplateFolder[];
  activeFolder: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onCreateFolder: (name: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  totalCount: number;
}

export function TemplateFolders({
  folders,
  activeFolder,
  onFolderSelect,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  totalCount,
}: TemplateFoldersProps) {
  const [creatingNew, setCreatingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const newInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creatingNew && newInputRef.current) {
      newInputRef.current.focus();
    }
  }, [creatingNew]);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const handleCreateSubmit = useCallback(() => {
    const trimmed = newName.trim();
    if (trimmed) {
      onCreateFolder(trimmed);
    }
    setNewName('');
    setCreatingNew(false);
  }, [newName, onCreateFolder]);

  const handleRenameSubmit = useCallback(() => {
    const trimmed = renameValue.trim();
    if (trimmed && renamingId) {
      onRenameFolder(renamingId, trimmed);
    }
    setRenamingId(null);
    setRenameValue('');
  }, [renameValue, renamingId, onRenameFolder]);

  const startRename = useCallback((folder: TemplateFolder) => {
    setRenamingId(folder.id);
    setRenameValue(folder.name);
  }, []);

  const rowStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    height: 32,
    padding: '0 10px',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    fontSize: 'var(--text-xs)',
    fontWeight: isActive ? 500 : 400,
    fontFamily: 'var(--font-sans)',
    color: isActive ? 'var(--accent)' : 'var(--text-primary)',
    backgroundColor: isActive ? 'var(--accent-subtle)' : 'transparent',
    transition: 'background-color var(--duration-fast)',
    userSelect: 'none' as const,
  });

  const countBadgeStyle: React.CSSProperties = {
    marginLeft: 'auto',
    fontSize: 'var(--text-xs)',
    color: 'var(--text-tertiary)',
    fontVariantNumeric: 'tabular-nums',
    minWidth: 16,
    textAlign: 'right',
  };

  const iconBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    padding: 0,
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'transparent',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'color var(--duration-fast), background-color var(--duration-fast)',
  };

  return (
    <div
      style={{
        width: 200,
        minWidth: 200,
        borderRight: '1px solid var(--border-default)',
        paddingRight: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {/* Section label */}
      <div
        style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 500,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          padding: '0 10px 6px',
          fontFamily: 'var(--font-sans)',
        }}
      >
        Folders
      </div>

      {/* All Templates */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onFolderSelect(null)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onFolderSelect(null);
        }}
        style={rowStyle(activeFolder === null)}
        onMouseEnter={(e) => {
          if (activeFolder !== null) {
            e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor =
            activeFolder === null ? 'var(--accent-subtle)' : 'transparent';
        }}
      >
        <LayoutGrid size={14} style={{ flexShrink: 0, opacity: 0.7 }} />
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          All Templates
        </span>
        <span style={countBadgeStyle}>{totalCount}</span>
      </div>

      {/* Folder list */}
      {folders.map((folder) => {
        const isActive = activeFolder === folder.id;
        const isRenaming = renamingId === folder.id;
        const isHovered = hoveredId === folder.id;

        if (isRenaming) {
          return (
            <div key={folder.id} style={{ ...rowStyle(false), gap: 4, cursor: 'default' }}>
              <Folder size={14} style={{ flexShrink: 0, opacity: 0.5, color: folder.color }} />
              <input
                ref={renameInputRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit();
                  if (e.key === 'Escape') {
                    setRenamingId(null);
                    setRenameValue('');
                  }
                }}
                onBlur={handleRenameSubmit}
                style={{
                  flex: 1,
                  height: 22,
                  padding: '0 6px',
                  border: '1px solid var(--border-active)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--surface-default)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-xs)',
                  fontFamily: 'var(--font-sans)',
                  outline: 'none',
                  minWidth: 0,
                }}
              />
              <button
                onClick={handleRenameSubmit}
                style={{ ...iconBtnStyle, color: 'var(--accent)' }}
                title="Confirm"
              >
                <Check size={12} />
              </button>
              <button
                onClick={() => {
                  setRenamingId(null);
                  setRenameValue('');
                }}
                style={iconBtnStyle}
                title="Cancel"
              >
                <X size={12} />
              </button>
            </div>
          );
        }

        return (
          <div
            key={folder.id}
            role="button"
            tabIndex={0}
            onClick={() => onFolderSelect(folder.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onFolderSelect(folder.id);
            }}
            onMouseEnter={(e) => {
              setHoveredId(folder.id);
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
              }
            }}
            onMouseLeave={(e) => {
              setHoveredId(null);
              e.currentTarget.style.backgroundColor = isActive
                ? 'var(--accent-subtle)'
                : 'transparent';
            }}
            style={rowStyle(isActive)}
          >
            <Folder
              size={14}
              style={{ flexShrink: 0, opacity: 0.5, color: folder.color }}
            />
            <span
              style={{
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {folder.name}
            </span>

            {isHovered && !isActive ? (
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto' }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => startRename(folder)}
                  style={iconBtnStyle}
                  title="Rename folder"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-tertiary)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Pencil size={11} />
                </button>
                <button
                  onClick={() => onDeleteFolder(folder.id)}
                  style={iconBtnStyle}
                  title="Delete folder"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--status-error)';
                    e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-tertiary)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ) : (
              <span style={countBadgeStyle}>{folder.count}</span>
            )}

            {isActive && (
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 2 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => startRename(folder)}
                  style={{ ...iconBtnStyle, color: 'var(--accent)' }}
                  title="Rename folder"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Pencil size={11} />
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* New folder input */}
      {creatingNew ? (
        <div style={{ ...rowStyle(false), gap: 4, cursor: 'default' }}>
          <FolderPlus size={14} style={{ flexShrink: 0, opacity: 0.5 }} />
          <input
            ref={newInputRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Folder name"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateSubmit();
              if (e.key === 'Escape') {
                setCreatingNew(false);
                setNewName('');
              }
            }}
            onBlur={() => {
              if (!newName.trim()) {
                setCreatingNew(false);
                setNewName('');
              } else {
                handleCreateSubmit();
              }
            }}
            style={{
              flex: 1,
              height: 22,
              padding: '0 6px',
              border: '1px solid var(--border-active)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--surface-default)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-sans)',
              outline: 'none',
              minWidth: 0,
            }}
          />
          <button
            onClick={handleCreateSubmit}
            style={{ ...iconBtnStyle, color: 'var(--accent)' }}
            title="Create"
          >
            <Check size={12} />
          </button>
          <button
            onClick={() => {
              setCreatingNew(false);
              setNewName('');
            }}
            style={iconBtnStyle}
            title="Cancel"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setCreatingNew(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 32,
            padding: '0 10px',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'transparent',
            color: 'var(--text-tertiary)',
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer',
            width: '100%',
            transition: 'color var(--duration-fast), background-color var(--duration-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-tertiary)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <FolderPlus size={14} style={{ opacity: 0.6 }} />
          New Folder
        </button>
      )}
    </div>
  );
}
