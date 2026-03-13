import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Pencil, Trash2, FolderOpen, Settings2, Star } from 'lucide-react';
import { useIsFavorited, useToggleFavorite } from '@/hooks/use-favorites';
import type { Project } from '@/types/project';

export interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: isFavorited } = useIsFavorited('project', project.id);
  const toggleFavorite = useToggleFavorite();

  const formattedDate = new Date(project.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      onClick={() => navigate(`/setup?project=${project.id}`)}
      style={{
        position: 'relative',
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
        transition: 'border-color var(--duration-fast), background-color var(--duration-fast)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-strong)';
        e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-default)';
        e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
        setMenuOpen(false);
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center" style={{ gap: 10 }}>
          <div
            className="flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              backgroundColor: 'var(--accent-subtle)',
              borderRadius: 'var(--radius-md)',
              flexShrink: 0,
            }}
          >
            <FolderOpen size={16} style={{ color: 'var(--accent-text)' }} />
          </div>
          <div>
            <h3
              style={{
                fontSize: 'var(--text-base)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                lineHeight: 'var(--leading-tight)',
                margin: 0,
              }}
            >
              {project.name}
            </h3>
            {project.description && (
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-secondary)',
                  margin: '2px 0 0',
                  lineHeight: 'var(--leading-normal)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 220,
                }}
              >
                {project.description}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center" style={{ gap: 2 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite.mutate({ type: 'project', targetId: project.id });
            }}
            className="flex items-center justify-center border-none bg-transparent cursor-pointer"
            style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-md)',
              color: isFavorited ? '#f59e0b' : 'var(--text-tertiary)',
              transition: 'color var(--duration-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-active)';
              if (!isFavorited) e.currentTarget.style.color = '#f59e0b';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              if (!isFavorited) e.currentTarget.style.color = 'var(--text-tertiary)';
            }}
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star size={14} fill={isFavorited ? '#f59e0b' : 'none'} />
          </button>

          <div style={{ position: 'relative' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="flex items-center justify-center border-none bg-transparent cursor-pointer"
            style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-tertiary)',
              transition: 'color var(--duration-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-active)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-tertiary)';
            }}
            aria-label="Project options"
          >
            <MoreHorizontal size={16} />
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 32,
                right: 0,
                width: 160,
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-elevated)',
                zIndex: 50,
                overflow: 'hidden',
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  navigate(`/setup?project=${project.id}`);
                }}
                className="flex items-center w-full border-none bg-transparent cursor-pointer"
                style={{
                  height: 36,
                  padding: '0 12px',
                  gap: 8,
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-sans)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <Settings2 size={14} />
                <span>Setup</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onEdit(project);
                }}
                className="flex items-center w-full border-none bg-transparent cursor-pointer"
                style={{
                  height: 36,
                  padding: '0 12px',
                  gap: 8,
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-sans)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <Pencil size={14} />
                <span>Edit</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDelete(project);
                }}
                className="flex items-center w-full border-none bg-transparent cursor-pointer"
                style={{
                  height: 36,
                  padding: '0 12px',
                  gap: 8,
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  color: 'var(--error)',
                  fontFamily: 'var(--font-sans)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: '1px solid var(--border-subtle)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
        }}
      >
        Created {formattedDate}
      </div>
    </div>
  );
}
