import { guideStyles as s } from './guide-styles';

export function TemplatesGuide() {
  return (
    <div style={s.section}>
      <h2 style={s.h2}>Overview</h2>
      <p style={s.p}>
        The Template Library stores reusable section structures that you can push to any Webflow
        project. Templates include HTML structure, class names, animation attributes, and
        optionally styles — everything needed to recreate a section without rebuilding from scratch.
      </p>

      <h2 style={s.h2}>Template Types</h2>
      <ul style={s.ul}>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Skeleton</strong> — Structure only.
          Contains the element hierarchy, class names, semantic HTML tags, and animation
          attributes, but no visual styles. Use this when your projects have different design
          systems but share structural patterns.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Styled</strong> — Structure plus CSS.
          Includes computed styles captured from the source. Use this when you want to replicate
          the exact appearance.
        </li>
      </ul>

      <h2 style={s.h2}>Browsing Templates</h2>
      <p style={s.p}>
        The library displays templates as a card grid. Each card shows a visual preview thumbnail,
        the template name, a category badge, and a type badge (skeleton or styled).
      </p>
      <p style={s.p}>
        Use the top bar to filter by category (Hero, Features, Testimonials, CTA, Footer, etc.),
        search by name, or sort by date or name. Categories can be customized in project settings.
      </p>

      <h2 style={s.h2}>Creating Templates</h2>

      <h3 style={s.h3}>From the Figma Translator</h3>
      <p style={s.p}>
        After importing and editing a Figma structure, you can save any section as a template.
        Select the section node in the tree, click the action menu, and choose "Save as Template".
        Give it a name and category.
      </p>

      <h3 style={s.h3}>From a live URL</h3>
      <ol style={s.ol}>
        <li>
          Click "New Template" and choose the "Capture from URL" method.
        </li>
        <li>
          Enter the URL of a live website. Forge loads the page server-side (to avoid CORS
          restrictions) and renders it in a preview iframe.
        </li>
        <li>
          Click on the section you want to capture. Forge highlights the selected element and
          its boundaries.
        </li>
        <li>
          Click "Capture". Forge extracts the HTML subtree, computed CSS, and any inline scripts
          targeting those elements.
        </li>
        <li>
          Choose skeleton or styled mode, name the template, assign a category, and save.
        </li>
      </ol>

      <div style={s.note}>
        <div style={s.calloutLabel}>Note</div>
        URL capture works best with well-structured sites. Sites with heavy JavaScript rendering
        or authentication-gated content may not capture correctly.
      </div>

      <h3 style={s.h3}>From Webflow via MCP</h3>
      <ol style={s.ol}>
        <li>
          Click "New Template" and choose "Save from Webflow".
        </li>
        <li>
          A modal appears with a site selector (from your connected MCP sites). Choose the site
          and page.
        </li>
        <li>
          Select the element you want to capture using the element browser.
        </li>
        <li>
          Choose skeleton or styled mode and save.
        </li>
      </ol>

      <h2 style={s.h2}>Using Templates</h2>
      <ol style={s.ol}>
        <li>
          Open a template card and click "Push to Webflow" (or use the action menu on the card).
        </li>
        <li>
          Select the target page and insertion point in your Webflow project.
        </li>
        <li>
          Forge creates the element structure via MCP, applying class names, semantic tags,
          and animation attributes.
        </li>
        <li>
          If the template is styled, Forge also creates the associated CSS classes with the
          captured styles.
        </li>
      </ol>

      <div style={s.tip}>
        <div style={s.calloutLabel}>Tip</div>
        Build a library of skeleton templates for your most common section types (hero, features
        grid, testimonials slider, CTA, footer). With consistent class naming, you can push a
        complete page structure in under a minute.
      </div>

      <h2 style={s.h2}>Managing Templates</h2>
      <p style={s.p}>
        Each template card has an action menu with the following options:
      </p>
      <ul style={s.ul}>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Edit</strong> — Open the template in the
          structure tree editor to modify elements, class names, or tags.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Duplicate</strong> — Create a copy
          of the template as a starting point for a variation.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Delete</strong> — Remove the template
          from your library. This does not affect any Webflow elements that were previously
          created from this template.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Push to Webflow</strong> — Push the
          template structure directly into your connected Webflow project.
        </li>
      </ul>
    </div>
  );
}
