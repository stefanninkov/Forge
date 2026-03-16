import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, RotateCcw, Save, Upload, Trash2 } from 'lucide-react';
import { SkeletonSetupPage } from '@/components/shared/skeleton';
import { PageHeader } from '@/components/layout/page-header';
import { usePageTitle } from '@/hooks/use-page-title';
import { SetupCategorySection } from '@/components/modules/setup/setup-category-section';
import { SaveProfileDialog } from '@/components/modules/setup/save-profile-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useProjects } from '@/hooks/use-projects';
import {
  useSetupProgress,
  useUpdateSetupItem,
  useResetSetupProgress,
  useSetupProfiles,
  useCreateProfile,
  useDeleteProfile,
  useApplyProfile,
} from '@/hooks/use-setup';

export default function SetupPage() {
  usePageTitle('Setup');
  const [searchParams] = useSearchParams();
  const queryProjectId = searchParams.get('project');
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [saveProfileOpen, setSaveProfileOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // Priority: manually selected > query param > first project
  const projectId = selectedProjectId ?? queryProjectId ?? projects?.[0]?.id ?? null;
  const selectedProject = projects?.find((p) => p.id === projectId);

  const { data: setupData, isLoading: setupLoading, error: setupError } = useSetupProgress(projectId);
  const updateItem = useUpdateSetupItem(projectId);
  const resetProgress = useResetSetupProgress(projectId);
  const { data: profiles } = useSetupProfiles();
  const createProfile = useCreateProfile();
  const deleteProfile = useDeleteProfile();
  const applyProfile = useApplyProfile(projectId);

  function handleToggleItem(itemKey: string, status: 'COMPLETED' | 'PENDING') {
    updateItem.mutate({ itemKey, status });
  }

  function handleReset() {
    resetProgress.mutate(undefined, {
      onSuccess: () => setResetConfirmOpen(false),
    });
  }

  function handleSaveProfile(name: string, config: Record<string, boolean>) {
    createProfile.mutate(
      { name, checklistConfig: config },
      { onSuccess: () => setSaveProfileOpen(false) },
    );
  }

  function handleApplyProfile(pId: string) {
    applyProfile.mutate(pId);
    setProfileDropdownOpen(false);
  }

  const progress = setupData?.progress;

  return (
    <>
      <PageHeader
        title="Project Setup"
        description={selectedProject ? `Configuring ${selectedProject.name}` : 'Select a project to configure.'}
        actions={
          <div className="flex items-center" style={{ gap: 8 }}>
            {/* Profile dropdown */}
            {projectId && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => {
                    setProfileDropdownOpen(!profileDropdownOpen);
                    setProjectDropdownOpen(false);
                  }}
                  className="flex items-center border-none cursor-pointer"
                  style={{
                    height: 36,
                    padding: '0 12px',
                    gap: 6,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                    fontFamily: 'var(--font-sans)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Upload size={14} />
                  <span>Profiles</span>
                  <ChevronDown size={14} />
                </button>

                {profileDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0"
                      style={{ zIndex: 40 }}
                      onClick={() => setProfileDropdownOpen(false)}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        right: 0,
                        width: 240,
                        backgroundColor: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: 'var(--shadow-elevated)',
                        padding: 4,
                        zIndex: 50,
                        animation: 'fadeIn 100ms ease-out',
                      }}
                    >
                      {/* Save current */}
                      <button
                        onClick={() => {
                          setSaveProfileOpen(true);
                          setProfileDropdownOpen(false);
                        }}
                        className="flex items-center w-full border-none bg-transparent cursor-pointer"
                        style={{
                          height: 34,
                          padding: '0 10px',
                          gap: 8,
                          borderRadius: 'var(--radius-md)',
                          fontSize: 'var(--text-sm)',
                          fontWeight: 500,
                          color: 'var(--text-primary)',
                          fontFamily: 'var(--font-sans)',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Save size={14} style={{ color: 'var(--text-tertiary)' }} />
                        Save current as profile
                      </button>

                      {/* Divider + saved profiles */}
                      {profiles && profiles.length > 0 && (
                        <>
                          <div
                            style={{
                              height: 1,
                              backgroundColor: 'var(--border-subtle)',
                              margin: '4px 0',
                            }}
                          />
                          <div
                            style={{
                              padding: '4px 10px 2px',
                              fontSize: 'var(--text-xs)',
                              fontWeight: 500,
                              color: 'var(--text-tertiary)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}
                          >
                            Saved profiles
                          </div>
                          {profiles.map((profile) => (
                            <div
                              key={profile.id}
                              className="flex items-center"
                              style={{
                                padding: '0 4px 0 10px',
                                height: 34,
                                borderRadius: 'var(--radius-md)',
                                gap: 6,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <button
                                onClick={() => handleApplyProfile(profile.id)}
                                className="flex-1 border-none bg-transparent cursor-pointer"
                                style={{
                                  padding: 0,
                                  fontSize: 'var(--text-sm)',
                                  fontWeight: 500,
                                  color: 'var(--text-primary)',
                                  fontFamily: 'var(--font-sans)',
                                  textAlign: 'left',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {profile.name}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteProfile.mutate(profile.id);
                                }}
                                className="flex items-center justify-center border-none bg-transparent cursor-pointer shrink-0"
                                style={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: 'var(--radius-sm)',
                                  color: 'var(--text-tertiary)',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = 'var(--error)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = 'var(--text-tertiary)';
                                }}
                                aria-label={`Delete profile "${profile.name}"`}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Reset button */}
            {projectId && (
              <button
                onClick={() => setResetConfirmOpen(true)}
                className="flex items-center border-none cursor-pointer"
                style={{
                  height: 36,
                  padding: '0 12px',
                  gap: 6,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
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
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            )}
          </div>
        }
      />

      <div
        style={{
          maxWidth: 800,
          margin: '0 auto',
          padding: '24px',
        }}
      >
        {/* Project selector */}
        <div style={{ marginBottom: 24, position: 'relative' }}>
          <label
            style={{
              display: 'block',
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 6,
            }}
          >
            Project
          </label>
          <button
            onClick={() => {
              setProjectDropdownOpen(!projectDropdownOpen);
              setProfileDropdownOpen(false);
            }}
            disabled={projectsLoading}
            className="flex items-center justify-between w-full border-none cursor-pointer"
            style={{
              height: 40,
              padding: '0 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-primary)',
              color: selectedProject ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              textAlign: 'left',
            }}
          >
            <span>{selectedProject?.name ?? (projectsLoading ? 'Loading...' : 'Select a project')}</span>
            <ChevronDown size={14} style={{ color: 'var(--text-tertiary)' }} />
          </button>

          {projectDropdownOpen && projects && (
            <>
              <div
                className="fixed inset-0"
                style={{ zIndex: 40 }}
                onClick={() => setProjectDropdownOpen(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  right: 0,
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-elevated)',
                  padding: 4,
                  zIndex: 50,
                  maxHeight: 240,
                  overflowY: 'auto',
                  animation: 'fadeIn 100ms ease-out',
                }}
              >
                {projects.length === 0 ? (
                  <div
                    style={{
                      padding: '12px',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-tertiary)',
                      textAlign: 'center',
                    }}
                  >
                    No projects. Create one from the Dashboard.
                  </div>
                ) : (
                  projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        setProjectDropdownOpen(false);
                      }}
                      className="flex items-center w-full border-none bg-transparent cursor-pointer"
                      style={{
                        height: 36,
                        padding: '0 10px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: project.id === projectId ? 600 : 500,
                        color: project.id === projectId ? 'var(--accent-text)' : 'var(--text-primary)',
                        fontFamily: 'var(--font-sans)',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {project.name}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* No project selected */}
        {!projectId && !projectsLoading && (
          <div
            className="flex items-center justify-center"
            style={{
              height: 300,
              border: '1px dashed var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--text-tertiary)',
              fontSize: 'var(--text-sm)',
            }}
          >
            Select a project above to view its setup checklist.
          </div>
        )}

        {/* Loading */}
        {setupLoading && projectId && <SkeletonSetupPage />}

        {/* Error */}
        {setupError && (
          <div
            className="flex items-center justify-center"
            style={{
              height: 300,
              color: 'var(--error)',
              fontSize: 'var(--text-sm)',
            }}
          >
            Failed to load setup progress. Check your connection and try again.
          </div>
        )}

        {/* Setup content */}
        {setupData && !setupLoading && (
          <div style={{ animation: 'fadeIn 200ms ease-out' }}>
            {/* Progress bar */}
            {progress && (
              <div style={{ marginBottom: 24 }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                  <span
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                    }}
                  >
                    Setup progress
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 600,
                      color: progress.percentage === 100 ? 'var(--success)' : 'var(--accent-text)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {progress.percentage}%
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${progress.percentage}%`,
                      backgroundColor: progress.percentage === 100 ? 'var(--success)' : 'var(--accent)',
                      borderRadius: 3,
                      transition: 'width var(--duration-normal) ease-out',
                    }}
                  />
                </div>
                <div
                  className="flex items-center"
                  style={{
                    gap: 16,
                    marginTop: 8,
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  <span>{progress.completed} completed</span>
                  <span>{progress.pending} remaining</span>
                  {progress.skipped > 0 && <span>{progress.skipped} skipped</span>}
                </div>
              </div>
            )}

            {/* Category sections */}
            <div className="flex flex-col" style={{ gap: 12 }}>
              {setupData.categories.map((category) => (
                <SetupCategorySection
                  key={category.key}
                  category={category}
                  onToggleItem={handleToggleItem}
                  loading={updateItem.isPending}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Save profile dialog */}
      {setupData && (
        <SaveProfileDialog
          open={saveProfileOpen}
          onClose={() => setSaveProfileOpen(false)}
          onSave={handleSaveProfile}
          categories={setupData.categories}
          loading={createProfile.isPending}
        />
      )}

      {/* Reset confirmation */}
      <ConfirmDialog
        open={resetConfirmOpen}
        title="Reset setup progress"
        description="This will reset all checklist items to their initial state. This action cannot be undone."
        confirmLabel="Reset"
        onConfirm={handleReset}
        onCancel={() => setResetConfirmOpen(false)}
        loading={resetProgress.isPending}
        destructive
      />
    </>
  );
}
