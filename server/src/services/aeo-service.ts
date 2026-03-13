import { parse as parseHTML } from 'node-html-parser';
import { Prisma } from '@prisma/client';
import { prisma } from '../db/client.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { checkScoreDrop } from './audit-service.js';

interface AeoFinding {
  category: string;
  severity: 'error' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  element?: string;
  recommendation: string;
}

async function fetchHTML(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Forge-AEO-Audit/1.0' },
    redirect: 'follow',
  });
  if (!response.ok) {
    throw new ValidationError(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

function analyzeFaqSchema(root: ReturnType<typeof parseHTML>): AeoFinding[] {
  const findings: AeoFinding[] = [];
  const jsonLdScripts = root.querySelectorAll('script[type="application/ld+json"]');

  let hasFaqSchema = false;
  let hasQaSchema = false;

  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script.text);
      const type = data['@type'];
      if (type === 'FAQPage') {
        hasFaqSchema = true;
        const questions = data.mainEntity ?? [];
        if (Array.isArray(questions) && questions.length > 0) {
          findings.push({ category: 'faq-schema', severity: 'success', title: 'FAQPage schema found', description: `Contains ${questions.length} question(s).`, recommendation: '' });

          // Validate each Q&A pair
          let invalidQa = 0;
          for (const q of questions) {
            if (!q.name || !q.acceptedAnswer?.text) invalidQa++;
          }
          if (invalidQa > 0) {
            findings.push({ category: 'faq-schema', severity: 'warning', title: 'Incomplete FAQ entries', description: `${invalidQa} FAQ items missing question name or answer text.`, recommendation: 'Ensure each FAQ item has both "name" (question) and "acceptedAnswer.text" (answer).' });
          }
        } else {
          findings.push({ category: 'faq-schema', severity: 'warning', title: 'FAQPage schema has no questions', description: 'mainEntity array is empty.', recommendation: 'Add Question/Answer pairs to the FAQPage schema.' });
        }
      }
      if (type === 'QAPage' || type === 'Question') hasQaSchema = true;
    } catch {
      // Invalid JSON handled by SEO audit
    }
  }

  if (!hasFaqSchema && !hasQaSchema) {
    findings.push({ category: 'faq-schema', severity: 'warning', title: 'No FAQ/QA schema found', description: 'No FAQPage or QAPage structured data detected.', recommendation: 'Add FAQPage schema to help AI engines extract Q&A content directly.' });
  }

  return findings;
}

function analyzeQaStructure(root: ReturnType<typeof parseHTML>): AeoFinding[] {
  const findings: AeoFinding[] = [];

  // Look for question-like headings (H2, H3 with "?" or starting with question words)
  const headings = root.querySelectorAll('h2, h3');
  const questionWords = /^(what|how|why|when|where|who|which|can|does|do|is|are|will|should)\b/i;
  let questionHeadings = 0;

  for (const h of headings) {
    const text = h.text.trim();
    if (text.includes('?') || questionWords.test(text)) {
      questionHeadings++;
    }
  }

  if (questionHeadings >= 3) {
    findings.push({ category: 'qa-structure', severity: 'success', title: 'Good Q&A content structure', description: `${questionHeadings} question-format headings found.`, recommendation: '' });
  } else if (questionHeadings > 0) {
    findings.push({ category: 'qa-structure', severity: 'info', title: 'Some Q&A content detected', description: `${questionHeadings} question-format heading(s). Consider adding more for AI visibility.`, recommendation: 'Structure content as clear questions and answers using H2/H3 headings.' });
  } else {
    findings.push({ category: 'qa-structure', severity: 'warning', title: 'No Q&A content structure', description: 'No question-format headings (H2/H3) found.', recommendation: 'Reformat key content as questions and answers — AI engines prefer this structure.' });
  }

  // Look for accordion/FAQ patterns in HTML
  const detailsElements = root.querySelectorAll('details');
  if (detailsElements.length > 0) {
    findings.push({ category: 'qa-structure', severity: 'success', title: 'Accordion/details elements found', description: `${detailsElements.length} expandable content sections.`, recommendation: '' });
  }

  return findings;
}

function analyzeAnswerOptimization(root: ReturnType<typeof parseHTML>): AeoFinding[] {
  const findings: AeoFinding[] = [];

  // Check paragraphs that follow question headings for optimal length
  const allElements = root.querySelectorAll('h2, h3, p');
  let optimizedAnswers = 0;
  let longAnswers = 0;
  let shortAnswers = 0;
  let lastWasQuestion = false;

  const questionWords = /^(what|how|why|when|where|who|which|can|does|do|is|are|will|should)\b/i;

  for (const el of allElements) {
    if (el.tagName === 'H2' || el.tagName === 'H3') {
      const text = el.text.trim();
      lastWasQuestion = text.includes('?') || questionWords.test(text);
      continue;
    }

    if (lastWasQuestion && el.tagName === 'P') {
      const words = el.text.trim().split(/\s+/).length;
      if (words >= 40 && words <= 60) {
        optimizedAnswers++;
      } else if (words > 100) {
        longAnswers++;
      } else if (words < 20) {
        shortAnswers++;
      }
      lastWasQuestion = false;
    }
  }

  if (optimizedAnswers > 0) {
    findings.push({ category: 'answer-optimization', severity: 'success', title: 'Well-optimized answer paragraphs', description: `${optimizedAnswers} answers are in the ideal 40-60 word range.`, recommendation: '' });
  }
  if (longAnswers > 0) {
    findings.push({ category: 'answer-optimization', severity: 'warning', title: 'Answer paragraphs too long', description: `${longAnswers} answer paragraphs exceed 100 words.`, recommendation: 'AI engines prefer concise 40-60 word answers. Break long answers into focused paragraphs.' });
  }
  if (shortAnswers > 0) {
    findings.push({ category: 'answer-optimization', severity: 'info', title: 'Short answer paragraphs', description: `${shortAnswers} answers are under 20 words.`, recommendation: 'Expand short answers to provide more context (aim for 40-60 words).' });
  }

  return findings;
}

function analyzeHeadingStructure(root: ReturnType<typeof parseHTML>): AeoFinding[] {
  const findings: AeoFinding[] = [];

  const headings = root.querySelectorAll('h1, h2, h3, h4');
  if (headings.length === 0) {
    findings.push({ category: 'headings', severity: 'error', title: 'No headings found', description: '', recommendation: 'Add heading tags to structure content into clear topic clusters.' });
    return findings;
  }

  // Count topic clusters (groups of H2 with H3 children)
  let h2Count = 0;
  let h3Count = 0;
  for (const h of headings) {
    if (h.tagName === 'H2') h2Count++;
    if (h.tagName === 'H3') h3Count++;
  }

  if (h2Count >= 3 && h3Count > 0) {
    findings.push({ category: 'headings', severity: 'success', title: 'Good topic clustering', description: `${h2Count} main topics (H2) with ${h3Count} subtopics (H3).`, recommendation: '' });
  } else if (h2Count >= 2) {
    findings.push({ category: 'headings', severity: 'info', title: 'Basic topic structure', description: `${h2Count} topics found.`, recommendation: 'Add H3 subtopics under H2 sections for deeper topic clustering.' });
  } else {
    findings.push({ category: 'headings', severity: 'warning', title: 'Weak topic structure', description: `Only ${h2Count} H2 heading(s).`, recommendation: 'Break content into multiple H2 sections with H3 subtopics for better AI comprehension.' });
  }

  return findings;
}

function analyzeEntityCoverage(root: ReturnType<typeof parseHTML>): AeoFinding[] {
  const findings: AeoFinding[] = [];

  // Check for named entities (proper nouns, brand names, technical terms)
  // Simple heuristic: look for capitalized multi-word phrases and bolded text
  const boldElements = root.querySelectorAll('strong, b');
  const emphasized = root.querySelectorAll('em, i');

  if (boldElements.length >= 5) {
    findings.push({ category: 'entity-coverage', severity: 'success', title: 'Good entity emphasis', description: `${boldElements.length} bold/strong elements highlight key terms.`, recommendation: '' });
  } else if (boldElements.length > 0) {
    findings.push({ category: 'entity-coverage', severity: 'info', title: 'Some entity emphasis', description: `${boldElements.length} bold/strong elements found.`, recommendation: 'Bold key entities, brand names, and technical terms to help AI engines identify important concepts.' });
  } else {
    findings.push({ category: 'entity-coverage', severity: 'warning', title: 'No entity emphasis', description: 'No bold or strong tags found.', recommendation: 'Use <strong> tags to highlight key entities, concepts, and terms.' });
  }

  // Check for lists (AI engines like structured data)
  const lists = root.querySelectorAll('ul, ol');
  if (lists.length >= 2) {
    findings.push({ category: 'entity-coverage', severity: 'success', title: 'Good use of lists', description: `${lists.length} structured lists found.`, recommendation: '' });
  } else if (lists.length === 0) {
    findings.push({ category: 'entity-coverage', severity: 'info', title: 'No lists found', description: '', recommendation: 'Use ordered/unordered lists to present key information — AI engines extract list content effectively.' });
  }

  // Tables
  const tables = root.querySelectorAll('table');
  if (tables.length > 0) {
    findings.push({ category: 'entity-coverage', severity: 'success', title: 'Table data present', description: `${tables.length} table(s) found.`, recommendation: '' });
  }

  return findings;
}

function analyzeFreshness(root: ReturnType<typeof parseHTML>): AeoFinding[] {
  const findings: AeoFinding[] = [];

  // Check for date signals
  const timeElements = root.querySelectorAll('time');
  const datePatterns = root.querySelectorAll('[datetime], [data-date]');

  if (timeElements.length > 0) {
    findings.push({ category: 'freshness', severity: 'success', title: 'Date elements found', description: `${timeElements.length} <time> element(s) with date information.`, recommendation: '' });
  } else if (datePatterns.length > 0) {
    findings.push({ category: 'freshness', severity: 'success', title: 'Date attributes found', description: `${datePatterns.length} elements with date attributes.`, recommendation: '' });
  } else {
    findings.push({ category: 'freshness', severity: 'warning', title: 'No date signals found', description: 'No <time> elements or date attributes detected.', recommendation: 'Add <time datetime="..."> elements to signal content freshness to AI engines.' });
  }

  // Check for article/datePublished in JSON-LD
  const jsonLdScripts = root.querySelectorAll('script[type="application/ld+json"]');
  let hasDatePublished = false;
  let hasDateModified = false;

  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script.text);
      if (data.datePublished) hasDatePublished = true;
      if (data.dateModified) hasDateModified = true;
    } catch { /* skip */ }
  }

  if (hasDatePublished && hasDateModified) {
    findings.push({ category: 'freshness', severity: 'success', title: 'Schema date signals present', description: 'datePublished and dateModified found in structured data.', recommendation: '' });
  } else if (hasDatePublished) {
    findings.push({ category: 'freshness', severity: 'info', title: 'Only datePublished in schema', description: 'Consider adding dateModified to signal content updates.', recommendation: 'Add dateModified to structured data to show AI engines the content is maintained.' });
  }

  // Check last-modified header would require actual HTTP response — skip for HTML-only analysis

  return findings;
}

function calculateScore(findings: AeoFinding[]): number {
  let score = 100;
  for (const f of findings) {
    if (f.severity === 'error') score -= 12;
    else if (f.severity === 'warning') score -= 5;
  }
  return Math.max(0, Math.min(100, score));
}

export async function runAeoAudit(projectId: string, url: string, userId: string) {
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

  const findingsArr = [
    ...analyzeFaqSchema(root),
    ...analyzeQaStructure(root),
    ...analyzeAnswerOptimization(root),
    ...analyzeHeadingStructure(root),
    ...analyzeEntityCoverage(root),
    ...analyzeFreshness(root),
  ];

  const categories: Record<string, number> = {};
  for (const f of findingsArr) {
    categories[f.category] = (categories[f.category] ?? 0) + 1;
  }

  const score = calculateScore(findingsArr);

  const audit = await prisma.audit.create({
    data: {
      projectId,
      type: 'AEO',
      urlAudited: url,
      score,
      results: { categories, findings: findingsArr } as unknown as Prisma.InputJsonValue,
    },
  });

  await checkScoreDrop(projectId, 'AEO', score, audit.id);

  return audit;
}
