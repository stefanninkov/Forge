export interface Project {
  id: string;
  name: string;
  description: string | null;
  notes: string | null;
  webflowSiteId: string | null;
  figmaFileKey: string | null;
  figmaTokenId: string | null;
  webflowTokenId: string | null;
  anthropicTokenId: string | null;
  scriptStatus: ScriptStatus;
  lastDeployedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ScriptStatus = 'SYNCED' | 'OUTDATED' | 'NOT_DEPLOYED' | 'ERROR';

export interface ActivityLog {
  id: string;
  userId: string;
  projectId: string | null;
  action: ActivityAction;
  details: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  project?: { id: string; name: string } | null;
}

export type ActivityAction =
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_DELETED'
  | 'AUDIT_RUN'
  | 'TEMPLATE_CREATED'
  | 'TEMPLATE_PUSHED'
  | 'ANIMATION_APPLIED'
  | 'SCRIPT_DEPLOYED'
  | 'SECTION_CAPTURED'
  | 'FIGMA_ANALYZED'
  | 'SETTINGS_UPDATED'
  | 'PROJECT_DUPLICATED';

export interface Favorite {
  id: string;
  userId: string;
  projectId: string | null;
  templateId: string | null;
  presetId: string | null;
  type: 'project' | 'template' | 'preset';
  createdAt: string;
}
