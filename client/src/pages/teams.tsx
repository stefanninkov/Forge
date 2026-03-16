import { useState, useCallback } from 'react';
import {
  Users,
  Plus,
  X,
  Crown,
  Shield,
  UserCheck,
  Eye,
  Mail,
  MoreVertical,
  Trash2,
  LogOut,
  Loader2,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { usePageTitle } from '@/hooks/use-page-title';
import {
  useTeams,
  useTeam,
  useTeamMembers,
  useTeamInvitations,
  useCreateTeam,
  useInviteMember,
  useUpdateMemberRole,
  useRemoveMember,
  useLeaveTeam,
  useRevokeInvitation,
  useDeleteTeam,
} from '@/hooks/use-teams';

type View = 'list' | 'detail';

const ROLE_ICONS: Record<string, typeof Crown> = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: UserCheck,
  VIEWER: Eye,
};

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member',
  VIEWER: 'Viewer',
};

export default function TeamsPage() {
  usePageTitle('Teams');
  const [view, setView] = useState<View>('list');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);

  const { data: teams, isLoading } = useTeams();
  const { data: team } = useTeam(view === 'detail' ? selectedTeamId : null);
  const { data: members } = useTeamMembers(view === 'detail' ? selectedTeamId : null);
  const { data: invitations } = useTeamInvitations(view === 'detail' ? selectedTeamId : null);

  const createMutation = useCreateTeam();
  const deleteMutation = useDeleteTeam();
  const leaveMutation = useLeaveTeam();

  const openTeam = useCallback((teamId: string) => {
    setSelectedTeamId(teamId);
    setView('detail');
  }, []);

  const goBack = useCallback(() => {
    setView('list');
    setSelectedTeamId(null);
  }, []);

  return (
    <>
      <PageHeader
        title={view === 'detail' && team ? team.name : 'Teams'}
        description={view === 'detail' ? 'Manage team members and invitations' : 'Create and manage teams for collaborative Webflow development.'}
        actions={
          view === 'list' ? (
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center"
              style={{
                gap: 6,
                height: 36,
                padding: '0 14px',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent)',
                color: '#fff',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <Plus size={14} />
              Create Team
            </button>
          ) : (
            <button
              onClick={goBack}
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
              ← Back to Teams
            </button>
          )
        }
      />

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px 24px 40px' }}>
        {/* Team List View */}
        {view === 'list' && (
          <>
            {isLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: 72,
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-secondary)',
                      animation: 'skeletonPulse 1.8s infinite',
                    }}
                  />
                ))}
              </div>
            )}

            {!isLoading && (!teams || teams.length === 0) && (
              <div
                className="flex flex-col items-center justify-center"
                style={{
                  height: 300,
                  border: '1px dashed var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  gap: 12,
                }}
              >
                <Users size={32} color="var(--text-tertiary)" />
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                  No teams yet. Create a team to collaborate with others.
                </p>
                <button
                  onClick={() => setShowCreateDialog(true)}
                  className="flex items-center"
                  style={{
                    gap: 6,
                    height: 36,
                    padding: '0 14px',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--accent)',
                    color: '#fff',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <Plus size={14} />
                  Create Team
                </button>
              </div>
            )}

            {teams && teams.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {teams.map((t) => {
                  const RoleIcon = ROLE_ICONS[t.role ?? 'MEMBER'] ?? UserCheck;
                  return (
                    <button
                      key={t.id}
                      onClick={() => openTeam(t.id)}
                      className="flex items-center"
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-primary)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        gap: 12,
                        transition: 'border-color var(--duration-fast)',
                        fontFamily: 'var(--font-sans)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-default)';
                      }}
                    >
                      <div
                        className="flex items-center justify-center"
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--accent-subtle)',
                          color: 'var(--accent)',
                          fontWeight: 600,
                          fontSize: 'var(--text-md)',
                          flexShrink: 0,
                        }}
                      >
                        {t.name[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 'var(--text-base)', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {t.name}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                          {t.members?.length ?? 0} members · /{t.slug}
                        </div>
                      </div>
                      <div className="flex items-center" style={{ gap: 6, color: 'var(--text-tertiary)' }}>
                        <RoleIcon size={14} />
                        <span style={{ fontSize: 'var(--text-xs)' }}>{ROLE_LABELS[t.role ?? 'MEMBER']}</span>
                      </div>
                      <ChevronRight size={16} color="var(--text-tertiary)" />
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Team Detail View */}
        {view === 'detail' && selectedTeamId && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Members Section */}
            <div>
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: 12 }}
              >
                <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
                  Members ({members?.length ?? 0})
                </h3>
                <button
                  onClick={() => setShowInviteDialog(true)}
                  className="flex items-center"
                  style={{
                    gap: 6,
                    height: 32,
                    padding: '0 12px',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <Mail size={12} />
                  Invite
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {members?.map((m) => {
                  const RoleIcon = ROLE_ICONS[m.role] ?? UserCheck;
                  return (
                    <div
                      key={m.id}
                      className="flex items-center"
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-secondary)',
                        gap: 10,
                        position: 'relative',
                      }}
                    >
                      <div
                        className="flex items-center justify-center"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: 'var(--surface-hover)',
                          color: 'var(--text-secondary)',
                          fontWeight: 500,
                          fontSize: 'var(--text-xs)',
                          flexShrink: 0,
                        }}
                      >
                        {m.user.name?.[0]?.toUpperCase() ?? m.user.email[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {m.user.name || m.user.email}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                          {m.user.email}
                        </div>
                      </div>
                      <div className="flex items-center" style={{ gap: 4, color: 'var(--text-secondary)' }}>
                        <RoleIcon size={12} />
                        <span style={{ fontSize: 'var(--text-xs)' }}>{ROLE_LABELS[m.role]}</span>
                      </div>
                      {m.role !== 'OWNER' && (
                        <button
                          onClick={() => setOpenMemberId(openMemberId === m.id ? null : m.id)}
                          style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            padding: 4,
                            color: 'var(--text-tertiary)',
                          }}
                        >
                          <MoreVertical size={14} />
                        </button>
                      )}

                      {/* Member actions dropdown */}
                      {openMemberId === m.id && (
                        <MemberActionsMenu
                          teamId={selectedTeamId}
                          member={m}
                          onClose={() => setOpenMemberId(null)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pending Invitations */}
            {invitations && invitations.length > 0 && (
              <div>
                <h3 style={{ margin: '0 0 12px', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
                  Pending Invitations ({invitations.filter((i) => i.status === 'PENDING').length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {invitations
                    .filter((i) => i.status === 'PENDING')
                    .map((inv) => (
                      <InvitationRow key={inv.id} teamId={selectedTeamId} invitation={inv} />
                    ))}
                </div>
              </div>
            )}

            {/* Danger Zone */}
            <div
              style={{
                padding: 16,
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <h4 style={{ margin: '0 0 8px', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--error)', fontFamily: 'var(--font-sans)' }}>
                Danger Zone
              </h4>
              <div className="flex items-center" style={{ gap: 8 }}>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to leave this team?')) {
                      leaveMutation.mutate(selectedTeamId, { onSuccess: goBack });
                    }
                  }}
                  className="flex items-center"
                  style={{
                    gap: 6,
                    height: 32,
                    padding: '0 12px',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <LogOut size={12} />
                  Leave Team
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this team? This action is permanent and cannot be undone.')) {
                      deleteMutation.mutate(selectedTeamId, { onSuccess: goBack });
                    }
                  }}
                  className="flex items-center"
                  style={{
                    gap: 6,
                    height: 32,
                    padding: '0 12px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'transparent',
                    color: 'var(--error)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <Trash2 size={12} />
                  Delete Team
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Team Dialog */}
      {showCreateDialog && (
        <CreateTeamDialog
          onClose={() => setShowCreateDialog(false)}
          onCreate={(data) => {
            createMutation.mutate(data, {
              onSuccess: () => setShowCreateDialog(false),
            });
          }}
          isPending={createMutation.isPending}
        />
      )}

      {/* Invite Dialog */}
      {showInviteDialog && selectedTeamId && (
        <InviteDialog
          teamId={selectedTeamId}
          onClose={() => setShowInviteDialog(false)}
        />
      )}
    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function CreateTeamDialog({
  onClose,
  onCreate,
  isPending,
}: {
  onClose: () => void;
  onCreate: (data: { name: string; slug: string }) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  const handleNameChange = useCallback((val: string) => {
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} />
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 440,
          backgroundColor: 'var(--bg-primary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          padding: 24,
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
            Create Team
          </h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-tertiary)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6, fontFamily: 'var(--font-sans)' }}>
              Team Name
            </label>
            <input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="My Agency"
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
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6, fontFamily: 'var(--font-sans)' }}>
              Team URL
            </label>
            <div className="flex items-center" style={{ gap: 0 }}>
              <span
                style={{
                  height: 36,
                  padding: '0 10px',
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  borderRight: 'none',
                  borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-tertiary)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                forge.dev/
              </span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="my-agency"
                style={{
                  flex: 1,
                  height: 36,
                  padding: '0 10px',
                  border: '1px solid var(--border-default)',
                  borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end" style={{ gap: 8, marginTop: 20 }}>
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
            onClick={() => onCreate({ name, slug })}
            disabled={!name || !slug || isPending}
            className="flex items-center"
            style={{
              gap: 6,
              height: 36,
              padding: '0 14px',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              backgroundColor: name && slug && !isPending ? 'var(--accent)' : 'var(--surface-hover)',
              color: name && slug && !isPending ? '#fff' : 'var(--text-tertiary)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              cursor: name && slug && !isPending ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

function InviteDialog({ teamId, onClose }: { teamId: string; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER');
  const inviteMutation = useInviteMember(teamId);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} />
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 440,
          backgroundColor: 'var(--bg-primary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          padding: 24,
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
            Invite Member
          </h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-tertiary)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6, fontFamily: 'var(--font-sans)' }}>
              Email Address
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="colleague@agency.com"
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
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6, fontFamily: 'var(--font-sans)' }}>
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'ADMIN' | 'MEMBER' | 'VIEWER')}
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
              <option value="ADMIN">Admin — Can manage members and settings</option>
              <option value="MEMBER">Member — Can edit projects</option>
              <option value="VIEWER">Viewer — Read-only access</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end" style={{ gap: 8, marginTop: 20 }}>
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
            onClick={() => {
              inviteMutation.mutate({ email, role }, { onSuccess: () => onClose() });
            }}
            disabled={!email || inviteMutation.isPending}
            className="flex items-center"
            style={{
              gap: 6,
              height: 36,
              padding: '0 14px',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              backgroundColor: email && !inviteMutation.isPending ? 'var(--accent)' : 'var(--surface-hover)',
              color: email && !inviteMutation.isPending ? '#fff' : 'var(--text-tertiary)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              cursor: email && !inviteMutation.isPending ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {inviteMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            <Mail size={14} />
            Send Invite
          </button>
        </div>
      </div>
    </div>
  );
}

function MemberActionsMenu({
  teamId,
  member,
  onClose,
}: {
  teamId: string;
  member: { id: string; userId: string; role: string; user: { name: string | null; email: string } };
  onClose: () => void;
}) {
  const updateRole = useUpdateMemberRole(teamId);
  const removeMember = useRemoveMember(teamId);

  return (
    <div
      style={{
        position: 'absolute',
        right: 12,
        top: 44,
        width: 180,
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        zIndex: 10,
        overflow: 'hidden',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {(['ADMIN', 'MEMBER', 'VIEWER'] as const).map((r) => (
        <button
          key={r}
          onClick={() => {
            updateRole.mutate({ memberId: member.id, role: r });
            onClose();
          }}
          disabled={member.role === r}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: 'none',
            backgroundColor: member.role === r ? 'var(--surface-hover)' : 'transparent',
            color: member.role === r ? 'var(--accent)' : 'var(--text-primary)',
            fontSize: 'var(--text-xs)',
            textAlign: 'left',
            cursor: member.role === r ? 'default' : 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Set as {ROLE_LABELS[r]}
        </button>
      ))}
      <div style={{ height: 1, backgroundColor: 'var(--border-default)' }} />
      <button
        onClick={() => {
          if (confirm(`Remove ${member.user.name || member.user.email} from the team?`)) {
            removeMember.mutate(member.id);
            onClose();
          }
        }}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: 'none',
          backgroundColor: 'transparent',
          color: 'var(--error)',
          fontSize: 'var(--text-xs)',
          textAlign: 'left',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
        }}
      >
        Remove from team
      </button>
    </div>
  );
}

function InvitationRow({
  teamId,
  invitation,
}: {
  teamId: string;
  invitation: { id: string; email: string; role: string; expiresAt: string; createdAt: string };
}) {
  const revoke = useRevokeInvitation(teamId);

  return (
    <div
      className="flex items-center"
      style={{
        padding: '10px 12px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-secondary)',
        gap: 10,
      }}
    >
      <Mail size={14} color="var(--text-tertiary)" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{invitation.email}</div>
        <div className="flex items-center" style={{ gap: 6, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          <span>{ROLE_LABELS[invitation.role]}</span>
          <span>·</span>
          <Clock size={10} />
          <span>Expires {new Date(invitation.expiresAt).toLocaleDateString()}</span>
        </div>
      </div>
      <button
        onClick={() => revoke.mutate(invitation.id)}
        disabled={revoke.isPending}
        style={{
          height: 28,
          padding: '0 10px',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'transparent',
          color: 'var(--text-tertiary)',
          fontSize: 'var(--text-xs)',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {revoke.isPending ? <Loader2 size={10} className="animate-spin" /> : 'Revoke'}
      </button>
    </div>
  );
}
