import { guideStyles as s } from './guide-styles';

export function FigmaTranslatorGuide() {
  return (
    <div style={s.section}>
      <h2 style={s.h2}>Overview</h2>
      <p style={s.p}>
        The Figma Translator converts a Figma design file into a Webflow-ready element structure.
        It analyzes your Figma layers, generates semantic HTML with Client-First class names,
        and lets you edit the structure before pushing it to Webflow via MCP.
      </p>

      <h2 style={s.h2}>Importing a Figma File</h2>
      <ol style={s.ol}>
        <li>
          Open the Figma Translator from the sidebar (requires a connected Figma token).
        </li>
        <li>
          Paste the URL of your Figma file. The URL format is{' '}
          <code style={s.code}>figma.com/design/FILE_KEY/File-Name</code>.
        </li>
        <li>
          Select which page to import. Choose a specific page or "All pages" if the file is small.
        </li>
        <li>
          Click "Analyze". Forge fetches the file via the Figma API, parses the layer hierarchy,
          and generates the structure tree. This typically takes 5-15 seconds depending on file
          complexity.
        </li>
      </ol>

      <div style={s.tip}>
        <div style={s.calloutLabel}>Tip</div>
        For large files with many pages, import one page at a time. This produces more focused
        results and avoids API rate limits.
      </div>

      <h2 style={s.h2}>The Structure Tree</h2>
      <p style={s.p}>
        After analysis, Forge displays a split-pane view: the Figma structure on the left and
        the Webflow structure preview on the right. Each node in the tree shows:
      </p>
      <ul style={s.ul}>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Element name</strong> — Derived from
          the Figma layer name.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Class name</strong> — A suggested
          Client-First class name, shown in monospace. Editable by double-clicking.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>HTML tag badge</strong> — The semantic
          HTML tag assigned to this element (section, nav, h2, div, etc.). Color-coded by
          semantic value.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Element type</strong> — The structural
          role: container, wrapper, text, image, link, etc.
        </li>
      </ul>

      <h2 style={s.h2}>Editing the Structure</h2>

      <h3 style={s.h3}>Renaming classes</h3>
      <p style={s.p}>
        Double-click any class name in the tree to edit it inline. Forge auto-generates class
        names following Client-First conventions, but you can override them to match your
        project naming.
      </p>

      <h3 style={s.h3}>Re-nesting elements</h3>
      <p style={s.p}>
        Drag and drop nodes to change the element hierarchy. This is useful when the Figma
        structure does not match the ideal DOM structure — for example, moving a heading outside
        a decorative wrapper so it sits at the correct semantic level.
      </p>

      <h3 style={s.h3}>Changing HTML tags</h3>
      <p style={s.p}>
        Click the tag badge on any node to open the tag selector. Tags are grouped by HTML
        category: Sectioning (section, article, nav, aside, header, footer, main), Heading
        (h1-h6), Text (p, span, blockquote), Interactive (a, button), Media (img, video,
        figure), Form (form, input, label), and Generic (div, span).
      </p>

      <h3 style={s.h3}>Semantic HTML color coding</h3>
      <ul style={s.ul}>
        <li>
          <strong style={{ color: 'var(--forge-500)' }}>Green</strong> — Semantic tag assigned
          (section, nav, h2, etc.)
        </li>
        <li>
          <strong style={{ color: 'var(--text-tertiary)' }}>Gray</strong> — Generic tag (div, span)
        </li>
        <li>
          <strong style={{ color: 'var(--amber)' }}>Amber</strong> — Suggestion pending (Forge
          recommends a semantic tag but it has not been accepted)
        </li>
        <li>
          <strong style={{ color: 'var(--red)' }}>Red</strong> — Accessibility issue detected
          (skipped heading level, missing alt text, etc.)
        </li>
      </ul>

      <h2 style={s.h2}>AI Assist</h2>
      <p style={s.p}>
        Toggle AI Assist in the page header to get AI-powered suggestions. When enabled, Forge
        sends the structure to Claude for analysis and returns:
      </p>
      <ul style={s.ul}>
        <li>Improved class name suggestions based on element context.</li>
        <li>Semantic HTML tag recommendations.</li>
        <li>Section type identification (hero, features, testimonials, CTA, etc.).</li>
        <li>Potential accessibility improvements.</li>
      </ul>
      <p style={s.p}>
        AI suggestions appear as highlighted annotations on the tree. Accept them individually
        or use "Accept All" to apply all suggestions at once.
      </p>

      <h2 style={s.h2}>Pre-Push Review</h2>
      <p style={s.p}>
        Before pushing, Forge runs a final audit that checks:
      </p>
      <ul style={s.ul}>
        <li>Heading hierarchy — no skipped levels, one H1 per page.</li>
        <li>Semantic coverage — how many elements have semantic tags vs generic divs.</li>
        <li>Class name conflicts — duplicate names that would collide in Webflow.</li>
        <li>Nesting depth — warns if elements are nested beyond what Webflow handles well.</li>
      </ul>

      <h2 style={s.h2}>Pushing to Webflow</h2>
      <ol style={s.ol}>
        <li>
          Click "Push to Webflow" to open the push dialog. Verify the target project and
          connection status.
        </li>
        <li>
          Choose a target page — create a new page or select an existing one.
        </li>
        <li>
          Configure what to include: structure and classes (always included), styles from Figma
          (optional), text content (optional), animation attributes (optional).
        </li>
        <li>
          Click "Push". Forge creates elements in Webflow via MCP. Due to the 3-level nesting
          limit, the push is automatically batched into sequential calls.
        </li>
        <li>
          After the push completes, a summary shows what was created. If animation attributes were
          included, you will be reminded to generate the master script.
        </li>
      </ol>

      <div style={s.note}>
        <div style={s.calloutLabel}>Note</div>
        The push creates elements with classes and attributes but does not apply visual styling
        in Webflow. Use the Webflow Designer to apply your design system styles to the pushed
        elements.
      </div>
    </div>
  );
}
