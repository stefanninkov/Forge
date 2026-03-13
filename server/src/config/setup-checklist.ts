export type AutomationLevel = 'auto' | 'semi' | 'manual';

export interface SetupItem {
  key: string;
  title: string;
  description: string;
  instructions: string;
  automationLevel: AutomationLevel;
  link?: string;
}

export interface SetupCategory {
  key: string;
  title: string;
  items: SetupItem[];
}

export const SETUP_CHECKLIST: SetupCategory[] = [
  {
    key: 'seo_settings',
    title: 'SEO Settings',
    items: [
      {
        key: 'seo_subdomain_off',
        title: 'Disable Webflow subdomain indexing',
        description: 'Prevents duplicate content by blocking search engines from indexing the .webflow.io subdomain.',
        instructions: 'Go to Site Settings > SEO > uncheck "Index Webflow subdomain". This is critical to prevent SEO issues.',
        automationLevel: 'auto',
        link: 'https://university.webflow.com/lesson/seo-settings',
      },
      {
        key: 'seo_robots_txt',
        title: 'Configure robots.txt',
        description: 'Set up robots.txt to control search engine crawling behavior.',
        instructions: 'Go to Site Settings > SEO > edit robots.txt. Ensure staging is blocked and production allows crawling.',
        automationLevel: 'semi',
      },
      {
        key: 'seo_sitemap',
        title: 'Enable sitemap auto-generation',
        description: 'Webflow auto-generates a sitemap.xml. Verify it is enabled and properly configured.',
        instructions: 'Go to Site Settings > SEO > verify "Auto-generate Sitemap" is enabled.',
        automationLevel: 'auto',
      },
      {
        key: 'seo_canonical_defaults',
        title: 'Set canonical tag defaults',
        description: 'Ensure canonical tags are set to prevent duplicate content across pages.',
        instructions: 'Webflow auto-generates canonical tags. Verify they are enabled in Site Settings > SEO.',
        automationLevel: 'manual',
      },
      {
        key: 'seo_og_defaults',
        title: 'Add default OG image and meta template',
        description: 'Set a default Open Graph image and meta title/description template for all pages.',
        instructions: 'Go to Site Settings > SEO > set default OG image, title format, and description.',
        automationLevel: 'semi',
      },
    ],
  },
  {
    key: 'publishing_domain',
    title: 'Publishing & Domain',
    items: [
      {
        key: 'pub_staging_domain',
        title: 'Change staging domain to client name',
        description: 'Rename the .webflow.io staging subdomain to match the client project.',
        instructions: 'Go to Site Settings > General > change the staging subdomain to a recognizable name.',
        automationLevel: 'manual',
        link: 'https://university.webflow.com/lesson/publish-your-site',
      },
      {
        key: 'pub_advanced_publishing',
        title: 'Enable advanced publishing options',
        description: 'Turn on advanced publishing to get more control over publish targets.',
        instructions: 'Go to Site Settings > Publishing > enable advanced publishing options.',
        automationLevel: 'manual',
      },
      {
        key: 'pub_ssl',
        title: 'Configure SSL certificate',
        description: 'Ensure SSL is active for the custom domain if one is connected.',
        instructions: 'Go to Site Settings > Hosting > verify SSL is enabled. Webflow handles this automatically for connected domains.',
        automationLevel: 'manual',
      },
      {
        key: 'pub_redirects',
        title: 'Set up 301 redirect structure',
        description: 'Configure 301 redirects if migrating from an existing site to preserve SEO equity.',
        instructions: 'Go to Site Settings > Hosting > 301 Redirects. Map old URLs to new ones.',
        automationLevel: 'semi',
      },
    ],
  },
  {
    key: 'general_settings',
    title: 'General Settings',
    items: [
      {
        key: 'gen_custom_fonts',
        title: 'Upload custom fonts with font-display: swap',
        description: 'Upload project fonts and add font-display: swap via embed code for performance.',
        instructions: 'Upload fonts in Site Settings > Fonts. Then add a <style> embed in the <head> with font-display: swap for each @font-face.',
        automationLevel: 'semi',
      },
      {
        key: 'gen_favicon',
        title: 'Set favicon and webclip',
        description: 'Upload favicon (32x32) and webclip (256x256) for browser tabs and mobile bookmarks.',
        instructions: 'Go to Site Settings > General > upload Favicon and Webclip images.',
        automationLevel: 'manual',
      },
      {
        key: 'gen_language_code',
        title: 'Set default language code',
        description: 'Set the HTML lang attribute for accessibility and SEO.',
        instructions: 'Add lang attribute to the <html> tag via custom code or Webflow settings.',
        automationLevel: 'auto',
      },
      {
        key: 'gen_remove_branding',
        title: 'Remove Webflow branding',
        description: 'Remove the "Made in Webflow" badge and HTML comment from the published site.',
        instructions: 'Go to Site Settings > General > disable Webflow badge. For the HTML comment, add custom code to remove it.',
        automationLevel: 'auto',
      },
      {
        key: 'gen_timezone',
        title: 'Set timezone for CMS dates',
        description: 'Configure the timezone if CMS date fields need correct display.',
        instructions: 'Go to Site Settings > General > set the timezone to the client or audience timezone.',
        automationLevel: 'manual',
      },
    ],
  },
  {
    key: 'design_system',
    title: 'Design System Setup',
    items: [
      {
        key: 'ds_css_variables',
        title: 'Add Client-First CSS variables',
        description: 'Inject the Client-First CSS variables for colors, spacing, and typography.',
        instructions: 'Add CSS variables to the global <head> embed. Include color tokens, spacing scale, and typography scale.',
        automationLevel: 'auto',
      },
      {
        key: 'ds_style_guide',
        title: 'Build style guide page',
        description: 'Create a style guide page showcasing all typography, colors, buttons, and form elements.',
        instructions: 'Create a new page at /style-guide and build sections for each design token category.',
        automationLevel: 'semi',
      },
      {
        key: 'ds_css_reset',
        title: 'Add global CSS reset/normalize',
        description: 'Add a CSS reset or normalize stylesheet to ensure consistent rendering across browsers.',
        instructions: 'Add a CSS reset embed in the global <head> code.',
        automationLevel: 'auto',
      },
      {
        key: 'ds_responsive_utils',
        title: 'Set up responsive utility classes',
        description: 'Add utility classes for responsive visibility and layout helpers.',
        instructions: 'Add responsive utility CSS to the global embed (hide-mobile, hide-tablet, etc.).',
        automationLevel: 'auto',
      },
      {
        key: 'ds_reduced_motion',
        title: 'Add prefers-reduced-motion CSS',
        description: 'Add a base CSS rule that respects user motion preferences.',
        instructions: 'Add @media (prefers-reduced-motion: reduce) rule in the global CSS that disables animations.',
        automationLevel: 'auto',
      },
      {
        key: 'ds_rem_scaling',
        title: 'Add REM scaling system',
        description: 'Set up responsive REM scaling across breakpoints (Osmo-adapted, four breakpoints).',
        instructions: 'Add font-size rules on the html element at each breakpoint for REM scaling.',
        automationLevel: 'auto',
      },
    ],
  },
  {
    key: 'code_scripts',
    title: 'Code & Scripts',
    items: [
      {
        key: 'code_gtm',
        title: 'Add GTM container placeholder',
        description: 'Add Google Tag Manager container code to the <head>.',
        instructions: 'Get the GTM container ID from the client and add the GTM script to the global <head> embed.',
        automationLevel: 'semi',
      },
      {
        key: 'code_gsap',
        title: 'Add GSAP CDN + plugins',
        description: 'Add GSAP core and required plugins (ScrollTrigger, SplitText, Flip, Draggable, Observer) to the global footer.',
        instructions: 'Add GSAP CDN script tags to the global footer code embed.',
        automationLevel: 'auto',
      },
      {
        key: 'code_lenis',
        title: 'Add Lenis smooth scroll',
        description: 'Add Lenis smooth scrolling library if required for the project.',
        instructions: 'Add the Lenis CDN script to the global footer and initialize it.',
        automationLevel: 'semi',
      },
      {
        key: 'code_master_script',
        title: 'Add Forge animation master script',
        description: 'Add the Forge-generated animation master script to the global footer.',
        instructions: 'Generate the master script in the Animations module, then embed it in the global footer.',
        automationLevel: 'auto',
      },
      {
        key: 'code_cookie_consent',
        title: 'Set up cookie consent system',
        description: 'Add a GDPR/CCPA-compliant cookie consent banner.',
        instructions: 'Choose a cookie consent provider (e.g., CookieYes, Cookiebot) and add the script to the global <head>.',
        automationLevel: 'semi',
      },
      {
        key: 'code_security_headers',
        title: 'Add security headers',
        description: 'Add security headers via custom code (X-Frame-Options, Content-Security-Policy, etc.).',
        instructions: 'Add meta tags for security headers in the global <head> embed.',
        automationLevel: 'auto',
      },
    ],
  },
  {
    key: 'pages',
    title: 'Pages',
    items: [
      {
        key: 'pages_404',
        title: 'Create and style 404 page',
        description: 'Create a custom 404 error page that matches the site design.',
        instructions: 'Create a new page, set it as the 404 page in Site Settings > General > 404 Page.',
        automationLevel: 'semi',
      },
      {
        key: 'pages_style_guide',
        title: 'Create style guide page',
        description: 'Create a dedicated page for the project style guide.',
        instructions: 'Create a page at /style-guide with all typography, color, spacing, and component examples.',
        automationLevel: 'semi',
      },
      {
        key: 'pages_password',
        title: 'Set up password-protected page',
        description: 'Create a password-protected page if the project requires gated content.',
        instructions: 'Create the page and enable password protection in Page Settings.',
        automationLevel: 'manual',
      },
      {
        key: 'pages_search',
        title: 'Set up search results page',
        description: 'Create and style a search results page if site search is enabled.',
        instructions: 'Create the search results page and style the search results list layout.',
        automationLevel: 'manual',
      },
      {
        key: 'pages_legal',
        title: 'Create legal pages',
        description: 'Create privacy policy, terms of service, and imprint pages (if EU).',
        instructions: 'Create pages at /privacy, /terms, and /imprint with appropriate content.',
        automationLevel: 'semi',
      },
    ],
  },
  {
    key: 'performance',
    title: 'Performance Prep',
    items: [
      {
        key: 'perf_image_compression',
        title: 'Set image compression defaults',
        description: 'Configure Webflow image compression settings for optimal file sizes.',
        instructions: 'Go to Site Settings > General > set image quality. Recommended: 80-85% quality.',
        automationLevel: 'manual',
      },
      {
        key: 'perf_webp_avif',
        title: 'Enable WebP/AVIF serving',
        description: 'Ensure Webflow serves images in modern formats (WebP/AVIF) when supported.',
        instructions: 'Webflow automatically serves WebP. Verify this is not disabled in site settings.',
        automationLevel: 'manual',
      },
      {
        key: 'perf_lazy_loading',
        title: 'Configure lazy loading',
        description: 'Enable lazy loading for below-fold images to improve initial page load.',
        instructions: 'Set loading="lazy" on images below the fold. Keep above-fold images eager-loaded.',
        automationLevel: 'semi',
      },
      {
        key: 'perf_font_preload',
        title: 'Preload critical fonts',
        description: 'Add preload hints for critical fonts to speed up rendering.',
        instructions: 'Add <link rel="preload" as="font"> tags in the <head> for fonts used above the fold.',
        automationLevel: 'auto',
      },
      {
        key: 'perf_no_blocking_head',
        title: 'Verify no render-blocking code in <head>',
        description: 'Ensure no synchronous scripts or heavy CSS in the <head> that blocks rendering.',
        instructions: 'Review all custom code in the <head> embed. Move non-critical scripts to footer. Add async/defer where possible.',
        automationLevel: 'manual',
      },
    ],
  },
];

/** Flat map of all item keys for validation */
export const ALL_SETUP_ITEM_KEYS = SETUP_CHECKLIST.flatMap((cat) =>
  cat.items.map((item) => item.key),
);
