import { PageHeader } from '@/components/layout/page-header';

export default function SpeedPage() {
  return (
    <>
      <PageHeader
        title="Page Speed"
        description="Analyze and optimize your site performance."
      />
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '24px',
        }}
      >
        <div
          className="flex items-center justify-center"
          style={{
            height: 400,
            border: '1px dashed var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--text-tertiary)',
            fontSize: 'var(--text-sm)',
          }}
        >
          Speed audit dashboard will be built in a later phase.
        </div>
      </div>
    </>
  );
}
