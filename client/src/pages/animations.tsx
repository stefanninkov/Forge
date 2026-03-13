import { useState, useCallback, useMemo } from 'react';
import { Code, Download, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { usePageTitle } from '@/hooks/use-page-title';
import { PresetCard } from '@/components/modules/animations/preset-card';
import { PresetFiltersBar } from '@/components/modules/animations/preset-filters';
import { ConfiguratorPanel } from '@/components/modules/animations/configurator-panel';
import { ScriptGeneratorPanel } from '@/components/modules/animations/script-generator-panel';
import { useAnimationPresets, useSeedPresets, useDeleteAnimationPreset } from '@/hooks/use-animations';
import type { AnimationPreset, PresetFilters } from '@/types/animation';

export default function AnimationsPage() {
  usePageTitle('Animations');
  const [filters, setFilters] = useState<PresetFilters>({});
  const [selectedPreset, setSelectedPreset] = useState<AnimationPreset | null>(null);
  const [configuratorOpen, setConfiguratorOpen] = useState(false);
  const [scriptGenOpen, setScriptGenOpen] = useState(false);

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
        {/* Filters */}
        <div style={{ marginBottom: 20 }}>
          <PresetFiltersBar
            filters={filters}
            onChange={setFilters}
            resultCount={presetList.length}
          />
        </div>

        {/* Loading */}
        {isLoading && (
          <div
            className="flex items-center justify-center"
            style={{
              height: 300,
              color: 'var(--text-tertiary)',
              fontSize: 'var(--text-sm)',
            }}
          >
            <Loader2
              size={20}
              className="animate-spin"
              style={{ marginRight: 8, color: 'var(--accent)' }}
            />
            Loading presets...
          </div>
        )}

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
    </>
  );
}
