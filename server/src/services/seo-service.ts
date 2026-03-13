import { parse as parseHTML } from 'node-html-parser';
import { Prisma } from '@prisma/client';
import { prisma } from '../db/client.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { checkScoreDrop } from './audit-service.js';

interface SeoFinding {
  category: string;
  severity: 'error' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  element?: string;
  recommendation: string;
}

async function fetchHTML(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Forge-SEO-Audit/1.0' },
    redirect: 'follow',
  });
  if (!response.ok) {
    throw new ValidationError(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/html')) {
    throw new ValidationError('URL did not return HTML content');
  }
  return response.text();
}

function analyzeMeta(root: ReturnType<typeof parseHTML>): SeoFinding[] {
  const findings: SeoFinding[] = [];

  // Title
  const title = root.querySelector('title');
  const titleText = title?.text?.trim() ?? '';
  if (!titleText) {
    findings.push({ category: 'meta', severity: 'error', title: 'Missing page title', description: 'The page has no <title> tag.', recommendation: 'Add a descriptive title tag between 30-60 characters.' });
  } else if (titleText.length < 30) {
    findings.push({ category: 'meta', severity: 'warning', title: 'Title too short', description: `Title is ${titleText.length} characters: "${titleText}"`, recommendation: 'Aim for 30-60 characters for optimal search display.' });
  } else if (titleText.length > 60) {
    findings.push({ category: 'meta', severity: 'warning', title: 'Title too long', description: `Title is ${titleText.length} characters and may be truncated in search results.`, recommendation: 'Keep title under 60 characters.' });
  } else {
    findings.push({ category: 'meta', severity: 'success', title: 'Title length is good', description: `Title is ${titleText.length} characters.`, recommendation: '' });
  }

  // Meta description
  const metaDesc = root.querySelector('meta[name="description"]');
  const descContent = metaDesc?.getAttribute('content')?.trim() ?? '';
  if (!descContent) {
    findings.push({ category: 'meta', severity: 'error', title: 'Missing meta description', description: 'No meta description tag found.', recommendation: 'Add a meta description between 120-160 characters.' });
  } else if (descContent.length < 120) {
    findings.push({ category: 'meta', severity: 'warning', title: 'Meta description too short', description: `Description is ${descContent.length} characters.`, recommendation: 'Aim for 120-160 characters.' });
  } else if (descContent.length > 160) {
    findings.push({ category: 'meta', severity: 'warning', title: 'Meta description too long', description: `Description is ${descContent.length} characters and may be truncated.`, recommendation: 'Keep under 160 characters.' });
  } else {
    findings.push({ category: 'meta', severity: 'success', title: 'Meta description length is good', description: `Description is ${descContent.length} characters.`, recommendation: '' });
  }

  // Viewport
  const viewport = root.querySelector('meta[name="viewport"]');
  if (!viewport) {
    findings.push({ category: 'meta', severity: 'error', title: 'Missing viewport meta', description: 'No viewport meta tag found.', recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.' });
  } else {
    findings.push({ category: 'meta', severity: 'success', title: 'Viewport meta tag present', description: '', recommendation: '' });
  }

  // Robots
  const robots = root.querySelector('meta[name="robots"]');
  const robotsContent = robots?.getAttribute('content')?.toLowerCase() ?? '';
  if (robotsContent.includes('noindex')) {
    findings.push({ category: 'meta', severity: 'warning', title: 'Page set to noindex', description: 'This page will not appear in search results.', recommendation: 'Remove noindex if this page should be indexed.' });
  }

  return findings;
}

function analyzeHeadings(root: ReturnType<typeof parseHTML>): SeoFinding[] {
  const findings: SeoFinding[] = [];

  const h1s = root.querySelectorAll('h1');
  if (h1s.length === 0) {
    findings.push({ category: 'headings', severity: 'error', title: 'Missing H1 tag', description: 'No H1 heading found on the page.', recommendation: 'Add exactly one H1 that describes the page content.' });
  } else if (h1s.length > 1) {
    findings.push({ category: 'headings', severity: 'warning', title: 'Multiple H1 tags', description: `Found ${h1s.length} H1 tags. Best practice is to have exactly one.`, recommendation: 'Use a single H1 per page. Use H2-H6 for subsections.' });
  } else {
    findings.push({ category: 'headings', severity: 'success', title: 'Single H1 tag present', description: `H1: "${h1s[0]?.text.trim().slice(0, 60) ?? ''}"`, recommendation: '' });
  }

  // Check heading hierarchy
  const headings = root.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let prevLevel = 0;
  let skippedLevels = 0;
  for (const h of headings) {
    const level = parseInt(h.tagName.charAt(1));
    if (prevLevel > 0 && level > prevLevel + 1) {
      skippedLevels++;
    }
    prevLevel = level;
  }

  if (skippedLevels > 0) {
    findings.push({ category: 'headings', severity: 'warning', title: 'Heading hierarchy has skipped levels', description: `Found ${skippedLevels} instances where heading levels were skipped (e.g., H2 → H4).`, recommendation: 'Use heading levels sequentially without skipping (H1 → H2 → H3).' });
  } else if (headings.length > 0) {
    findings.push({ category: 'headings', severity: 'success', title: 'Heading hierarchy is correct', description: `${headings.length} headings with proper nesting.`, recommendation: '' });
  }

  return findings;
}

function analyzeImages(root: ReturnType<typeof parseHTML>): SeoFinding[] {
  const findings: SeoFinding[] = [];
  const images = root.querySelectorAll('img');

  if (images.length === 0) {
    findings.push({ category: 'images', severity: 'info', title: 'No images found', description: '', recommendation: '' });
    return findings;
  }

  let missingAlt = 0;
  let emptyAlt = 0;
  for (const img of images) {
    const alt = img.getAttribute('alt');
    if (alt === undefined || alt === null) {
      missingAlt++;
    } else if (alt.trim() === '') {
      emptyAlt++;
    }
  }

  if (missingAlt > 0) {
    findings.push({ category: 'images', severity: 'error', title: 'Images missing alt attribute', description: `${missingAlt} of ${images.length} images have no alt attribute.`, recommendation: 'Add descriptive alt text to all images for accessibility and SEO.' });
  }
  if (emptyAlt > 0) {
    findings.push({ category: 'images', severity: 'info', title: 'Images with empty alt text', description: `${emptyAlt} images have empty alt attributes (decorative).`, recommendation: 'Ensure decorative images intentionally have empty alt. Content images need descriptive alt text.' });
  }
  if (missingAlt === 0 && emptyAlt === 0) {
    findings.push({ category: 'images', severity: 'success', title: 'All images have alt text', description: `${images.length} images all have alt attributes.`, recommendation: '' });
  }

  // Check for lazy loading
  let lazyCount = 0;
  for (const img of images) {
    if (img.getAttribute('loading') === 'lazy') lazyCount++;
  }
  if (images.length > 3 && lazyCount === 0) {
    findings.push({ category: 'images', severity: 'warning', title: 'No lazy-loaded images', description: `None of ${images.length} images use loading="lazy".`, recommendation: 'Add loading="lazy" to below-the-fold images to improve page speed.' });
  }

  return findings;
}

function analyzeSchema(root: ReturnType<typeof parseHTML>): SeoFinding[] {
  const findings: SeoFinding[] = [];
  const jsonLdScripts = root.querySelectorAll('script[type="application/ld+json"]');

  if (jsonLdScripts.length === 0) {
    findings.push({ category: 'schema', severity: 'warning', title: 'No structured data found', description: 'No JSON-LD schema markup detected.', recommendation: 'Add structured data (Organization, WebSite, Article, FAQ, etc.) to improve rich results.' });
  } else {
    let validCount = 0;
    let invalidCount = 0;
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script.text);
        const schemaType = data['@type'] ?? 'Unknown';
        validCount++;
        findings.push({ category: 'schema', severity: 'success', title: `Valid JSON-LD: ${schemaType}`, description: '', recommendation: '' });
      } catch {
        invalidCount++;
        findings.push({ category: 'schema', severity: 'error', title: 'Invalid JSON-LD', description: 'A JSON-LD script tag contains invalid JSON.', recommendation: 'Fix the JSON syntax in the structured data.' });
      }
    }
    if (validCount > 0 && invalidCount === 0) {
      findings.push({ category: 'schema', severity: 'success', title: `${validCount} valid schema(s) found`, description: '', recommendation: '' });
    }
  }

  return findings;
}

function analyzeLinks(root: ReturnType<typeof parseHTML>, url: string): SeoFinding[] {
  const findings: SeoFinding[] = [];
  const links = root.querySelectorAll('a[href]');
  const baseHost = new URL(url).hostname;

  let internalCount = 0;
  let externalCount = 0;
  let noHrefCount = 0;
  let hashOnlyCount = 0;

  for (const link of links) {
    const href = link.getAttribute('href') ?? '';
    if (!href || href === '#') {
      hashOnlyCount++;
      continue;
    }
    try {
      const linkUrl = new URL(href, url);
      if (linkUrl.hostname === baseHost) internalCount++;
      else externalCount++;
    } catch {
      noHrefCount++;
    }
  }

  findings.push({ category: 'links', severity: 'info', title: 'Link summary', description: `${internalCount} internal, ${externalCount} external, ${hashOnlyCount} anchor-only links.`, recommendation: '' });

  if (hashOnlyCount > 3) {
    findings.push({ category: 'links', severity: 'warning', title: 'Multiple empty anchor links', description: `${hashOnlyCount} links point to "#" only.`, recommendation: 'Replace empty anchors with proper links or buttons.' });
  }

  // Check for nofollow on internal links
  let nofollowInternal = 0;
  for (const link of links) {
    const rel = link.getAttribute('rel') ?? '';
    const href = link.getAttribute('href') ?? '';
    if (rel.includes('nofollow')) {
      try {
        const linkUrl = new URL(href, url);
        if (linkUrl.hostname === baseHost) nofollowInternal++;
      } catch { /* skip */ }
    }
  }
  if (nofollowInternal > 0) {
    findings.push({ category: 'links', severity: 'warning', title: 'Nofollow on internal links', description: `${nofollowInternal} internal links have rel="nofollow".`, recommendation: 'Remove nofollow from internal links to allow proper link equity flow.' });
  }

  return findings;
}

function analyzeTechnical(root: ReturnType<typeof parseHTML>): SeoFinding[] {
  const findings: SeoFinding[] = [];

  // Canonical
  const canonical = root.querySelector('link[rel="canonical"]');
  if (!canonical) {
    findings.push({ category: 'technical', severity: 'warning', title: 'Missing canonical tag', description: 'No canonical URL specified.', recommendation: 'Add a canonical tag to prevent duplicate content issues.' });
  } else {
    findings.push({ category: 'technical', severity: 'success', title: 'Canonical tag present', description: canonical.getAttribute('href') ?? '', recommendation: '' });
  }

  // OG tags
  const ogTitle = root.querySelector('meta[property="og:title"]');
  const ogDesc = root.querySelector('meta[property="og:description"]');
  const ogImage = root.querySelector('meta[property="og:image"]');
  const missingOg = [];
  if (!ogTitle) missingOg.push('og:title');
  if (!ogDesc) missingOg.push('og:description');
  if (!ogImage) missingOg.push('og:image');

  if (missingOg.length > 0) {
    findings.push({ category: 'technical', severity: 'warning', title: 'Missing Open Graph tags', description: `Missing: ${missingOg.join(', ')}`, recommendation: 'Add Open Graph tags for better social media sharing previews.' });
  } else {
    findings.push({ category: 'technical', severity: 'success', title: 'Open Graph tags complete', description: '', recommendation: '' });
  }

  // Language
  const html = root.querySelector('html');
  const lang = html?.getAttribute('lang');
  if (!lang) {
    findings.push({ category: 'technical', severity: 'warning', title: 'Missing lang attribute', description: 'The <html> element has no lang attribute.', recommendation: 'Add lang="en" (or appropriate language) to the html element.' });
  } else {
    findings.push({ category: 'technical', severity: 'success', title: 'Language attribute set', description: `lang="${lang}"`, recommendation: '' });
  }

  // Character encoding
  const charset = root.querySelector('meta[charset]');
  if (!charset) {
    findings.push({ category: 'technical', severity: 'warning', title: 'Missing charset declaration', description: '', recommendation: 'Add <meta charset="UTF-8"> to the head.' });
  }

  return findings;
}

function calculateScore(findings: SeoFinding[]): number {
  let score = 100;
  for (const f of findings) {
    if (f.severity === 'error') score -= 10;
    else if (f.severity === 'warning') score -= 3;
  }
  return Math.max(0, Math.min(100, score));
}

export async function runSeoAudit(projectId: string, url: string, userId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { userId: true } });
  if (!project) throw new NotFoundError('Project not found');
  if (project.userId !== userId) throw new NotFoundError('Project not found');

  try {
    new URL(url);
  } catch {
    throw new ValidationError('Invalid URL');
  }

  const html = await fetchHTML(url);
  const root = parseHTML(html);

  const findings = [
    ...analyzeMeta(root),
    ...analyzeHeadings(root),
    ...analyzeImages(root),
    ...analyzeSchema(root),
    ...analyzeLinks(root, url),
    ...analyzeTechnical(root),
  ];

  const categories: Record<string, number> = {};
  for (const f of findings) {
    categories[f.category] = (categories[f.category] ?? 0) + 1;
  }

  const score = calculateScore(findings);

  const audit = await prisma.audit.create({
    data: {
      projectId,
      type: 'SEO',
      urlAudited: url,
      score,
      results: { categories, findings } as unknown as Prisma.InputJsonValue,
    },
  });

  await checkScoreDrop(projectId, 'SEO', score, audit.id);

  return audit;
}
