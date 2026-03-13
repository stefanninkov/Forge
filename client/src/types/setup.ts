export type AutomationLevel = 'auto' | 'semi' | 'manual';
export type SetupStatus = 'PENDING' | 'COMPLETED' | 'SKIPPED';

export interface SetupItem {
  key: string;
  title: string;
  description: string;
  instructions: string;
  automationLevel: AutomationLevel;
  link?: string;
  status: SetupStatus;
  completedAt: string | null;
}

export interface SetupCategory {
  key: string;
  title: string;
  items: SetupItem[];
}

export interface SetupProgress {
  total: number;
  completed: number;
  skipped: number;
  pending: number;
  percentage: number;
}

export interface SetupData {
  categories: SetupCategory[];
  progress: SetupProgress;
}

export interface SetupProfile {
  id: string;
  name: string;
  checklistConfig: Record<string, boolean>;
  createdAt: string;
}
