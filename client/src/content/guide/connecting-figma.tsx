import { guideStyles as s } from './guide-styles';

export function ConnectingFigmaGuide() {
  return (
    <div style={s.section}>
      <h2 style={s.h2}>Overview</h2>
      <p style={s.p}>
        Forge connects to Figma using a personal access token. Once connected, you can paste any
        Figma file URL into the Figma Translator and Forge will fetch the file structure, analyze
        layers, extract styles, and generate a Webflow-ready element tree.
      </p>

      <h2 style={s.h2}>Generating a Figma Token</h2>
      <ol style={s.ol}>
        <li>Open Figma and click your profile icon in the top-left corner.</li>
        <li>
          Go to <strong style={{ color: 'var(--text-primary)' }}>Settings &rarr; Account</strong>.
        </li>
        <li>
          Scroll to <strong style={{ color: 'var(--text-primary)' }}>Personal access tokens</strong>.
        </li>
        <li>Click "Create new token", give it a descriptive name (e.g., "Forge"), and copy the token.</li>
      </ol>

      <div style={s.warning}>
        <div style={s.calloutLabel}>Important</div>
        The token is only shown once when created. Copy it immediately and store it somewhere
        safe. If you lose it, you will need to generate a new one.
      </div>

      <h2 style={s.h2}>Adding the Token to Forge</h2>
      <ol style={s.ol}>
        <li>
          In Forge, navigate to <strong style={{ color: 'var(--text-primary)' }}>Settings &rarr;
          Integrations</strong>.
        </li>
        <li>Paste the Figma token into the Figma field and click "Save".</li>
        <li>
          Forge validates the token by making a test API call. If successful, the status will show
          as connected.
        </li>
      </ol>

      <h2 style={s.h2}>What Forge Reads from Figma</h2>
      <p style={s.p}>
        When you import a Figma file, Forge reads the following data through the Figma REST API:
      </p>
      <ul style={s.ul}>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Layer hierarchy</strong> — Frames,
          groups, components, and their nesting structure.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Auto-layout properties</strong> — Direction,
          spacing, padding, alignment. These map to CSS flexbox.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Text styles</strong> — Font family, size,
          weight, line height, letter spacing, color.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Fill colors</strong> — Background colors,
          gradients, and image fills.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Component instances</strong> — References
          to reusable components and their overrides.
        </li>
      </ul>

      <div style={s.tip}>
        <div style={s.calloutLabel}>Tip</div>
        For best results, organize your Figma file with clear frame naming and consistent
        auto-layout usage. Forge produces more accurate structures from well-organized Figma files.
      </div>

      <h2 style={s.h2}>Preparing Your Figma File</h2>
      <p style={s.p}>
        Before importing into Forge, review your Figma file for these common issues:
      </p>
      <ul style={s.ul}>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Use auto-layout</strong> — Frames with
          auto-layout translate cleanly to flexbox. Frames without auto-layout produce
          absolutely-positioned elements, which is rarely what you want in Webflow.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Name your layers</strong> — Layer names
          become the basis for class names. "Frame 47" is not useful. "hero_content_wrapper" is.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Flatten decorative elements</strong> —
          Complex decorative shapes with many sub-layers should be flattened to a single image
          export. They do not need a deep DOM structure.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Use components for repeated elements</strong> —
          Cards, buttons, nav items. Forge detects component instances and can suggest reusable
          Webflow components.
        </li>
      </ul>

      <h2 style={s.h2}>Token Permissions</h2>
      <p style={s.p}>
        Figma personal access tokens grant read access to all files in your account. Forge only
        reads file data — it never modifies your Figma files. The token is stored securely in your
        account settings and is never shared with third parties.
      </p>

      <div style={s.note}>
        <div style={s.calloutLabel}>Note</div>
        If your Figma file is in a team project, make sure your account has viewer access (or
        higher) to the file. The token inherits your account permissions.
      </div>
    </div>
  );
}
