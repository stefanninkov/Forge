export interface Project {
  id: string;
  name: string;
  description: string | null;
  webflowSiteId: string | null;
  figmaFileKey: string | null;
  createdAt: string;
  updatedAt: string;
}
