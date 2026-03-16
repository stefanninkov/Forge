import { createClaudeClient } from '../integrations/claude-client.js';

// ── Types ──

interface AnimationRecommendation {
  elementSelector: string;
  animationType: string;
  engine: 'css' | 'gsap';
  trigger: 'scroll' | 'hover' | 'click' | 'load';
  parameters: {
    duration: number;
    delay: number;
    ease: string;
    distance?: number;
  };
  reasoning: string;
}

interface SeoRecommendation {
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  currentValue?: string;
  suggestedValue?: string;
  affectedUrls?: string[];
}

interface ClassNameSuggestion {
  originalName: string;
  suggestedClass: string;
  htmlTag: string;
  reasoning: string;
}

// ── Animation Recommendations ──

export async function getAnimationRecommendations(
  apiKey: string,
  siteStructure: string,
  siteType: string,
): Promise<AnimationRecommendation[]> {
  const client = createClaudeClient(apiKey);

  const { data, usage } = await client.completeJson<{ recommendations: AnimationRecommendation[] }>({
    system: `You are a web animation expert specializing in Webflow sites. You recommend tasteful, performance-optimized animations that enhance user experience without being distracting. You prefer CSS animations for simple effects (fade, slide) and GSAP for complex effects (scroll-linked, split text, stagger). Always consider performance — avoid animating layout-triggering properties. Output valid JSON only.`,
    messages: [
      {
        role: 'user',
        content: `Analyze this ${siteType} website structure and recommend animations for key sections. Focus on: hero sections, feature grids, testimonials, CTAs, and navigation elements. Keep recommendations tasteful and professional.

Site structure:
${siteStructure}

Return JSON with this shape:
{
  "recommendations": [
    {
      "elementSelector": ".hero-heading",
      "animationType": "fade-up",
      "engine": "css",
      "trigger": "load",
      "parameters": { "duration": 0.6, "delay": 0.1, "ease": "ease-out", "distance": 20 },
      "reasoning": "Hero headings benefit from a subtle entrance animation on page load"
    }
  ]
}

Provide 5-10 recommendations.`,
      },
    ],
    maxTokens: 2048,
    temperature: 0.4,
  });

  console.info('Animation recommendations generated', { usage });
  return data.recommendations;
}

// ── SEO Analysis ──

export async function getAiSeoRecommendations(
  apiKey: string,
  auditFindings: Array<{ title: string; description: string; severity: string; category: string }>,
  siteUrl: string,
): Promise<SeoRecommendation[]> {
  const client = createClaudeClient(apiKey);

  const findingsSummary = auditFindings
    .map((f) => `[${f.severity}] ${f.category}: ${f.title} — ${f.description}`)
    .join('\n');

  const { data, usage } = await client.completeJson<{ recommendations: SeoRecommendation[] }>({
    system: `You are an SEO expert specializing in Webflow sites. You provide actionable, specific SEO recommendations based on audit findings. Focus on things that can actually be changed in Webflow: meta tags, heading hierarchy, image alt text, schema markup, open graph tags, and content optimization. Do not recommend server-side changes that Webflow doesn't support. Output valid JSON only.`,
    messages: [
      {
        role: 'user',
        content: `Analyze these SEO audit findings for ${siteUrl} and provide prioritized, actionable recommendations:

${findingsSummary}

Return JSON with this shape:
{
  "recommendations": [
    {
      "category": "Meta Tags",
      "priority": "high",
      "title": "Add unique meta descriptions",
      "description": "3 pages are missing meta descriptions, which hurts CTR in search results",
      "suggestedValue": "Example description for the homepage...",
      "affectedUrls": ["/", "/about"]
    }
  ]
}

Prioritize by impact. Provide 5-8 recommendations.`,
      },
    ],
    maxTokens: 2048,
    temperature: 0.3,
  });

  console.info('SEO recommendations generated', { usage });
  return data.recommendations;
}

// ── Class Name Generation ──

export async function getClassNameSuggestions(
  apiKey: string,
  elements: Array<{ name: string; type: string; context: string }>,
  methodology: string = 'client-first',
): Promise<ClassNameSuggestion[]> {
  const client = createClaudeClient(apiKey);

  const elementsList = elements
    .map((e) => `- "${e.name}" (${e.type}) — context: ${e.context}`)
    .join('\n');

  const { data, usage } = await client.completeJson<{ suggestions: ClassNameSuggestion[] }>({
    system: `You are a Webflow class naming expert. You follow the ${methodology} naming methodology strictly. For Client-First: use lowercase with hyphens, prefix with section context (e.g., hero_heading, about_grid), use semantic names, avoid presentational names (no .blue-text or .large-font). Every class should communicate what the element is, not how it looks. Output valid JSON only.`,
    messages: [
      {
        role: 'user',
        content: `Suggest Webflow class names for these Figma elements using the ${methodology} methodology:

${elementsList}

Return JSON with this shape:
{
  "suggestions": [
    {
      "originalName": "Frame 42",
      "suggestedClass": "hero_content-wrapper",
      "htmlTag": "div",
      "reasoning": "Container wrapping hero content uses semantic naming"
    }
  ]
}`,
      },
    ],
    maxTokens: 2048,
    temperature: 0.2,
  });

  console.info('Class name suggestions generated', { usage });
  return data.suggestions;
}

// ── Content Analysis for AEO ──

export async function getAeoRecommendations(
  apiKey: string,
  pageContent: string,
  targetQueries: string[],
): Promise<SeoRecommendation[]> {
  const client = createClaudeClient(apiKey);

  const { data, usage } = await client.completeJson<{ recommendations: SeoRecommendation[] }>({
    system: `You are an AI Engine Optimization (AEO) expert. You help websites appear in AI-generated answers from ChatGPT, Claude, Perplexity, and Google AI Overviews. You focus on: structured data (FAQ schema, HowTo schema), direct answer formatting, entity clarity, question-answer patterns in content, and citation-worthy writing. Output valid JSON only.`,
    messages: [
      {
        role: 'user',
        content: `Analyze this page content for AEO optimization opportunities. The site targets these queries: ${targetQueries.join(', ')}

Page content (first 3000 chars):
${pageContent.slice(0, 3000)}

Return JSON with this shape:
{
  "recommendations": [
    {
      "category": "Structured Data",
      "priority": "high",
      "title": "Add FAQ schema markup",
      "description": "Page has Q&A content that should be marked up with FAQPage schema"
    }
  ]
}

Provide 4-6 recommendations focused on AI visibility.`,
      },
    ],
    maxTokens: 2048,
    temperature: 0.3,
  });

  console.info('AEO recommendations generated', { usage });
  return data.recommendations;
}
