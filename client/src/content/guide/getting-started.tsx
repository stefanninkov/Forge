import { guideStyles as s } from './guide-styles';

export function GettingStartedGuide() {
  return (
    <div style={s.section}>
      <h2 style={s.h2}>What is Forge?</h2>
      <p style={s.p}>
        Forge is a full-pipeline Webflow development accelerator. It takes a Webflow project
        from zero to fully optimized — from Figma design handoff through structure creation,
        animation setup, and live site optimization.
      </p>
      <p style={s.p}>
        Instead of switching between scattered tools, browser tabs, code editors, and checklists,
        Forge provides a single workspace for the entire Webflow development workflow.
      </p>

      <h2 style={s.h2}>Core Modules</h2>
      <ul style={s.ul}>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Project Setup</strong> — A guided
          checklist that walks through every configuration step for a new Webflow project. Automated
          where possible via Webflow MCP.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Figma Translator</strong> — Import a Figma
          file, analyze its layer structure, generate Client-First class names, assign semantic HTML
          tags, and push the resulting structure to Webflow.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Template Library</strong> — Save, organize,
          and reuse section templates. Capture from live sites or build from scratch.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Animation Engine</strong> — A data-attribute-based
          animation system with a visual playground, parameter configurator, and master script generator.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Scaling System</strong> — Fluid REM-based
          typography and spacing that scales smoothly across all viewport widths.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Audits</strong> — Speed, SEO, and AEO
          (AI Engine Optimization) analysis with actionable recommendations.
        </li>
      </ul>

      <h2 style={s.h2}>Quick Start</h2>
      <ol style={s.ol}>
        <li>Create a new project from the Dashboard.</li>
        <li>Connect your Webflow site via MCP token in Settings &rarr; Integrations.</li>
        <li>Connect your Figma account with a personal access token.</li>
        <li>Run through the Project Setup checklist to configure your site.</li>
        <li>Import your Figma design and build your structure.</li>
        <li>Add animations, configure scaling, and run audits.</li>
      </ol>

      <div style={s.tip}>
        <div style={s.calloutLabel}>Tip</div>
        Save your Project Setup configuration as a profile. When you start your next project,
        apply the profile to skip repeated setup steps.
      </div>

      <h2 style={s.h2}>How Forge Connects to Webflow</h2>
      <p style={s.p}>
        Forge uses the Webflow MCP (Model Context Protocol) to communicate with the Webflow
        Designer. This allows Forge to create elements, set attributes, push custom code, and
        read site structure — all without leaving the Forge interface.
      </p>
      <p style={s.p}>
        The MCP connection status is always visible in the sidebar. A green indicator means
        connected and ready. If the connection drops (for example, if you close the Webflow
        Designer), Forge will attempt to reconnect automatically.
      </p>

      <div style={s.note}>
        <div style={s.calloutLabel}>Note</div>
        Some actions in Forge require an active MCP connection. These actions will show a
        connection prompt if the link to Webflow is not active.
      </div>
    </div>
  );
}
