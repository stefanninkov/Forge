import { useState } from 'react';
import { Plus, FolderOpen } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { usePageTitle } from '@/hooks/use-page-title';
import { ProjectCard } from '@/components/shared/project-card';
import { CreateProjectDialog } from '@/components/shared/create-project-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { WelcomeDialog } from '@/components/shared/welcome-dialog';
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '@/hooks/use-projects';
import type { Project } from '@/types/project';

export default function DashboardPage() {
  usePageTitle('Dashboard');
  const { data: projects, isLoading, error } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [createOpen, setCreateOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

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
        {isLoading && (
          <div
            className="flex items-center justify-center"
            style={{
              height: 300,
              opacity: 0,
              animation: 'fadeIn 200ms ease-out 200ms forwards',
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                border: '2px solid var(--border-default)',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
          </div>
        )}

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
            className="flex flex-col items-center justify-center"
            style={{
              height: 400,
              animation: 'fadeIn 200ms ease-out',
            }}
          >
            <FolderOpen
              size={48}
              style={{ color: 'var(--text-tertiary)', marginBottom: 16 }}
              strokeWidth={1}
            />
            <p
              style={{
                fontSize: 'var(--text-base)',
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginBottom: 4,
              }}
            >
              No projects yet
            </p>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                maxWidth: 320,
                textAlign: 'center',
                marginBottom: 20,
              }}
            >
              Create your first project to get started with Forge.
            </p>
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
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent)';
              }}
            >
              <Plus size={16} />
              <span>New project</span>
            </button>
          </div>
        )}

        {/* Projects grid */}
        {!isLoading && !error && projects && projects.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 16,
              animation: 'fadeIn 200ms ease-out',
            }}
          >
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={setEditProject}
                onDelete={setDeleteTarget}
              />
            ))}
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

      {/* First-run welcome */}
      <WelcomeDialog onCreateProject={() => setCreateOpen(true)} />
    </>
  );
}
