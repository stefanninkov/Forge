import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, LayoutGrid, Sparkles, Layers, ListChecks, ArrowUpDown } from 'lucide-react';
import { useRecentProjects } from '@/hooks/use-recent-projects';
import { SkeletonProjectGrid } from '@/components/shared/skeleton';
import { PageHeader } from '@/components/layout/page-header';
import { usePageTitle } from '@/hooks/use-page-title';
import { ProjectCard } from '@/components/shared/project-card';
import { CreateProjectDialog } from '@/components/shared/create-project-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject, useDuplicateProject } from '@/hooks/use-projects';
import type { Project } from '@/types/project';

const QUICK_ACTIONS = [
  { label: 'Browse Templates', icon: LayoutGrid, path: '/templates' },
  { label: 'Animation Library', icon: Sparkles, path: '/animations' },
] as const;

// Note: "New Project" is already the primary CTA button in the header

export default function DashboardPage() {
  usePageTitle('Dashboard');
  const navigate = useNavigate();
  const { data: projects, isLoading, error } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const duplicateProject = useDuplicateProject();

  const [createOpen, setCreateOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'created'>('recent');
  const { recentIds } = useRecentProjects();

  const sortedProjects = useMemo(() => {
    if (!projects) return [];
    const list = [...projects];
    switch (sortBy) {
      case 'name':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'created':
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'recent': {
        return list.sort((a, b) => {
          const aIdx = recentIds.indexOf(a.id);
          const bIdx = recentIds.indexOf(b.id);
          if (aIdx === -1 && bIdx === -1) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          if (aIdx === -1) return 1;
          if (bIdx === -1) return -1;
          return aIdx - bIdx;
        });
      }
      default:
        return list;
    }
  }, [projects, sortBy, recentIds]);

  function handleCreate(data: { name: string; description?: string }) {
    createProject.mutate(data, {
      onSuccess: () => setCreateOpen(false),
    });
  }

  function handleEdit(data: { name: string; description?: string }) {
    if (!editProject) return;
    updateProject.mutate(
      { id: editProject.id, ...data },
      { onSuccess: () => setEditProject(null) },
    );
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteProject.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Your Webflow projects."
        actions={
          <button
            onClick={() => setCreateOpen(true)}
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
              transition: 'background-color var(--duration-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.98)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Plus size={16} />
            <span>New project</span>
          </button>
        }
      />

      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '24px',
        }}
      >
        {/* Loading state */}
        {isLoading && <SkeletonProjectGrid count={6} />}

        {/* Error state */}
        {error && (
          <div
            className="flex items-center justify-center"
            style={{
              height: 300,
              color: 'var(--error)',
              fontSize: 'var(--text-sm)',
            }}
          >
            Failed to load projects. Check your connection and try again.
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && projects && projects.length === 0 && (
          <div
            style={{
              animation: 'fadeIn 200ms ease-out',
              maxWidth: 520,
              margin: '48px auto 0',
            }}
          >
            <div
              className="flex flex-col items-center"
              style={{
                textAlign: 'center',
                marginBottom: 32,
              }}
            >
              <FolderOpen
                size={40}
                style={{ color: 'var(--text-tertiary)', marginBottom: 16 }}
                strokeWidth={1.5}
              />
              <p
                style={{
                  fontSize: 'var(--text-base)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: 6,
                }}
              >
                No projects yet
              </p>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-secondary)',
                  lineHeight: 'var(--leading-normal)',
                  maxWidth: 360,
                }}
              >
                Projects group everything for a Webflow site — setup checklists, templates, animations, and audits.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                marginBottom: 24,
              }}
            >
              {[
                { icon: Layers, text: 'Create a project and link it to a Webflow site' },
                { icon: ListChecks, text: 'Run the setup wizard to configure settings' },
                { icon: Sparkles, text: 'Add animations and push to Webflow' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-secondary)',
                    }}
                  >
                    <Icon
                      size={15}
                      style={{ color: 'var(--accent-text)', flexShrink: 0 }}
                    />
                    <span
                      style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {item.text}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => setCreateOpen(true)}
                className="flex items-center border-none cursor-pointer"
                style={{
                  height: 36,
                  padding: '0 16px',
                  gap: 6,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--accent)',
                  color: '#fff',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  fontFamily: 'var(--font-sans)',
                  transition: 'background-color var(--duration-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent)';
                }}
              >
                <Plus size={16} />
                <span>Create project</span>
              </button>
            </div>
          </div>
        )}

        {/* Projects grid */}
        {!isLoading && !error && projects && projects.length > 0 && (
          <>
            {/* Sort controls */}
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <span
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-tertiary)',
                }}
              >
                {projects.length} project{projects.length !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center" style={{ gap: 4 }}>
                <ArrowUpDown size={12} style={{ color: 'var(--text-tertiary)' }} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'recent' | 'name' | 'created')}
                  style={{
                    height: 28,
                    padding: '0 8px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--text-xs)',
                    fontFamily: 'var(--font-sans)',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="recent">Recently viewed</option>
                  <option value="created">Date created</option>
                  <option value="name">Name</option>
                </select>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 16,
                animation: 'fadeIn 200ms ease-out',
              }}
            >
              {sortedProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={setEditProject}
                  onDelete={setDeleteTarget}
                  onDuplicate={(p) => duplicateProject.mutate(p.id)}
                />
              ))}
            </div>
          </>
        )}

        {/* Quick Actions */}
        {!isLoading && !error && projects && projects.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h3
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 12,
              }}
            >
              Quick Actions
            </h3>
            <div className="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.path}
                    onClick={() => navigate(action.path)}
                    className="flex items-center border-none cursor-pointer"
                    style={{
                      gap: 6,
                      height: 36,
                      padding: '0 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--surface-raised)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 500,
                      fontFamily: 'var(--font-sans)',
                      transition: 'background-color var(--duration-fast)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface-raised)';
                    }}
                  >
                    <Icon size={14} style={{ color: 'var(--text-tertiary)' }} />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Create dialog */}
      <CreateProjectDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        loading={createProject.isPending}
      />

      {/* Edit dialog */}
      <CreateProjectDialog
        open={editProject !== null}
        onClose={() => setEditProject(null)}
        onSubmit={handleEdit}
        loading={updateProject.isPending}
        initial={
          editProject
            ? { name: editProject.name, description: editProject.description ?? undefined }
            : undefined
        }
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete project"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteProject.isPending}
        destructive
      />

    </>
  );
}
