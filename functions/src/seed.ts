import { onCall } from 'firebase-functions/v2/https';
import { getDb } from './utils';

// ── Animation Presets Data ──

const ANIMATION_PRESETS = [
  { name: 'Fade In', description: 'Simple opacity fade from 0 to 1.', category: 'fade', engine: 'CSS', trigger: 'SCROLL', config: { animationType: 'fade-in', duration: 0.6, delay: 0, ease: 'ease-out', threshold: 0.2 }, tags: ['fade', 'opacity', 'subtle'] },
  { name: 'Fade Up', description: 'Fade in while sliding up from below.', category: 'fade', engine: 'CSS', trigger: 'SCROLL', config: { animationType: 'fade-up', duration: 0.6, delay: 0, ease: 'ease-out', threshold: 0.2, distance: 24 }, tags: ['fade', 'slide', 'up', 'popular'] },
  { name: 'Fade Down', description: 'Fade in while sliding down from above.', category: 'fade', engine: 'CSS', trigger: 'SCROLL', config: { animationType: 'fade-down', duration: 0.6, delay: 0, ease: 'ease-out', threshold: 0.2, distance: 24 }, tags: ['fade', 'slide', 'down'] },
  { name: 'Fade Left', description: 'Fade in while sliding from the right.', category: 'fade', engine: 'CSS', trigger: 'SCROLL', config: { animationType: 'fade-left', duration: 0.6, delay: 0, ease: 'ease-out', threshold: 0.2, distance: 24 }, tags: ['fade', 'slide', 'left'] },
  { name: 'Fade Right', description: 'Fade in while sliding from the left.', category: 'fade', engine: 'CSS', trigger: 'SCROLL', config: { animationType: 'fade-right', duration: 0.6, delay: 0, ease: 'ease-out', threshold: 0.2, distance: 24 }, tags: ['fade', 'slide', 'right'] },
  { name: 'Scale In', description: 'Scale from 0 to full size with fade.', category: 'scale', engine: 'CSS', trigger: 'SCROLL', config: { animationType: 'scale-in', duration: 0.5, delay: 0, ease: 'ease-out', threshold: 0.2, scale: 0 }, tags: ['scale', 'zoom', 'grow'] },
  { name: 'Scale Up', description: 'Scale from 95% to 100% with subtle fade.', category: 'scale', engine: 'CSS', trigger: 'SCROLL', config: { animationType: 'scale-up', duration: 0.5, delay: 0, ease: 'ease-out', threshold: 0.2, scale: 0.95 }, tags: ['scale', 'subtle', 'popular'] },
  { name: 'Scale Down', description: 'Scale from 105% to 100% with subtle fade.', category: 'scale', engine: 'CSS', trigger: 'SCROLL', config: { animationType: 'scale-down', duration: 0.5, delay: 0, ease: 'ease-out', threshold: 0.2, scale: 1.05 }, tags: ['scale', 'shrink'] },
  { name: 'Slide Up', description: 'Slide up from below without fade.', category: 'slide', engine: 'CSS', trigger: 'SCROLL', config: { animationType: 'slide-up', duration: 0.5, delay: 0, ease: 'ease-out', threshold: 0.2, distance: 40 }, tags: ['slide', 'up', 'movement'] },
  { name: 'Slide Down', description: 'Slide down from above without fade.', category: 'slide', engine: 'CSS', trigger: 'SCROLL', config: { animationType: 'slide-down', duration: 0.5, delay: 0, ease: 'ease-out', threshold: 0.2, distance: 40 }, tags: ['slide', 'down', 'movement'] },
  { name: 'Slide Left', description: 'Slide in from the right edge.', category: 'slide', engine: 'CSS', trigger: 'SCROLL', config: { animationType: 'slide-left', duration: 0.5, delay: 0, ease: 'ease-out', threshold: 0.2, distance: 40 }, tags: ['slide', 'left', 'movement'] },
  { name: 'Slide Right', description: 'Slide in from the left edge.', category: 'slide', engine: 'CSS', trigger: 'SCROLL', config: { animationType: 'slide-right', duration: 0.5, delay: 0, ease: 'ease-out', threshold: 0.2, distance: 40 }, tags: ['slide', 'right', 'movement'] },
  { name: 'Rotate In', description: 'Rotate from an angle to 0 degrees with fade.', category: 'special', engine: 'CSS', trigger: 'SCROLL', config: { animationType: 'rotate-in', duration: 0.6, delay: 0, ease: 'ease-out', threshold: 0.2, rotate: -10 }, tags: ['rotate', 'spin', 'creative'] },
  { name: 'Blur In', description: 'Fade in from a blurred state.', category: 'special', engine: 'CSS', trigger: 'SCROLL', config: { animationType: 'blur-in', duration: 0.6, delay: 0, ease: 'ease-out', threshold: 0.2, blur: 8 }, tags: ['blur', 'focus', 'creative'] },
  { name: 'Hover Scale', description: 'Scale up slightly on hover.', category: 'hover', engine: 'CSS', trigger: 'HOVER', config: { animationType: 'scale-up', duration: 0.2, delay: 0, ease: 'ease-out', scale: 1.03 }, tags: ['hover', 'scale', 'interactive', 'popular'] },
  { name: 'Hover Lift', description: 'Lift element up with translateY on hover.', category: 'hover', engine: 'CSS', trigger: 'HOVER', config: { animationType: 'lift', duration: 0.2, delay: 0, ease: 'ease-out', distance: -4 }, tags: ['hover', 'lift', 'interactive', 'popular'] },
  { name: 'Hover Glow', description: 'Add a subtle glow effect on hover.', category: 'hover', engine: 'CSS', trigger: 'HOVER', config: { animationType: 'glow', duration: 0.2, delay: 0, ease: 'ease-out' }, tags: ['hover', 'glow', 'interactive'] },
  { name: 'Load Fade Up', description: 'Fade up animation on page load.', category: 'load', engine: 'CSS', trigger: 'LOAD', config: { animationType: 'fade-up', duration: 0.8, delay: 0.1, ease: 'cubic-bezier(0.16, 1, 0.3, 1)', distance: 20 }, tags: ['load', 'fade', 'entrance', 'popular'] },
  { name: 'Parallax', description: 'Scroll-linked parallax movement.', category: 'parallax', engine: 'GSAP', trigger: 'SCROLL', config: { animationType: 'parallax', duration: 1, delay: 0, ease: 'none', distance: 100, gsapStart: 'top bottom', gsapEnd: 'bottom top', gsapScrub: true }, tags: ['parallax', 'scroll', 'movement', 'popular'] },
  { name: 'Text Reveal (Words)', description: 'Split text into words and reveal with stagger.', category: 'text', engine: 'GSAP', trigger: 'SCROLL', config: { animationType: 'split-text', duration: 0.8, delay: 0, ease: 'power3.out', gsapStart: 'top 80%', gsapEnd: 'bottom 20%', gsapSplit: 'words', gsapStagger: 0.05 }, tags: ['text', 'split', 'words', 'reveal', 'popular'] },
  { name: 'Text Reveal (Chars)', description: 'Split text into characters and reveal with stagger.', category: 'text', engine: 'GSAP', trigger: 'SCROLL', config: { animationType: 'split-text', duration: 0.6, delay: 0, ease: 'power3.out', gsapStart: 'top 80%', gsapEnd: 'bottom 20%', gsapSplit: 'chars', gsapStagger: 0.02 }, tags: ['text', 'split', 'chars', 'reveal'] },
  { name: 'Text Reveal (Lines)', description: 'Split text into lines and reveal with stagger.', category: 'text', engine: 'GSAP', trigger: 'SCROLL', config: { animationType: 'split-text', duration: 0.8, delay: 0, ease: 'power3.out', gsapStart: 'top 80%', gsapEnd: 'bottom 20%', gsapSplit: 'lines', gsapStagger: 0.1 }, tags: ['text', 'split', 'lines', 'reveal'] },
  { name: 'Stagger Children', description: 'Animate child elements with staggered delay.', category: 'stagger', engine: 'GSAP', trigger: 'SCROLL', config: { animationType: 'stagger', duration: 0.6, delay: 0, ease: 'power2.out', gsapStart: 'top 80%', gsapEnd: 'bottom 20%', gsapStagger: 0.1, distance: 24 }, tags: ['stagger', 'children', 'sequence', 'popular'] },
  { name: 'Scroll Scrub', description: 'Animation progress tied to scroll position.', category: 'scroll', engine: 'GSAP', trigger: 'SCROLL', config: { animationType: 'scrub', duration: 1, delay: 0, ease: 'none', gsapStart: 'top bottom', gsapEnd: 'top top', gsapScrub: 1, distance: 0 }, tags: ['scrub', 'scroll', 'timeline'] },
  { name: 'Pin Section', description: 'Pin element in viewport while scrolling through content.', category: 'scroll', engine: 'GSAP', trigger: 'SCROLL', config: { animationType: 'pin', duration: 1, delay: 0, ease: 'none', gsapStart: 'top top', gsapEnd: '+=100%', gsapPin: true }, tags: ['pin', 'scroll', 'sticky', 'section'] },
];

// ── Setup Checklist Data ──

const SETUP_CHECKLIST = [
  { categoryKey: 'seo_settings', categoryTitle: 'SEO Settings', items: [
    { key: 'seo_subdomain_off', title: 'Disable Webflow subdomain indexing', description: 'Prevents duplicate content by blocking search engines from indexing the .webflow.io subdomain.', instructions: 'Go to Site Settings > SEO > uncheck "Index Webflow subdomain".', automationLevel: 'auto' },
    { key: 'seo_robots_txt', title: 'Configure robots.txt', description: 'Set up robots.txt to control search engine crawling behavior.', instructions: 'Go to Site Settings > SEO > edit robots.txt.', automationLevel: 'semi' },
    { key: 'seo_sitemap', title: 'Enable sitemap auto-generation', description: 'Verify sitemap.xml auto-generation is enabled.', instructions: 'Go to Site Settings > SEO > verify "Auto-generate Sitemap" is enabled.', automationLevel: 'auto' },
    { key: 'seo_canonical_defaults', title: 'Set canonical tag defaults', description: 'Ensure canonical tags prevent duplicate content.', instructions: 'Verify canonical tags in Site Settings > SEO.', automationLevel: 'manual' },
    { key: 'seo_og_defaults', title: 'Add default OG image and meta template', description: 'Set default Open Graph image and meta template.', instructions: 'Go to Site Settings > SEO > set default OG image, title, description.', automationLevel: 'semi' },
  ]},
  { categoryKey: 'publishing_domain', categoryTitle: 'Publishing & Domain', items: [
    { key: 'pub_staging_domain', title: 'Change staging domain to client name', description: 'Rename .webflow.io staging subdomain.', instructions: 'Go to Site Settings > General > change staging subdomain.', automationLevel: 'manual' },
    { key: 'pub_advanced_publishing', title: 'Enable advanced publishing options', description: 'Get more control over publish targets.', instructions: 'Go to Site Settings > Publishing > enable advanced options.', automationLevel: 'manual' },
    { key: 'pub_ssl', title: 'Configure SSL certificate', description: 'Ensure SSL is active for custom domain.', instructions: 'Go to Site Settings > Hosting > verify SSL.', automationLevel: 'manual' },
    { key: 'pub_redirects', title: 'Set up 301 redirect structure', description: 'Configure 301 redirects to preserve SEO equity.', instructions: 'Go to Site Settings > Hosting > 301 Redirects.', automationLevel: 'semi' },
  ]},
  { categoryKey: 'general_settings', categoryTitle: 'General Settings', items: [
    { key: 'gen_custom_fonts', title: 'Upload custom fonts with font-display: swap', description: 'Upload project fonts with performance optimization.', instructions: 'Upload in Site Settings > Fonts. Add font-display: swap via embed.', automationLevel: 'semi' },
    { key: 'gen_favicon', title: 'Set favicon and webclip', description: 'Upload favicon (32x32) and webclip (256x256).', instructions: 'Go to Site Settings > General > upload Favicon and Webclip.', automationLevel: 'manual' },
    { key: 'gen_language_code', title: 'Set default language code', description: 'Set HTML lang attribute for accessibility.', instructions: 'Add lang attribute to <html> tag.', automationLevel: 'auto' },
    { key: 'gen_remove_branding', title: 'Remove Webflow branding', description: 'Remove "Made in Webflow" badge.', instructions: 'Go to Site Settings > General > disable badge.', automationLevel: 'auto' },
    { key: 'gen_timezone', title: 'Set timezone for CMS dates', description: 'Configure timezone for CMS date display.', instructions: 'Go to Site Settings > General > set timezone.', automationLevel: 'manual' },
  ]},
  { categoryKey: 'design_system', categoryTitle: 'Design System Setup', items: [
    { key: 'ds_css_variables', title: 'Add Client-First CSS variables', description: 'Inject CSS variables for colors, spacing, typography.', instructions: 'Add variables to global <head> embed.', automationLevel: 'auto' },
    { key: 'ds_style_guide', title: 'Build style guide page', description: 'Create style guide showcasing all design tokens.', instructions: 'Create /style-guide page.', automationLevel: 'semi' },
    { key: 'ds_css_reset', title: 'Add global CSS reset/normalize', description: 'Ensure consistent rendering across browsers.', instructions: 'Add CSS reset in global <head>.', automationLevel: 'auto' },
    { key: 'ds_responsive_utils', title: 'Set up responsive utility classes', description: 'Add utility classes for responsive layout.', instructions: 'Add responsive utility CSS to global embed.', automationLevel: 'auto' },
    { key: 'ds_reduced_motion', title: 'Add prefers-reduced-motion CSS', description: 'Respect user motion preferences.', instructions: 'Add @media (prefers-reduced-motion) rule.', automationLevel: 'auto' },
    { key: 'ds_rem_scaling', title: 'Add REM scaling system', description: 'Set up responsive REM scaling across breakpoints.', instructions: 'Add font-size rules on html element at each breakpoint.', automationLevel: 'auto' },
  ]},
  { categoryKey: 'code_scripts', categoryTitle: 'Code & Scripts', items: [
    { key: 'code_gtm', title: 'Add GTM container placeholder', description: 'Add Google Tag Manager to <head>.', instructions: 'Add GTM script to global <head> embed.', automationLevel: 'semi' },
    { key: 'code_gsap', title: 'Add GSAP CDN + plugins', description: 'Add GSAP and required plugins to footer.', instructions: 'Add GSAP CDN script tags to footer.', automationLevel: 'auto' },
    { key: 'code_lenis', title: 'Add Lenis smooth scroll', description: 'Add smooth scrolling library if needed.', instructions: 'Add Lenis CDN script and initialize.', automationLevel: 'semi' },
    { key: 'code_master_script', title: 'Add Forge animation master script', description: 'Add generated animation master script.', instructions: 'Generate in Animations module, embed in footer.', automationLevel: 'auto' },
    { key: 'code_cookie_consent', title: 'Set up cookie consent system', description: 'Add GDPR/CCPA-compliant consent banner.', instructions: 'Add consent provider script to <head>.', automationLevel: 'semi' },
    { key: 'code_security_headers', title: 'Add security headers', description: 'Add security headers via meta tags.', instructions: 'Add meta tags in global <head>.', automationLevel: 'auto' },
  ]},
  { categoryKey: 'pages', categoryTitle: 'Pages', items: [
    { key: 'pages_404', title: 'Create and style 404 page', description: 'Custom 404 error page.', instructions: 'Create page, set as 404 in Site Settings.', automationLevel: 'semi' },
    { key: 'pages_style_guide', title: 'Create style guide page', description: 'Dedicated style guide page.', instructions: 'Create /style-guide with all examples.', automationLevel: 'semi' },
    { key: 'pages_password', title: 'Set up password-protected page', description: 'Create gated content page.', instructions: 'Create page, enable password protection.', automationLevel: 'manual' },
    { key: 'pages_search', title: 'Set up search results page', description: 'Style search results page.', instructions: 'Create and style search results layout.', automationLevel: 'manual' },
    { key: 'pages_legal', title: 'Create legal pages', description: 'Privacy, terms, imprint pages.', instructions: 'Create /privacy, /terms, /imprint.', automationLevel: 'semi' },
  ]},
  { categoryKey: 'performance', categoryTitle: 'Performance Prep', items: [
    { key: 'perf_image_compression', title: 'Set image compression defaults', description: 'Configure optimal image compression.', instructions: 'Site Settings > General > set 80-85% quality.', automationLevel: 'manual' },
    { key: 'perf_webp_avif', title: 'Enable WebP/AVIF serving', description: 'Serve images in modern formats.', instructions: 'Verify WebP serving in site settings.', automationLevel: 'manual' },
    { key: 'perf_lazy_loading', title: 'Configure lazy loading', description: 'Enable lazy loading for below-fold images.', instructions: 'Set loading="lazy" on below-fold images.', automationLevel: 'semi' },
    { key: 'perf_font_preload', title: 'Preload critical fonts', description: 'Add preload hints for critical fonts.', instructions: 'Add <link rel="preload" as="font"> in <head>.', automationLevel: 'auto' },
    { key: 'perf_no_blocking_head', title: 'Verify no render-blocking code in <head>', description: 'Ensure no blocking scripts in <head>.', instructions: 'Review <head> code, move non-critical to footer.', automationLevel: 'manual' },
  ]},
];

// ── Cloud Function ──

export const seedSystemData = onCall({ region: 'europe-west1', timeoutSeconds: 30 }, async () => {
  const db = getDb();

  // Check if already seeded
  const existing = await db.collection('animationPresets').where('isSystem', '==', true).limit(1).get();
  if (!existing.empty) {
    return { message: 'System data already seeded', seeded: false };
  }

  const batch = db.batch();
  const now = new Date().toISOString();

  // Seed animation presets
  for (const preset of ANIMATION_PRESETS) {
    const ref = db.collection('animationPresets').doc();
    batch.set(ref, {
      ...preset,
      isSystem: true,
      isPublished: false,
      previewHtml: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Seed setup checklist
  for (const category of SETUP_CHECKLIST) {
    for (const item of category.items) {
      const ref = db.collection('setupChecklist').doc(item.key);
      batch.set(ref, {
        ...item,
        categoryKey: category.categoryKey,
        categoryTitle: category.categoryTitle,
        createdAt: now,
      });
    }
  }

  await batch.commit();

  return {
    message: 'System data seeded',
    seeded: true,
    counts: {
      animationPresets: ANIMATION_PRESETS.length,
      setupItems: SETUP_CHECKLIST.reduce((sum, c) => sum + c.items.length, 0),
    },
  };
});
