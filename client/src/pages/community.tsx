import { useState, useMemo } from 'react';
import {
  Globe,
  Search,
  Download,
  Loader2,
  Tag,
  Zap,
  LayoutTemplate,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { usePageTitle } from '@/hooks/use-page-title';
import {
  useCommunityTemplates,
  useCommunityPresets,
  useInstallTemplate,
  useInstallPreset,
} from '@/hooks/use-community';

type Tab = 'templates' | 'presets';

const TEMPLATE_CATEGORIES = ['All', 'Hero', 'Features', 'Pricing', 'Testimonials', 'CTA', 'Footer', 'Navigation'];
const PRESET_CATEGORIES = ['All', 'Fade', 'Slide', 'Scale', 'Special', 'Hover', 'Load', 'GSAP'];

export default function CommunityPage() {
  usePageTitle('Community');
  const [tab, setTab] = useState<Tab>('templates');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState<'recent' | 'popular' | 'name'>('popular');

  const templateFilters = useMemo(
    () => ({
      search: search || undefined,
      category: category === 'All' ? undefined : category,
      sort,
    }),
    [search, category, sort],
  );

  const presetFilters = useMemo(
    () => ({
      search: search || undefined,
      category: category === 'All' ? undefined : category,
    }),
    [search, category],
  );

  const { data: templates, isLoading: templatesLoading } = useCommunityTemplates(
    tab === 'templates' ? templateFilters : {},
  );
  const { data: presets, isLoading: presetsLoading } = useCommunityPresets(
    tab === 'presets' ? presetFilters : {},
  );
  const installTemplate = useInstallTemplate();
  const installPreset = useInstallPreset();

  const categories = tab === 'templates' ? TEMPLATE_CATEGORIES : PRESET_CATEGORIES;
  const isLoading = tab === 'templates' ? templatesLoading : presetsLoading;

  return (
    <>
      <PageHeader
        title="Community Library"
        description="Browse and install templates and animation presets shared by the community."
      />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px 40px' }}>
        {/* Tab navigation */}
        <div
          className="flex items-center"
          style={{
            gap: 0,
            marginBottom: 20,
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          {([
            { key: 'templates' as const, label: 'Templates', icon: LayoutTemplate },
            { key: 'presets' as const, label: 'Animation Presets', icon: Zap },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                setTab(key);
                setCategory('All');
              }}
              className="flex items-center border-none cursor-pointer"
              style={{
                gap: 6,
                padding: '8px 16px',
                fontSize: 'var(--text-sm)',
                fontWeight: tab === key ? 600 : 400,
                fontFamily: 'var(--font-sans)',
                color: tab === key ? 'var(--text-primary)' : 'var(--text-tertiary)',
                backgroundColor: 'transparent',
                borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div
          className="flex items-center"
          style={{
            gap: 12,
            marginBottom: 20,
            flexWrap: 'wrap',
          }}
        >
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 300 }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)',
              }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search community..."
              style={{
                width: '100%',
                height: 36,
                padding: '0 10px 0 30px',
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

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'recent' | 'popular' | 'name')}
            style={{
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
            <option value="popular">Most Popular</option>
            <option value="recent">Most Recent</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>

        {/* Category pills */}
        <div
          className="flex items-center"
          style={{
            gap: 6,
            marginBottom: 20,
            flexWrap: 'wrap',
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: '4px 12px',
                borderRadius: 999,
                border: '1px solid',
                borderColor: category === cat ? 'var(--accent)' : 'var(--border-default)',
                backgroundColor: category === cat ? 'var(--accent-subtle)' : 'transparent',
                color: category === cat ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 12,
            }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 180,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-secondary)',
                  animation: 'skeletonPulse 1.8s infinite',
                  animationDelay: `${i * 0.05}s`,
                  border: '1px solid var(--border-default)',
                }}
              />
            ))}
          </div>
        )}

        {/* Templates grid */}
        {!isLoading && tab === 'templates' && (
          <>
            {(!templates || templates.length === 0) ? (
              <EmptyState type="templates" />
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 12,
                }}
              >
                {templates.map((t) => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    onInstall={() => installTemplate.mutate(t.id)}
                    isInstalling={installTemplate.isPending}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Presets grid */}
        {!isLoading && tab === 'presets' && (
          <>
            {(!presets || presets.length === 0) ? (
              <EmptyState type="presets" />
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: 12,
                }}
              >
                {presets.map((p) => (
                  <PresetCard
                    key={p.id}
                    preset={p}
                    onInstall={() => installPreset.mutate(p.id)}
                    isInstalling={installPreset.isPending}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function EmptyState({ type }: { type: 'templates' | 'presets' }) {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        height: 300,
        border: '1px dashed var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        gap: 12,
      }}
    >
      <Globe size={32} color="var(--text-tertiary)" />
      <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}>
        No community {type} found. Try adjusting your filters.
      </p>
    </div>
  );
}

function TemplateCard({
  template,
  onInstall,
  isInstalling,
}: {
  template: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    type: string;
    tags: string[];
    createdAt: string;
  };
  onInstall: () => void;
  isInstalling: boolean;
}) {
  return (
    <div
      style={{
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-primary)',
        overflow: 'hidden',
        transition: 'border-color var(--duration-fast)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-active)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-default)';
      }}
    >
      {/* Preview area */}
      <div
        style={{
          height: 100,
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LayoutTemplate size={24} color="var(--text-tertiary)" />
      </div>

      <div style={{ padding: '12px 14px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
            {template.name}
          </span>
          <span
            style={{
              fontSize: 'var(--text-xs)',
              padding: '1px 6px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--accent-subtle)',
              color: 'var(--accent)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {template.category}
          </span>
        </div>

        {template.description && (
          <p
            style={{
              margin: '0 0 8px',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {template.description}
          </p>
        )}

        <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
          <div className="flex items-center" style={{ gap: 6 }}>
            {/* Type badge */}
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: template.type === 'STYLED' ? '#8b5cf6' : 'var(--text-tertiary)',
                backgroundColor: template.type === 'STYLED' ? 'rgba(139, 92, 246, 0.1)' : 'var(--surface-hover)',
                padding: '1px 5px',
                borderRadius: 'var(--radius-sm)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {template.type === 'STYLED' ? 'Styled' : 'Skeleton'}
            </span>

            {/* Tags */}
            {template.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="flex items-center"
                style={{
                  gap: 3,
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--surface-hover)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-tertiary)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <Tag size={8} />
                {tag}
              </span>
            ))}
          </div>

          <button
            onClick={onInstall}
            disabled={isInstalling}
            className="flex items-center"
            style={{
              gap: 4,
              height: 28,
              padding: '0 10px',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'transparent',
              color: 'var(--accent)',
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              cursor: isInstalling ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {isInstalling ? <Loader2 size={10} className="animate-spin" /> : <Download size={10} />}
            Install
          </button>
        </div>
      </div>
    </div>
  );
}

function PresetCard({
  preset,
  onInstall,
  isInstalling,
}: {
  preset: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    engine: string;
    trigger: string;
    tags?: string[];
  };
  onInstall: () => void;
  isInstalling: boolean;
}) {
  return (
    <div
      style={{
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-primary)',
        padding: '14px',
        transition: 'border-color var(--duration-fast)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-active)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-default)';
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
          {preset.name}
        </span>
        <div className="flex items-center" style={{ gap: 4 }}>
          <span
            style={{
              fontSize: 'var(--text-xs)',
              padding: '1px 6px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: preset.engine === 'CSS' ? 'var(--accent-subtle)' : 'rgba(139, 92, 246, 0.1)',
              color: preset.engine === 'CSS' ? 'var(--accent)' : '#8b5cf6',
              fontWeight: 500,
              fontFamily: 'var(--font-mono)',
            }}
          >
            {preset.engine}
          </span>
          <span
            style={{
              fontSize: 'var(--text-xs)',
              padding: '1px 6px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--surface-hover)',
              color: 'var(--text-tertiary)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {preset.trigger.toLowerCase()}
          </span>
        </div>
      </div>

      {preset.description && (
        <p
          style={{
            margin: '0 0 10px',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-tertiary)',
            lineHeight: 1.4,
            fontFamily: 'var(--font-sans)',
          }}
        >
          {preset.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}>
          {preset.category}
        </span>
        <button
          onClick={onInstall}
          disabled={isInstalling}
          className="flex items-center"
          style={{
            gap: 4,
            height: 28,
            padding: '0 10px',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'transparent',
            color: 'var(--accent)',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            cursor: isInstalling ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {isInstalling ? <Loader2 size={10} className="animate-spin" /> : <Download size={10} />}
          Install
        </button>
      </div>
    </div>
  );
}
