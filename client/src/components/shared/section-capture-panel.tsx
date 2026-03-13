import { useState, useCallback } from 'react';
import {
  Camera, FolderPlus, Folder, ChevronRight, ChevronDown,
  MoreHorizontal, Trash2, Edit2, Copy, Layers, ArrowUpRight,
  Search, Grid3X3, List, Tag,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────

export interface CapturedSection {
  id: string;
  name: string;
  folderId?: string;
  thumbnail?: string;
  html: string;
  css: string;
  attributes: Record<string, string>;
  elementCount: number;
  capturedFrom: string; // site name
  capturedAt: string; // ISO date
  tags: string[];
}

export interface SectionFolder {
  id: string;
  name: string;
  parentId?: string;
  sectionCount: number;
}

export interface SectionCapturePanelProps {
  sections: CapturedSection[];
  folders: SectionFolder[];
  isCapturing?: boolean;
  onCapture: () => void;
  onCreateFolder: (name: string, parentId?: string) => void;
  onDeleteSection: (id: string) => void;
  onRenameSection: (id: string, name: string) => void;
  onDuplicateSection: (id: string) => void;
  onPushToWebflow: (id: string) => void;
  onMoveToFolder: (sectionId: string, folderId: string) => void;
  onSelectSection: (section: CapturedSection) => void;
}

// ─── Component ───────────────────────────────────────────────────

export function SectionCapturePanel({
  sections,
  folders,
  isCapturing,
  onCapture,
  onCreateFolder,
  onDeleteSection,
  onRenameSection,
  onDuplicateSection,
  onPushToWebflow,
  onMoveToFolder,
  onSelectSection,
}: SectionCapturePanelProps) {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
    setSelectedFolder(folderId);
  }, []);

  const filteredSections = sections.filter((s) => {
    const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesFolder = selectedFolder ? s.folderId === selectedFolder : true;
    return matchesSearch && matchesFolder;
  });

  const handleCreateFolder = useCallback(() => {
    if (!newFolderName.trim()) return;
    onCreateFolder(newFolderName.trim(), selectedFolder || undefined);
    setNewFolderName('');
    setShowNewFolder(false);
  }, [newFolderName, onCreateFolder, selectedFolder]);

  const handleContextMenu = useCallback((e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ id: sectionId, x: e.clientX, y: e.clientY });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
          Section Capture
        </span>
        <button
          onClick={onCapture}
          disabled={isCapturing}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            height: 28, padding: '0 10px',
            border: 'none', borderRadius: 4,
            backgroundColor: 'var(--accent)',
            color: 'var(--text-on-accent)',
            fontSize: 'var(--text-xs)', fontWeight: 500,
            cursor: isCapturing ? 'wait' : 'pointer',
            fontFamily: 'var(--font-sans)',
            opacity: isCapturing ? 0.7 : 1,
          }}
        >
          <Camera size={12} />
          {isCapturing ? 'Capturing...' : 'Capture'}
        </button>
      </div>

      {/* Search & View Toggle */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <div
          style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 6,
            height: 28, padding: '0 8px',
            border: '1px solid var(--border-default)', borderRadius: 4,
            backgroundColor: 'transparent',
          }}
        >
          <Search size={12} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sections..."
            style={{
              flex: 1, border: 'none', outline: 'none',
              backgroundColor: 'transparent',
              fontSize: 'var(--text-xs)', color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
            }}
          />
        </div>
        <div style={{ display: 'flex', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border-default)' }}>
          {([['grid', Grid3X3], ['list', List]] as const).map(([v, Icon]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                width: 28, height: 28, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                border: 'none', cursor: 'pointer',
                backgroundColor: view === v ? 'var(--surface-hover)' : 'transparent',
                color: view === v ? 'var(--text-primary)' : 'var(--text-tertiary)',
              }}
            >
              <Icon size={12} />
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Folder Sidebar */}
        <div
          style={{
            width: 160, flexShrink: 0,
            borderRight: '1px solid var(--border-default)',
            overflowY: 'auto', padding: 8,
          }}
        >
          <button
            onClick={() => setSelectedFolder(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              width: '100%', padding: '4px 8px', height: 28,
              border: 'none', borderRadius: 4,
              backgroundColor: selectedFolder === null ? 'var(--surface-hover)' : 'transparent',
              cursor: 'pointer',
              fontSize: 'var(--text-xs)', fontWeight: 500,
              color: selectedFolder === null ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <Layers size={12} />
            <span>All Sections</span>
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
              {sections.length}
            </span>
          </button>

          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => toggleFolder(folder.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                width: '100%', padding: '4px 8px', height: 28,
                border: 'none', borderRadius: 4,
                backgroundColor: selectedFolder === folder.id ? 'var(--surface-hover)' : 'transparent',
                cursor: 'pointer',
                fontSize: 'var(--text-xs)',
                color: selectedFolder === folder.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <Folder size={12} />
              <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {folder.name}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
                {folder.sectionCount}
              </span>
            </button>
          ))}

          {/* New Folder */}
          {showNewFolder ? (
            <div style={{ display: 'flex', gap: 4, padding: '4px 0' }}>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') setShowNewFolder(false); }}
                placeholder="Folder name"
                autoFocus
                style={{
                  flex: 1, height: 24, padding: '0 6px',
                  border: '1px solid var(--accent)', borderRadius: 3,
                  fontSize: 'var(--text-xs)', color: 'var(--text-primary)',
                  backgroundColor: 'transparent', fontFamily: 'var(--font-sans)',
                  outline: 'none',
                }}
              />
            </div>
          ) : (
            <button
              onClick={() => setShowNewFolder(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                width: '100%', padding: '4px 8px', height: 28,
                border: 'none', borderRadius: 4,
                backgroundColor: 'transparent', cursor: 'pointer',
                fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <FolderPlus size={12} />
              <span>New Folder</span>
            </button>
          )}
        </div>

        {/* Section Grid/List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {filteredSections.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <Camera size={24} style={{ color: 'var(--text-tertiary)', margin: '0 auto 8px' }} />
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                No captured sections yet.
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 4 }}>
                Use Capture to save sections from your Webflow site.
              </div>
            </div>
          ) : view === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {filteredSections.map((section) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  onSelect={() => onSelectSection(section)}
                  onContextMenu={(e) => handleContextMenu(e, section.id)}
                  onPush={() => onPushToWebflow(section.id)}
                />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filteredSections.map((section) => (
                <SectionListItem
                  key={section.id}
                  section={section}
                  onSelect={() => onSelectSection(section)}
                  onContextMenu={(e) => handleContextMenu(e, section.id)}
                  onPush={() => onPushToWebflow(section.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            onClick={() => setContextMenu(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
          />
          <div
            style={{
              position: 'fixed', left: contextMenu.x, top: contextMenu.y,
              width: 160, zIndex: 9999,
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 6, boxShadow: 'var(--shadow-elevated)',
              padding: 4, animation: 'fadeIn 100ms ease-out',
            }}
          >
            {[
              { icon: Edit2, label: 'Rename', action: () => { const name = prompt('New name:'); if (name) onRenameSection(contextMenu.id, name); setContextMenu(null); } },
              { icon: Copy, label: 'Duplicate', action: () => { onDuplicateSection(contextMenu.id); setContextMenu(null); } },
              { icon: ArrowUpRight, label: 'Push to Webflow', action: () => { onPushToWebflow(contextMenu.id); setContextMenu(null); } },
              { icon: Trash2, label: 'Delete', action: () => { onDeleteSection(contextMenu.id); setContextMenu(null); }, danger: true },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', height: 28, padding: '0 8px',
                  border: 'none', borderRadius: 4,
                  backgroundColor: 'transparent', cursor: 'pointer',
                  fontSize: 'var(--text-xs)',
                  color: (item as { danger?: boolean }).danger ? 'var(--status-error)' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <item.icon size={12} />
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────

interface SectionCardProps {
  section: CapturedSection;
  onSelect: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onPush: () => void;
}

function SectionCard({ section, onSelect, onContextMenu, onPush }: SectionCardProps) {
  return (
    <div
      onClick={onSelect}
      onContextMenu={onContextMenu}
      style={{
        borderRadius: 6, overflow: 'hidden',
        border: '1px solid var(--border-default)',
        cursor: 'pointer',
        transition: 'border-color var(--duration-fast)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
    >
      {/* Thumbnail */}
      <div
        style={{
          height: 100, backgroundColor: 'var(--bg-inset)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {section.thumbnail ? (
          <img src={section.thumbnail} alt={section.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Layers size={20} style={{ color: 'var(--text-tertiary)' }} />
        )}
      </div>
      {/* Info */}
      <div style={{ padding: '8px 10px' }}>
        <div
          style={{
            fontSize: 'var(--text-xs)', fontWeight: 500,
            color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >
          {section.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
            {section.elementCount} elements
          </span>
          {section.tags.length > 0 && (
            <>
              <span style={{ color: 'var(--text-tertiary)' }}>·</span>
              <Tag size={9} style={{ color: 'var(--text-tertiary)' }} />
              <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>
                {section.tags[0]}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface SectionListItemProps {
  section: CapturedSection;
  onSelect: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onPush: () => void;
}

function SectionListItem({ section, onSelect, onContextMenu, onPush }: SectionListItemProps) {
  return (
    <div
      onClick={onSelect}
      onContextMenu={onContextMenu}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '6px 10px', borderRadius: 4,
        cursor: 'pointer',
        transition: 'background-color var(--duration-fast)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      <div
        style={{
          width: 40, height: 28, borderRadius: 3,
          backgroundColor: 'var(--bg-inset)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0,
        }}
      >
        {section.thumbnail ? (
          <img src={section.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Layers size={12} style={{ color: 'var(--text-tertiary)' }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {section.name}
        </div>
      </div>
      <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', flexShrink: 0 }}>
        {section.elementCount} el
      </span>
      <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', flexShrink: 0 }}>
        {new Date(section.capturedAt).toLocaleDateString()}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); onPush(); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          height: 22, padding: '0 6px', border: '1px solid var(--border-default)',
          borderRadius: 3, backgroundColor: 'transparent',
          fontSize: 9, color: 'var(--text-tertiary)', cursor: 'pointer',
          fontFamily: 'var(--font-sans)', flexShrink: 0,
        }}
      >
        <ArrowUpRight size={10} />
        Push
      </button>
    </div>
  );
}
