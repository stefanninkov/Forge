import { guideStyles as s } from './guide-styles';

export function ConnectingWebflowGuide() {
  return (
    <div style={s.section}>
      <h2 style={s.h2}>Overview</h2>
      <p style={s.p}>
        Forge connects to Webflow through the MCP (Model Context Protocol) Companion App. This
        connection lets Forge create elements, set styles, push custom code, and read your site
        structure directly inside the Webflow Designer.
      </p>

      <h2 style={s.h2}>Prerequisites</h2>
      <ul style={s.ul}>
        <li>A Webflow account with at least one site.</li>
        <li>The Webflow MCP Companion App installed in your Webflow workspace.</li>
        <li>Your Webflow project open in the Designer.</li>
      </ul>

      <h2 style={s.h2}>Getting Your MCP Token</h2>
      <ol style={s.ol}>
        <li>
          Open your Webflow workspace and navigate to <strong style={{ color: 'var(--text-primary)' }}>
          Workspace Settings &rarr; Integrations</strong>.
        </li>
        <li>
          Locate the MCP Companion App and copy the API token. If you have not installed it yet,
          click "Add App" and follow the prompts.
        </li>
        <li>
          Keep this token private. It grants full access to create and modify elements in your
          Webflow projects.
        </li>
      </ol>

      <h2 style={s.h2}>Connecting in Forge</h2>
      <ol style={s.ol}>
        <li>
          In Forge, go to <strong style={{ color: 'var(--text-primary)' }}>Settings &rarr;
          Integrations</strong>.
        </li>
        <li>
          Paste your Webflow MCP token into the Webflow field and click "Save".
        </li>
        <li>
          Forge will validate the token and establish a connection. The sidebar will show a green
          status indicator when connected.
        </li>
      </ol>

      <div style={s.tip}>
        <div style={s.calloutLabel}>Tip</div>
        Make sure the Webflow Designer is open with your project loaded before testing the
        connection. The MCP requires an active Designer session.
      </div>

      <h2 style={s.h2}>Connection Status</h2>
      <p style={s.p}>
        The connection status is shown in the sidebar beneath your project name. There are three
        states:
      </p>
      <ul style={s.ul}>
        <li>
          <strong style={{ color: 'var(--forge-500)' }}>Green</strong> — Connected and ready.
          All MCP operations are available.
        </li>
        <li>
          <strong style={{ color: 'var(--amber)' }}>Amber</strong> — Reconnecting. Forge
          detected a dropped connection and is attempting to restore it.
        </li>
        <li>
          <strong style={{ color: 'var(--red)' }}>Red</strong> — Disconnected. MCP operations
          are blocked. Check that the Designer is open.
        </li>
      </ul>

      <h2 style={s.h2}>Troubleshooting</h2>
      <h3 style={s.h3}>Connection keeps dropping</h3>
      <p style={s.p}>
        The MCP connection requires the Webflow Designer to be open. If you close the Designer
        tab or navigate away, the connection will drop. Forge will attempt to reconnect
        automatically when you reopen the Designer.
      </p>

      <h3 style={s.h3}>Token rejected</h3>
      <p style={s.p}>
        Verify that the token is from the correct workspace. Tokens are workspace-scoped — a
        token from workspace A will not work for sites in workspace B.
      </p>

      <h3 style={s.h3}>Operations failing despite green status</h3>
      <p style={s.p}>
        Try refreshing the Webflow Designer tab, then click the reconnect button in Forge. Some
        MCP operations require a fresh session after the Designer has been idle for an extended
        period.
      </p>

      <div style={s.warning}>
        <div style={s.calloutLabel}>Important</div>
        Never share your MCP token publicly or commit it to version control. If a token is
        compromised, regenerate it immediately from your Webflow workspace settings.
      </div>
    </div>
  );
}
