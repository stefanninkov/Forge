import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Pencil, Trash2, FolderOpen, Copy } from 'lucide-react';
import type { Project } from '@/types/project';

export interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onDuplicate?: (project: Project) => void;
}

/** Compute which workflow steps are complete for progress dots */
function getCompletedSteps(project: Project): boolean[] {
  const step1 = !!(project.figmaTokenId && project.webflowTokenId && project.webflowSiteId);
  const step2 = !!project.figmaFileKey;
  const step3 = step2; // structure editing — same proxy for now
  const step4 = false; // styling is optional
  const step5 = false; // push tracking TBD
  return [step1, step2, step3, step4, step5];
}

/** Smart-route to the next incomplete step */
function getSmartRoute(project: Project): string {
  const steps = getCompletedSteps(project);
  if (!steps[0]) return `/setup?project=${project.id}`;
  if (!steps[1]) return `/figma?project=${project.id}`;
  // Default to setup for now — will change to /project/:id/... routes in Section 6
  return `/setup?project=${project.id}`;
}

export function ProjectCard({ project, onEdit, onDelete, onDuplicate }: ProjectCardProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const completedSteps = getCompletedSteps(project);

  const formattedDate = new Date(project.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      onClick={() => navigate(getSmartRoute(project))}
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

          {menuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 32,
                right: 0,
                width: 140,
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-elevated)',
                zIndex: 50,
                overflow: 'hidden',
              }}
            >
              <MenuButton
                icon={Pencil}
                label="Edit"
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(project); }}
              />
              <MenuButton
                icon={Copy}
                label="Duplicate"
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDuplicate?.(project); }}
              />
              <div style={{ height: 1, backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />
              <MenuButton
                icon={Trash2}
                label="Delete"
                danger
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(project); }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer with progress dots */}
      <div
        className="flex items-center justify-between"
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: '1px solid var(--border-subtle)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
        }}
      >
        <span>Created {formattedDate}</span>

        {/* Workflow progress dots */}
        <div className="flex items-center" style={{ gap: 4 }}>
          {completedSteps.map((done, i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: done ? 'var(--accent)' : 'var(--border-default)',
                transition: 'background-color var(--duration-fast)',
              }}
              title={['Setup', 'Import', 'Structure', 'Style', 'Push'][i]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MenuButton({
  icon: Icon,
  label,
  danger,
  onClick,
}: {
  icon: typeof Pencil;
  label: string;
  danger?: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center w-full border-none bg-transparent cursor-pointer"
      style={{
        height: 36,
        padding: '0 12px',
        gap: 8,
        fontSize: 'var(--text-sm)',
        fontWeight: 500,
        color: danger ? 'var(--error)' : 'var(--text-secondary)',
        fontFamily: 'var(--font-sans)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
        if (!danger) e.currentTarget.style.color = 'var(--text-primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        if (!danger) e.currentTarget.style.color = 'var(--text-secondary)';
      }}
    >
      <Icon size={14} />
      <span>{label}</span>
    </button>
  );
}
