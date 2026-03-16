import { useState, useCallback, useMemo } from 'react';
import { Code, Download, Loader2, Layers, AlertCircle, Zap, ArrowRightLeft, Gauge } from 'lucide-react';
import { SkeletonAnimationGrid } from '@/components/shared/skeleton';
import { PageHeader } from '@/components/layout/page-header';
import { usePageTitle } from '@/hooks/use-page-title';
import { PresetCard } from '@/components/modules/animations/preset-card';
import { PresetFiltersBar } from '@/components/modules/animations/preset-filters';
import { ConfiguratorPanel } from '@/components/modules/animations/configurator-panel';
import { ScriptGeneratorPanel } from '@/components/modules/animations/script-generator-panel';
import { BulkAttributePanel } from '@/components/modules/animations/bulk-attribute-panel';
import { QuickApplyPanel } from '@/components/modules/animations/quick-apply-panel';
import { PageTransitions } from '@/components/modules/animations/page-transitions';
import { PerformanceHints } from '@/components/modules/animations/performance-hints';
import { useAnimationPresets, useSeedPresets, useDeleteAnimationPreset } from '@/hooks/use-animations';
import type { AnimationPreset, PresetFilters } from '@/types/animation';

type AnimationTab = 'presets' | 'transitions' | 'performance';

export default function AnimationsPage() {
  usePageTitle('Animations');
  const [filters, setFilters] = useState<PresetFilters>({});
  const [selectedPreset, setSelectedPreset] = useState<AnimationPreset | null>(null);
  const [configuratorOpen, setConfiguratorOpen] = useState(false);
  const [scriptGenOpen, setScriptGenOpen] = useState(false);
  const [bulkAttrOpen, setBulkAttrOpen] = useState(false);
  const [quickApplyOpen, setQuickApplyOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AnimationTab>('presets');

  const { data: presets, isLoading, error } = useAnimationPresets(filters);
  const seedMutation = useSeedPresets();
  const deleteMutation = useDeleteAnimationPreset();

  const handleSelect = useCallback((preset: AnimationPreset) => {
    setSelectedPreset(preset);
    setConfiguratorOpen(true);
  }, []);

  const handleCloseConfigurator = useCallback(() => {
    setConfiguratorOpen(false);
    // Delay clearing preset to allow close animation
    setTimeout(() => setSelectedPreset(null), 200);
  }, []);

  const handleDelete = useCallback(
    (preset: AnimationPreset) => {
      if (!preset.isSystem) {
        deleteMutation.mutate(preset.id);
      }
    },
    [deleteMutation],
  );

  const handleSeed = useCallback(() => {
    seedMutation.mutate();
  }, [seedMutation]);

  // Group presets by category for optional grouped view
  const presetList = useMemo(() => presets ?? [], [presets]);
  const isEmpty = !isLoading && presetList.length === 0;
  const hasNoPresets = !isLoading && !error && presetList.length === 0 && !filters.engine && !filters.trigger && !filters.category && !filters.search;

  return (
    <>
      <PageHeader
        title="Animations"
        description="Browse, configure, and preview animation presets."
        actions={
          <div className="flex items-center" style={{ gap: 8 }}>
            <button
              onClick={() => setBulkAttrOpen(true)}
              className="flex items-center"
              style={{
                gap: 6,
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
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Layers size={14} />
              Bulk Apply
            </button>
            <button
              onClick={() => setScriptGenOpen(true)}
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
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent)';
              }}
            >
              <Code size={14} />
              Generate Script
            </button>
            <button
              onClick={handleSeed}
              disabled={seedMutation.isPending}
              className="flex items-center"
              style={{
                gap: 6,
                height: 36,
                padding: '0 14px',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                cursor: seedMutation.isPending ? 'not-allowed' : 'pointer',
                opacity: seedMutation.isPending ? 0.5 : 1,
                fontFamily: 'var(--font-sans)',
              }}
              onMouseEnter={(e) => {
                if (!seedMutation.isPending)
                  e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {seedMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              Seed Presets
            </button>
          </div>
        }
      />

      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '20px 24px 40px',
        }}
      >
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
            { key: 'presets' as const, label: 'Presets', icon: Zap },
            { key: 'transitions' as const, label: 'Page Transitions', icon: ArrowRightLeft },
            { key: 'performance' as const, label: 'Performance', icon: Gauge },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex items-center border-none cursor-pointer"
              style={{
                gap: 6,
                padding: '8px 16px',
                fontSize: 'var(--text-sm)',
                fontWeight: activeTab === key ? 600 : 400,
                fontFamily: 'var(--font-sans)',
                color: activeTab === key ? 'var(--text-primary)' : 'var(--text-tertiary)',
                backgroundColor: 'transparent',
                borderBottom: activeTab === key ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: -1,
                transition: 'color var(--duration-fast), border-color var(--duration-fast)',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== key) {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== key) {
                  e.currentTarget.style.color = 'var(--text-tertiary)';
                }
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Presets tab */}
        {activeTab === 'presets' && (
          <>
            {/* Master script reminder */}
            {presetList.length > 0 && !scriptGenOpen && (
              <div
                className="flex items-center"
                style={{
                  padding: '10px 14px',
                  gap: 8,
                  marginBottom: 16,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--accent-subtle)',
                }}
              >
                <AlertCircle
                  size={14}
                  style={{ color: 'var(--accent-text)', flexShrink: 0 }}
                />
                <span
                  style={{
                    flex: 1,
                    fontSize: 'var(--text-xs)',
                    color: 'var(--accent-text)',
                    lineHeight: 1.4,
                  }}
                >
                  Remember to generate your master script after adding animations.
                </span>
                <button
                  onClick={() => setScriptGenOpen(true)}
                  className="flex items-center shrink-0 border-none cursor-pointer"
                  style={{
                    gap: 4,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'transparent',
                    color: 'var(--accent-text)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    fontFamily: 'var(--font-sans)',
                    transition: 'background-color var(--duration-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--accent-muted)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Code size={12} />
                  Generate Script
                </button>
              </div>
            )}

            {/* Filters */}
            <div style={{ marginBottom: 20 }}>
              <PresetFiltersBar
                filters={filters}
                onChange={setFilters}
                resultCount={presetList.length}
              />
            </div>

            {/* Loading */}
            {isLoading && <SkeletonAnimationGrid count={12} />}

            {/* Error */}
            {error && (
              <div
                className="flex items-center justify-center"
                style={{
                  height: 300,
                  color: 'var(--error)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                Failed to load presets. Check that the server is running.
              </div>
            )}

            {/* Empty state — no presets seeded yet */}
            {hasNoPresets && (
              <div
                className="flex flex-col items-center justify-center"
                style={{
                  height: 300,
                  border: '1px dashed var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  gap: 12,
                }}
              >
                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-tertiary)',
                    margin: 0,
                  }}
                >
                  No animation presets found. Seed the system presets to get started.
                </p>
                <button
                  onClick={handleSeed}
                  disabled={seedMutation.isPending}
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--accent)';
                  }}
                >
                  <Download size={14} />
                  Seed System Presets
                </button>
              </div>
            )}

            {/* Empty state — filters returned nothing */}
            {isEmpty && !hasNoPresets && (
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
                No presets match the current filters.
              </div>
            )}

            {/* Preset grid */}
            {presetList.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                  gap: 12,
                }}
              >
                {presetList.map((preset) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    onSelect={handleSelect}
                    onDelete={!preset.isSystem ? handleDelete : undefined}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Page Transitions tab */}
        {activeTab === 'transitions' && <PageTransitions />}

        {/* Performance tab */}
        {activeTab === 'performance' && (
          <PerformanceHints
            animations={presetList.map((p) => {
              const props: string[] = ['transform', 'opacity'];
              if (p.config?.blur) props.push('filter');
              if (p.config?.scale || p.config?.rotate || p.config?.distance) {
                // transform already included
              }
              return {
                name: p.name,
                properties: props,
                duration: p.config?.duration ?? 0.6,
                engine: p.engine as 'css' | 'gsap',
                trigger: p.trigger as 'scroll' | 'hover' | 'click' | 'load',
              };
            })}
          />
        )}
      </div>

      {/* Configurator slide-over */}
      <ConfiguratorPanel
        preset={selectedPreset}
        open={configuratorOpen}
        onClose={handleCloseConfigurator}
      />

      {/* Script generator slide-over */}
      <ScriptGeneratorPanel
        open={scriptGenOpen}
        onClose={() => setScriptGenOpen(false)}
      />

      {/* Bulk attribute application */}
      <BulkAttributePanel
        open={bulkAttrOpen}
        onClose={() => setBulkAttrOpen(false)}
      />

      {/* Quick apply floating panel */}
      <QuickApplyPanel
        open={quickApplyOpen}
        onClose={() => setQuickApplyOpen(false)}
      />

      {/* Quick apply FAB */}
      {!quickApplyOpen && (
        <button
          onClick={() => setQuickApplyOpen(true)}
          className="flex items-center justify-center border-none cursor-pointer"
          title="Quick Apply Animation"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 44,
            height: 44,
            borderRadius: '50%',
            backgroundColor: 'var(--accent)',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 30,
            transition: 'transform var(--duration-fast), box-shadow var(--duration-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          }}
        >
          <Zap size={20} />
        </button>
      )}
    </>
  );
}
