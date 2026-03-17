import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  queryUserDocs,
  querySubcollection,
  getDocument,
  createDocument,
  removeDocument,
  setDocument,
  serverTimestamp,
  doc,
  orderBy,
} from '@/lib/firestore';
import type { SetupProfile, SetupStatus, SetupData, AutomationLevel } from '@/types/setup';

interface SetupProgressItem {
  id: string;
  status: SetupStatus;
  completedAt: string | null;
}

// ── Default checklist definition ────────────────────────────────
interface ChecklistItemDef {
  key: string;
  title: string;
  description: string;
  instructions: string;
  automationLevel: AutomationLevel;
  link?: string;
}

interface ChecklistCategoryDef {
  key: string;
  title: string;
  items: ChecklistItemDef[];
}

const SETUP_CHECKLIST: ChecklistCategoryDef[] = [
  {
    key: 'project-config',
    title: 'Project Configuration',
    items: [
      {
        key: 'site-name',
        title: 'Set site name and favicon',
        description: 'Configure your project name and favicon in Webflow site settings.',
        instructions: 'Go to Webflow → Site Settings → General → set the site name and upload a favicon.',
        automationLevel: 'semi',
        link: 'https://university.webflow.com/lesson/site-settings',
      },
      {
        key: 'custom-domain',
        title: 'Connect custom domain',
        description: 'Add your custom domain to the Webflow project.',
        instructions: 'Go to Webflow → Site Settings → Publishing → Add custom domain and configure DNS.',
        automationLevel: 'manual',
      },
      {
        key: 'ssl-certificate',
        title: 'Enable SSL certificate',
        description: 'Ensure HTTPS is enabled for your custom domain.',
        instructions: 'SSL is automatically provisioned after domain verification. Check Site Settings → Publishing.',
        automationLevel: 'auto',
      },
    ],
  },
  {
    key: 'global-styles',
    title: 'Global Styles & Typography',
    items: [
      {
        key: 'font-setup',
        title: 'Load custom fonts',
        description: 'Add Geist Sans and Geist Mono (or your project fonts) to the site.',
        instructions: 'Go to Webflow → Site Settings → Fonts → upload or link fonts. Or add font-face CSS in custom code.',
        automationLevel: 'semi',
      },
      {
        key: 'body-styles',
        title: 'Set body default styles',
        description: 'Configure default font-family, font-size, line-height, and color on the body element.',
        instructions: 'Select the Body (All Pages) element in Webflow and set typography defaults in the Style Panel.',
        automationLevel: 'semi',
      },
      {
        key: 'heading-styles',
        title: 'Define heading styles (H1–H6)',
        description: 'Set font sizes, weights, and line heights for all heading levels.',
        instructions: 'Add an H1–H6 element, style each default tag, then remove the elements.',
        automationLevel: 'semi',
      },
      {
        key: 'link-styles',
        title: 'Style default links',
        description: 'Configure default link color, hover state, and text-decoration.',
        instructions: 'Style the default "All Links" tag in Webflow to set base link appearance.',
        automationLevel: 'semi',
      },
    ],
  },
  {
    key: 'utilities',
    title: 'Utility Classes & Structure',
    items: [
      {
        key: 'container-class',
        title: 'Create container utility class',
        description: 'Set up a reusable .container class with max-width and auto margins.',
        instructions: 'Create a div with class "container", set max-width (e.g. 1200px) and margin: 0 auto.',
        automationLevel: 'auto',
      },
      {
        key: 'spacing-classes',
        title: 'Create spacing utility classes',
        description: 'Build padding/margin utility classes for consistent spacing.',
        instructions: 'Create combo classes like .padding-section-small, .padding-section-medium, .padding-section-large with vertical padding values.',
        automationLevel: 'semi',
      },
      {
        key: 'global-css',
        title: 'Add global custom CSS',
        description: 'Add CSS resets, custom properties, and utility styles in the site head code.',
        instructions: 'Go to Site Settings → Custom Code → Head Code and add your global CSS.',
        automationLevel: 'semi',
      },
    ],
  },
  {
    key: 'seo-meta',
    title: 'SEO & Meta Tags',
    items: [
      {
        key: 'meta-title',
        title: 'Set default meta title format',
        description: 'Configure the title tag template for pages.',
        instructions: 'Go to Pages → select page → SEO Settings → set the Title Tag.',
        automationLevel: 'manual',
      },
      {
        key: 'meta-description',
        title: 'Write meta descriptions',
        description: 'Add unique meta descriptions for key pages.',
        instructions: 'Go to Pages → select page → SEO Settings → set the Meta Description.',
        automationLevel: 'manual',
      },
      {
        key: 'og-tags',
        title: 'Configure Open Graph tags',
        description: 'Set og:title, og:description, og:image for social sharing.',
        instructions: 'Go to Pages → Open Graph Settings → fill in title, description, and upload an OG image (1200x630).',
        automationLevel: 'manual',
      },
      {
        key: 'sitemap',
        title: 'Enable sitemap',
        description: 'Ensure the auto-generated sitemap is enabled.',
        instructions: 'Go to Site Settings → SEO → enable "Auto-generate Sitemap".',
        automationLevel: 'auto',
      },
      {
        key: 'robots-txt',
        title: 'Configure robots.txt',
        description: 'Review and customize the robots.txt file.',
        instructions: 'Go to Site Settings → SEO → customize the robots.txt content.',
        automationLevel: 'manual',
      },
    ],
  },
  {
    key: 'performance',
    title: 'Performance & Analytics',
    items: [
      {
        key: 'image-optimization',
        title: 'Enable image optimization',
        description: 'Configure responsive images and WebP format.',
        instructions: 'Webflow auto-generates responsive sizes. Ensure source images are high-res and properly compressed before upload.',
        automationLevel: 'manual',
      },
      {
        key: 'analytics',
        title: 'Add analytics tracking',
        description: 'Install Google Analytics or your preferred analytics tool.',
        instructions: 'Go to Site Settings → Custom Code → paste your analytics script in the Head Code section.',
        automationLevel: 'semi',
      },
      {
        key: 'preload-fonts',
        title: 'Preload critical fonts',
        description: 'Add preload links for above-the-fold fonts to improve LCP.',
        instructions: 'Add <link rel="preload" as="font" href="..."> tags in the Head Code for your primary fonts.',
        automationLevel: 'semi',
      },
    ],
  },
];

function buildSetupData(progressItems: SetupProgressItem[]): SetupData {
  const progressMap = new Map(progressItems.map((p) => [p.id, p]));

  const categories = SETUP_CHECKLIST.map((cat) => ({
    key: cat.key,
    title: cat.title,
    items: cat.items.map((item) => {
      const saved = progressMap.get(item.key);
      return {
        ...item,
        status: (saved?.status ?? 'PENDING') as SetupStatus,
        completedAt: saved?.completedAt ?? null,
      };
    }),
  }));

  const allItems = categories.flatMap((c) => c.items);
  const total = allItems.length;
  const completed = allItems.filter((i) => i.status === 'COMPLETED').length;
  const skipped = allItems.filter((i) => i.status === 'SKIPPED').length;
  const pending = total - completed - skipped;

  return {
    categories,
    progress: {
      total,
      completed,
      skipped,
      pending,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    },
  };
}

export function useSetupProgress(projectId: string | null) {
  return useQuery({
    queryKey: ['setup', projectId],
    queryFn: async (): Promise<SetupData> => {
      const items = await querySubcollection<SetupProgressItem>(
        'projects',
        projectId!,
        'setupProgress',
      );
      return buildSetupData(items);
    },
    enabled: !!projectId,
  });
}

export function useUpdateSetupItem(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemKey, status }: { itemKey: string; status: SetupStatus }) => {
      if (!projectId) throw new Error('No project selected');
      const data: Record<string, unknown> = { status };
      if (status === 'COMPLETED') {
        data.completedAt = serverTimestamp();
      } else {
        data.completedAt = null;
      }
      await setDocument(`projects/${projectId}/setupProgress`, itemKey, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup', projectId] });
    },
  });
}

export function useResetSetupProgress(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error('No project selected');
      const items = await querySubcollection<SetupProgressItem>(
        'projects',
        projectId,
        'setupProgress',
      );
      const batch = writeBatch(db);
      for (const item of items) {
        const ref = doc(db, 'projects', projectId, 'setupProgress', item.id);
        batch.delete(ref);
      }
      await batch.commit();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup', projectId] });
      toast.success('Setup progress reset');
    },
    onError: () => toast.error('Failed to reset progress'),
  });
}

export function useSetupProfiles() {
  return useQuery({
    queryKey: ['setup-profiles'],
    queryFn: () =>
      queryUserDocs<SetupProfile>('setupProfiles', [
        orderBy('createdAt', 'desc'),
      ]),
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; checklistConfig: Record<string, boolean> }) => {
      const id = await createDocument('setupProfiles', {
        name: data.name,
        checklistConfig: data.checklistConfig,
      });
      return { id, ...data } as SetupProfile & { id: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup-profiles'] });
      toast.success('Profile saved');
    },
    onError: () => toast.error('Failed to save profile'),
  });
}

export function useDeleteProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) => removeDocument('setupProfiles', profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup-profiles'] });
      toast.success('Profile deleted');
    },
    onError: () => toast.error('Failed to delete profile'),
  });
}

export function useApplyProfile(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profileId: string) => {
      if (!projectId) throw new Error('No project selected');
      const profile = await getDocument<SetupProfile>('setupProfiles', profileId);
      if (!profile) throw new Error('Profile not found');

      const batch = writeBatch(db);
      for (const [itemKey, enabled] of Object.entries(profile.checklistConfig)) {
        const ref = doc(db, 'projects', projectId, 'setupProgress', itemKey);
        batch.set(ref, {
          status: enabled ? 'COMPLETED' : 'PENDING',
          completedAt: enabled ? serverTimestamp() : null,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
      await batch.commit();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup', projectId] });
      toast.success('Profile applied');
    },
    onError: () => toast.error('Failed to apply profile'),
  });
}
