import { guideStyles as s } from './guide-styles';

export function AuditsGuide() {
  return (
    <div style={s.section}>
      <h2 style={s.h2}>Overview</h2>
      <p style={s.p}>
        Forge includes three audit modules that analyze your live Webflow site and provide
        actionable recommendations: Speed (performance), SEO (search engine optimization), and
        AEO (AI engine optimization). Each audit produces a score from 0-100 with categorized
        findings.
      </p>

      <h2 style={s.h2}>Running an Audit</h2>
      <ol style={s.ol}>
        <li>
          Open the audit module (Speed, SEO, or AEO) from the sidebar.
        </li>
        <li>
          Enter the URL to audit. This defaults to your linked Webflow site&apos;s staging or live URL
          if one is connected.
        </li>
        <li>
          Click "Run Audit". The analysis takes 10-30 seconds depending on the page complexity
          and audit type.
        </li>
        <li>
          Results appear as a score card at the top with detailed findings below, organized by
          category.
        </li>
      </ol>

      <div style={s.tip}>
        <div style={s.calloutLabel}>Tip</div>
        Run audits on your staging URL during development and your live URL after publishing.
        Staging and live results can differ due to caching, CDN, and DNS configuration.
      </div>

      <hr style={s.divider} />

      <h2 style={s.h2}>Speed Audit</h2>
      <p style={s.p}>
        The Speed audit uses the Google PageSpeed Insights API to measure real-world performance
        metrics. It tests both mobile and desktop and reports Core Web Vitals.
      </p>

      <h3 style={s.h3}>Score interpretation</h3>
      <ul style={s.ul}>
        <li>
          <strong style={{ color: 'var(--forge-500)' }}>80-100 (Green)</strong> — Good performance.
          Minor optimizations may still be possible.
        </li>
        <li>
          <strong style={{ color: 'var(--amber)' }}>60-79 (Amber)</strong> — Needs improvement.
          Users may notice slowness on slower connections or devices.
        </li>
        <li>
          <strong style={{ color: 'var(--red)' }}>0-59 (Red)</strong> — Critical issues.
          Performance is noticeably poor and likely affecting user experience and SEO rankings.
        </li>
      </ul>

      <h3 style={s.h3}>Categories</h3>
      <ul style={s.ul}>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Images</strong> — Unoptimized images,
          missing lazy loading, incorrect sizing, missing width/height attributes, WebP/AVIF
          opportunities.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Fonts</strong> — Render-blocking font
          loading, unused font faces, font-display settings, excessive font file sizes.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Scripts</strong> — Render-blocking
          scripts, large bundle sizes, unused JavaScript, third-party script impact.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Webflow Overhead</strong> — Webflow-specific
          performance issues: unused interactions, excessive custom code, heavy embedded widgets.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Core Web Vitals</strong> — LCP (Largest
          Contentful Paint), CLS (Cumulative Layout Shift), INP (Interaction to Next Paint).
        </li>
      </ul>

      <hr style={s.divider} />

      <h2 style={s.h2}>SEO Audit</h2>
      <p style={s.p}>
        The SEO audit analyzes your page structure, meta data, and technical SEO configuration.
        It checks for issues that affect search engine rankings and indexing.
      </p>

      <h3 style={s.h3}>Categories</h3>
      <ul style={s.ul}>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Meta Tags</strong> — Title tag (length,
          uniqueness), meta description (length, presence), Open Graph tags, Twitter Card tags.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Headings</strong> — Heading hierarchy
          (H1-H6 order), missing H1, multiple H1s, skipped heading levels.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Schema</strong> — JSON-LD structured
          data presence and validity, missing Organization/WebSite schema.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Links</strong> — Broken links, missing
          rel attributes on external links, orphan pages with no internal links.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Images</strong> — Missing alt text,
          decorative images without empty alt, overly generic alt text.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Technical</strong> — Canonical URLs,
          robots.txt directives, sitemap presence, HTTPS enforcement, mobile viewport meta tag.
        </li>
      </ul>

      <hr style={s.divider} />

      <h2 style={s.h2}>AEO Audit (AI Engine Optimization)</h2>
      <p style={s.p}>
        AEO analyzes how well your content is structured for AI-powered search engines (like
        Google AI Overviews, Perplexity, and ChatGPT search). These systems extract and
        synthesize information differently from traditional search crawlers.
      </p>

      <h3 style={s.h3}>What AEO checks</h3>
      <ul style={s.ul}>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>FAQ Schema</strong> — Presence and
          validity of FAQ structured data that AI systems can directly extract.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Q&A Patterns</strong> — Content
          formatted as clear question-and-answer pairs, even without schema markup.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Answer Paragraphs</strong> — Concise,
          self-contained paragraphs that directly answer implied questions. AI systems prefer
          content that can be extracted as standalone answers.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Entity Coverage</strong> — Clear
          identification of people, organizations, products, and concepts with sufficient context
          for AI systems to understand relationships.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Content Structure</strong> — Logical
          heading hierarchy, summary paragraphs, and clear topic segmentation that helps AI
          systems parse and categorize content.
        </li>
      </ul>

      <hr style={s.divider} />

      <h2 style={s.h2}>Understanding Findings</h2>
      <p style={s.p}>
        Each finding in an audit report includes:
      </p>
      <ul style={s.ul}>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Severity</strong> — Critical (red),
          warning (amber), or informational (blue). Focus on critical issues first.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Title</strong> — A short description
          of the issue.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Description</strong> — What the issue
          is and why it matters.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Affected URLs</strong> — Which pages
          have this issue (relevant for multi-page audits).
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Fix recommendation</strong> — Specific
          steps to resolve the issue.
        </li>
      </ul>

      <h2 style={s.h2}>Historical Tracking</h2>
      <p style={s.p}>
        Forge stores audit results over time and displays a trend chart showing how your scores
        change. Use this to track the impact of optimizations — run an audit before and after
        making changes to see the score difference.
      </p>

      <div style={s.note}>
        <div style={s.calloutLabel}>Note</div>
        PageSpeed scores can vary between runs due to server load, network conditions, and
        test infrastructure. A variation of 3-5 points between identical runs is normal.
        Focus on trends over time rather than individual scores.
      </div>
    </div>
  );
}
