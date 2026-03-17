import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { usePageTitle } from '@/hooks/use-page-title';
import { User, Palette, Plug } from 'lucide-react';
import { AccountSection } from '@/components/modules/settings/account-section';
import { AppearanceSection } from '@/components/modules/settings/appearance-section';
import { IntegrationsSection } from '@/components/modules/settings/integrations-section';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';

type SettingsTab = 'account' | 'integrations' | 'appearance';

const TABS: { key: SettingsTab; label: string; icon: ComponentType<LucideProps> }[] = [
  { key: 'account', label: 'Account', icon: User },
  { key: 'integrations', label: 'Integrations', icon: Plug },
  { key: 'appearance', label: 'Appearance', icon: Palette },
];

export default function SettingsPage() {
  usePageTitle('Settings');
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your account, integrations, and appearance."
      />

      <div style={{ padding: '0 24px 24px' }}>
        <div style={{ maxWidth: 720 }}>
          {/* Tabs */}
          <div
            className="flex"
            style={{
              gap: 0,
              borderBottom: '1px solid var(--border-default)',
              marginBottom: 24,
            }}
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex items-center"
                  style={{
                    height: 40,
                    padding: '0 14px',
                    gap: 6,
                    border: 'none',
                    borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                    backgroundColor: 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: isActive ? 500 : 400,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    transition: 'color var(--duration-fast)',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          {activeTab === 'account' && <AccountSection />}
          {activeTab === 'integrations' && <IntegrationsSection />}
          {activeTab === 'appearance' && <AppearanceSection />}
        </div>
      </div>
    </div>
  );
}
