/**
 * Pre-built section templates with Client-First structure.
 * Each template defines a complete element tree ready for Webflow.
 */

interface TemplateNode {
  tag: string;
  className: string;
  text?: string;
  children?: TemplateNode[];
  attrs?: Record<string, string>;
}

export interface PresetTemplate {
  name: string;
  description: string;
  category: string;
  tags: string[];
  structure: TemplateNode;
  animationAttrs?: Record<string, string>;
}

export const PRESET_TEMPLATES: PresetTemplate[] = [
  // ── Navbar ──
  {
    name: 'Navbar — Standard',
    description: 'Horizontal nav with logo, links, and CTA button.',
    category: 'navbar',
    tags: ['navigation', 'header', 'responsive'],
    structure: {
      tag: 'nav',
      className: 'navbar_component',
      children: [
        {
          tag: 'div',
          className: 'navbar_container',
          children: [
            { tag: 'a', className: 'navbar_logo-link', children: [
              { tag: 'img', className: 'navbar_logo', attrs: { alt: 'Logo' } },
            ]},
            { tag: 'div', className: 'navbar_menu', children: [
              { tag: 'a', className: 'navbar_link', text: 'Features' },
              { tag: 'a', className: 'navbar_link', text: 'Pricing' },
              { tag: 'a', className: 'navbar_link', text: 'About' },
              { tag: 'a', className: 'navbar_link', text: 'Contact' },
            ]},
            { tag: 'div', className: 'navbar_actions', children: [
              { tag: 'a', className: 'button is-small is-secondary', text: 'Log in' },
              { tag: 'a', className: 'button is-small', text: 'Get started' },
            ]},
            { tag: 'button', className: 'navbar_hamburger', children: [
              { tag: 'div', className: 'navbar_hamburger-line' },
              { tag: 'div', className: 'navbar_hamburger-line' },
            ]},
          ],
        },
      ],
    },
  },
  {
    name: 'Navbar — Mega Menu',
    description: 'Navigation with dropdown mega-menu panels.',
    category: 'navbar',
    tags: ['navigation', 'mega-menu', 'dropdown'],
    structure: {
      tag: 'nav',
      className: 'navbar_component',
      children: [
        {
          tag: 'div',
          className: 'navbar_container',
          children: [
            { tag: 'a', className: 'navbar_logo-link', children: [
              { tag: 'img', className: 'navbar_logo', attrs: { alt: 'Logo' } },
            ]},
            { tag: 'div', className: 'navbar_menu', children: [
              { tag: 'div', className: 'navbar_dropdown', children: [
                { tag: 'button', className: 'navbar_dropdown-toggle', text: 'Products' },
                { tag: 'div', className: 'navbar_dropdown-panel', children: [
                  { tag: 'div', className: 'navbar_dropdown-grid', children: [
                    { tag: 'a', className: 'navbar_dropdown-item', children: [
                      { tag: 'div', className: 'navbar_dropdown-icon' },
                      { tag: 'div', className: 'navbar_dropdown-text', children: [
                        { tag: 'div', className: 'text-weight-semibold', text: 'Feature One' },
                        { tag: 'p', className: 'text-size-small text-color-secondary', text: 'Description of this feature' },
                      ]},
                    ]},
                    { tag: 'a', className: 'navbar_dropdown-item', children: [
                      { tag: 'div', className: 'navbar_dropdown-icon' },
                      { tag: 'div', className: 'navbar_dropdown-text', children: [
                        { tag: 'div', className: 'text-weight-semibold', text: 'Feature Two' },
                        { tag: 'p', className: 'text-size-small text-color-secondary', text: 'Description of this feature' },
                      ]},
                    ]},
                  ]},
                ]},
              ]},
              { tag: 'a', className: 'navbar_link', text: 'Pricing' },
              { tag: 'a', className: 'navbar_link', text: 'About' },
            ]},
            { tag: 'div', className: 'navbar_actions', children: [
              { tag: 'a', className: 'button is-small', text: 'Get started' },
            ]},
          ],
        },
      ],
    },
  },

  // ── Hero ──
  {
    name: 'Hero — Centered',
    description: 'Full-width centered hero with heading, subtext, and dual CTAs.',
    category: 'hero',
    tags: ['hero', 'centered', 'cta'],
    structure: {
      tag: 'header',
      className: 'section_hero',
      children: [
        {
          tag: 'div',
          className: 'padding-global',
          children: [{
            tag: 'div',
            className: 'container-large',
            children: [{
              tag: 'div',
              className: 'hero_content-wrapper is-centered',
              children: [
                { tag: 'div', className: 'hero_badge', text: 'New Release' },
                { tag: 'h1', className: 'heading-style-h1', text: 'Build faster with templates' },
                { tag: 'p', className: 'text-size-medium text-color-secondary', text: 'A short description of what this product does and why it matters.' },
                { tag: 'div', className: 'hero_button-group', children: [
                  { tag: 'a', className: 'button', text: 'Get started' },
                  { tag: 'a', className: 'button is-secondary', text: 'Learn more' },
                ]},
              ],
            }],
          }],
        },
      ],
    },
    animationAttrs: { 'data-load': 'fade-up' },
  },
  {
    name: 'Hero — Split',
    description: 'Two-column hero with text left and image right.',
    category: 'hero',
    tags: ['hero', 'split', 'image'],
    structure: {
      tag: 'header',
      className: 'section_hero',
      children: [
        {
          tag: 'div',
          className: 'padding-global',
          children: [{
            tag: 'div',
            className: 'container-large',
            children: [{
              tag: 'div',
              className: 'hero_layout is-split',
              children: [
                { tag: 'div', className: 'hero_content', children: [
                  { tag: 'h1', className: 'heading-style-h1', text: 'Ship faster, build better' },
                  { tag: 'p', className: 'text-size-medium text-color-secondary', text: 'Description text goes here.' },
                  { tag: 'div', className: 'hero_button-group', children: [
                    { tag: 'a', className: 'button', text: 'Start free trial' },
                    { tag: 'a', className: 'button is-link', text: 'Watch demo' },
                  ]},
                ]},
                { tag: 'div', className: 'hero_image-wrapper', children: [
                  { tag: 'img', className: 'hero_image', attrs: { alt: 'Hero image' } },
                ]},
              ],
            }],
          }],
        },
      ],
    },
    animationAttrs: { 'data-load': 'fade-up' },
  },

  // ── Features ──
  {
    name: 'Features — Grid',
    description: 'Three-column feature grid with icons.',
    category: 'features',
    tags: ['features', 'grid', 'icons'],
    structure: {
      tag: 'section',
      className: 'section_features',
      children: [{
        tag: 'div',
        className: 'padding-global',
        children: [{
          tag: 'div',
          className: 'container-large',
          children: [
            { tag: 'div', className: 'section-heading_component is-centered', children: [
              { tag: 'h2', className: 'heading-style-h2', text: 'Everything you need' },
              { tag: 'p', className: 'text-size-medium text-color-secondary', text: 'Section description goes here.' },
            ]},
            { tag: 'div', className: 'features_grid', children: [
              { tag: 'div', className: 'features_item', children: [
                { tag: 'div', className: 'features_icon-wrapper', children: [{ tag: 'div', className: 'features_icon' }] },
                { tag: 'h3', className: 'heading-style-h5', text: 'Feature One' },
                { tag: 'p', className: 'text-size-regular text-color-secondary', text: 'Feature description text.' },
              ]},
              { tag: 'div', className: 'features_item', children: [
                { tag: 'div', className: 'features_icon-wrapper', children: [{ tag: 'div', className: 'features_icon' }] },
                { tag: 'h3', className: 'heading-style-h5', text: 'Feature Two' },
                { tag: 'p', className: 'text-size-regular text-color-secondary', text: 'Feature description text.' },
              ]},
              { tag: 'div', className: 'features_item', children: [
                { tag: 'div', className: 'features_icon-wrapper', children: [{ tag: 'div', className: 'features_icon' }] },
                { tag: 'h3', className: 'heading-style-h5', text: 'Feature Three' },
                { tag: 'p', className: 'text-size-regular text-color-secondary', text: 'Feature description text.' },
              ]},
            ]},
          ],
        }],
      }],
    },
    animationAttrs: { 'data-anim': 'fade-up' },
  },
  {
    name: 'Features — Alternating Rows',
    description: 'Feature sections alternating text/image sides.',
    category: 'features',
    tags: ['features', 'alternating', 'image'],
    structure: {
      tag: 'section',
      className: 'section_features',
      children: [{
        tag: 'div',
        className: 'padding-global',
        children: [{
          tag: 'div',
          className: 'container-large',
          children: [
            { tag: 'div', className: 'features_row', children: [
              { tag: 'div', className: 'features_content', children: [
                { tag: 'h2', className: 'heading-style-h3', text: 'Feature headline' },
                { tag: 'p', className: 'text-size-regular text-color-secondary', text: 'Description of this feature.' },
              ]},
              { tag: 'div', className: 'features_image-wrapper', children: [
                { tag: 'img', className: 'features_image', attrs: { alt: 'Feature image' } },
              ]},
            ]},
            { tag: 'div', className: 'features_row is-reversed', children: [
              { tag: 'div', className: 'features_content', children: [
                { tag: 'h2', className: 'heading-style-h3', text: 'Another feature' },
                { tag: 'p', className: 'text-size-regular text-color-secondary', text: 'Description of this feature.' },
              ]},
              { tag: 'div', className: 'features_image-wrapper', children: [
                { tag: 'img', className: 'features_image', attrs: { alt: 'Feature image' } },
              ]},
            ]},
          ],
        }],
      }],
    },
    animationAttrs: { 'data-anim': 'fade-up' },
  },

  // ── Testimonials ──
  {
    name: 'Testimonials — Grid',
    description: 'Three-column testimonial grid with avatar and quote.',
    category: 'testimonials',
    tags: ['testimonials', 'grid', 'social-proof'],
    structure: {
      tag: 'section',
      className: 'section_testimonials',
      children: [{
        tag: 'div',
        className: 'padding-global',
        children: [{
          tag: 'div',
          className: 'container-large',
          children: [
            { tag: 'div', className: 'section-heading_component is-centered', children: [
              { tag: 'h2', className: 'heading-style-h2', text: 'What people say' },
            ]},
            { tag: 'div', className: 'testimonials_grid', children: [
              { tag: 'div', className: 'testimonials_card', children: [
                { tag: 'p', className: 'testimonials_quote', text: '"This product changed how we work."' },
                { tag: 'div', className: 'testimonials_author', children: [
                  { tag: 'img', className: 'testimonials_avatar', attrs: { alt: 'Avatar' } },
                  { tag: 'div', className: 'testimonials_author-info', children: [
                    { tag: 'div', className: 'text-weight-semibold', text: 'Jane Doe' },
                    { tag: 'div', className: 'text-size-small text-color-tertiary', text: 'CEO, Company' },
                  ]},
                ]},
              ]},
              { tag: 'div', className: 'testimonials_card', children: [
                { tag: 'p', className: 'testimonials_quote', text: '"Incredible tool for our workflow."' },
                { tag: 'div', className: 'testimonials_author', children: [
                  { tag: 'img', className: 'testimonials_avatar', attrs: { alt: 'Avatar' } },
                  { tag: 'div', className: 'testimonials_author-info', children: [
                    { tag: 'div', className: 'text-weight-semibold', text: 'John Smith' },
                    { tag: 'div', className: 'text-size-small text-color-tertiary', text: 'CTO, Startup' },
                  ]},
                ]},
              ]},
              { tag: 'div', className: 'testimonials_card', children: [
                { tag: 'p', className: 'testimonials_quote', text: '"Saved us hours every week."' },
                { tag: 'div', className: 'testimonials_author', children: [
                  { tag: 'img', className: 'testimonials_avatar', attrs: { alt: 'Avatar' } },
                  { tag: 'div', className: 'testimonials_author-info', children: [
                    { tag: 'div', className: 'text-weight-semibold', text: 'Sarah Lee' },
                    { tag: 'div', className: 'text-size-small text-color-tertiary', text: 'Designer, Agency' },
                  ]},
                ]},
              ]},
            ]},
          ],
        }],
      }],
    },
    animationAttrs: { 'data-anim': 'fade-up' },
  },

  // ── FAQ ──
  {
    name: 'FAQ — Accordion',
    description: 'Expandable FAQ section with accordion items.',
    category: 'faq',
    tags: ['faq', 'accordion', 'schema'],
    structure: {
      tag: 'section',
      className: 'section_faq',
      children: [{
        tag: 'div',
        className: 'padding-global',
        children: [{
          tag: 'div',
          className: 'container-medium',
          children: [
            { tag: 'div', className: 'section-heading_component is-centered', children: [
              { tag: 'h2', className: 'heading-style-h2', text: 'Frequently asked questions' },
            ]},
            { tag: 'div', className: 'faq_list', children: [
              { tag: 'div', className: 'faq_item', children: [
                { tag: 'div', className: 'faq_question', children: [
                  { tag: 'div', className: 'text-weight-semibold', text: 'What is this product?' },
                  { tag: 'div', className: 'faq_icon' },
                ]},
                { tag: 'div', className: 'faq_answer', children: [
                  { tag: 'p', className: 'text-color-secondary', text: 'Answer text goes here.' },
                ]},
              ]},
              { tag: 'div', className: 'faq_item', children: [
                { tag: 'div', className: 'faq_question', children: [
                  { tag: 'div', className: 'text-weight-semibold', text: 'How does pricing work?' },
                  { tag: 'div', className: 'faq_icon' },
                ]},
                { tag: 'div', className: 'faq_answer', children: [
                  { tag: 'p', className: 'text-color-secondary', text: 'Answer text goes here.' },
                ]},
              ]},
              { tag: 'div', className: 'faq_item', children: [
                { tag: 'div', className: 'faq_question', children: [
                  { tag: 'div', className: 'text-weight-semibold', text: 'Can I cancel anytime?' },
                  { tag: 'div', className: 'faq_icon' },
                ]},
                { tag: 'div', className: 'faq_answer', children: [
                  { tag: 'p', className: 'text-color-secondary', text: 'Answer text goes here.' },
                ]},
              ]},
            ]},
          ],
        }],
      }],
    },
  },

  // ── Pricing ──
  {
    name: 'Pricing — Cards',
    description: 'Three-tier pricing with toggle and feature lists.',
    category: 'pricing',
    tags: ['pricing', 'cards', 'toggle'],
    structure: {
      tag: 'section',
      className: 'section_pricing',
      children: [{
        tag: 'div',
        className: 'padding-global',
        children: [{
          tag: 'div',
          className: 'container-large',
          children: [
            { tag: 'div', className: 'section-heading_component is-centered', children: [
              { tag: 'h2', className: 'heading-style-h2', text: 'Simple, transparent pricing' },
              { tag: 'p', className: 'text-size-medium text-color-secondary', text: 'No hidden fees. Cancel anytime.' },
            ]},
            { tag: 'div', className: 'pricing_toggle', children: [
              { tag: 'span', className: 'pricing_toggle-label', text: 'Monthly' },
              { tag: 'div', className: 'pricing_toggle-switch' },
              { tag: 'span', className: 'pricing_toggle-label', text: 'Yearly' },
            ]},
            { tag: 'div', className: 'pricing_grid', children: [
              { tag: 'div', className: 'pricing_card', children: [
                { tag: 'div', className: 'pricing_header', children: [
                  { tag: 'div', className: 'heading-style-h6', text: 'Starter' },
                  { tag: 'div', className: 'pricing_price', children: [
                    { tag: 'span', className: 'heading-style-h2', text: '$9' },
                    { tag: 'span', className: 'text-color-tertiary', text: '/mo' },
                  ]},
                ]},
                { tag: 'div', className: 'pricing_features', children: [
                  { tag: 'div', className: 'pricing_feature-item', text: '5 projects' },
                  { tag: 'div', className: 'pricing_feature-item', text: 'Basic support' },
                  { tag: 'div', className: 'pricing_feature-item', text: '1 GB storage' },
                ]},
                { tag: 'a', className: 'button is-secondary w-full', text: 'Get started' },
              ]},
              { tag: 'div', className: 'pricing_card is-featured', children: [
                { tag: 'div', className: 'pricing_badge', text: 'Popular' },
                { tag: 'div', className: 'pricing_header', children: [
                  { tag: 'div', className: 'heading-style-h6', text: 'Pro' },
                  { tag: 'div', className: 'pricing_price', children: [
                    { tag: 'span', className: 'heading-style-h2', text: '$29' },
                    { tag: 'span', className: 'text-color-tertiary', text: '/mo' },
                  ]},
                ]},
                { tag: 'div', className: 'pricing_features', children: [
                  { tag: 'div', className: 'pricing_feature-item', text: 'Unlimited projects' },
                  { tag: 'div', className: 'pricing_feature-item', text: 'Priority support' },
                  { tag: 'div', className: 'pricing_feature-item', text: '10 GB storage' },
                ]},
                { tag: 'a', className: 'button w-full', text: 'Get started' },
              ]},
              { tag: 'div', className: 'pricing_card', children: [
                { tag: 'div', className: 'pricing_header', children: [
                  { tag: 'div', className: 'heading-style-h6', text: 'Enterprise' },
                  { tag: 'div', className: 'pricing_price', children: [
                    { tag: 'span', className: 'heading-style-h2', text: 'Custom' },
                  ]},
                ]},
                { tag: 'div', className: 'pricing_features', children: [
                  { tag: 'div', className: 'pricing_feature-item', text: 'Everything in Pro' },
                  { tag: 'div', className: 'pricing_feature-item', text: 'Dedicated support' },
                  { tag: 'div', className: 'pricing_feature-item', text: 'Custom integrations' },
                ]},
                { tag: 'a', className: 'button is-secondary w-full', text: 'Contact sales' },
              ]},
            ]},
          ],
        }],
      }],
    },
  },

  // ── CTA ──
  {
    name: 'CTA — Banner',
    description: 'Full-width call-to-action banner with heading and button.',
    category: 'cta',
    tags: ['cta', 'banner', 'conversion'],
    structure: {
      tag: 'section',
      className: 'section_cta',
      children: [{
        tag: 'div',
        className: 'padding-global',
        children: [{
          tag: 'div',
          className: 'container-large',
          children: [{
            tag: 'div',
            className: 'cta_component',
            children: [
              { tag: 'h2', className: 'heading-style-h3', text: 'Ready to get started?' },
              { tag: 'p', className: 'text-size-medium text-color-secondary', text: 'Join thousands of teams already using this product.' },
              { tag: 'div', className: 'cta_button-group', children: [
                { tag: 'a', className: 'button', text: 'Start free trial' },
                { tag: 'a', className: 'button is-link', text: 'Talk to sales' },
              ]},
            ],
          }],
        }],
      }],
    },
    animationAttrs: { 'data-anim': 'fade-up' },
  },

  // ── Footer ──
  {
    name: 'Footer — Multi-Column',
    description: 'Four-column footer with logo, links, and bottom bar.',
    category: 'footer',
    tags: ['footer', 'navigation', 'links'],
    structure: {
      tag: 'footer',
      className: 'section_footer',
      children: [{
        tag: 'div',
        className: 'padding-global',
        children: [{
          tag: 'div',
          className: 'container-large',
          children: [
            { tag: 'div', className: 'footer_top', children: [
              { tag: 'div', className: 'footer_brand', children: [
                { tag: 'img', className: 'footer_logo', attrs: { alt: 'Logo' } },
                { tag: 'p', className: 'text-size-small text-color-secondary', text: 'A brief company description.' },
              ]},
              { tag: 'div', className: 'footer_links-grid', children: [
                { tag: 'div', className: 'footer_links-column', children: [
                  { tag: 'div', className: 'footer_links-heading', text: 'Product' },
                  { tag: 'a', className: 'footer_link', text: 'Features' },
                  { tag: 'a', className: 'footer_link', text: 'Pricing' },
                  { tag: 'a', className: 'footer_link', text: 'Changelog' },
                ]},
                { tag: 'div', className: 'footer_links-column', children: [
                  { tag: 'div', className: 'footer_links-heading', text: 'Company' },
                  { tag: 'a', className: 'footer_link', text: 'About' },
                  { tag: 'a', className: 'footer_link', text: 'Blog' },
                  { tag: 'a', className: 'footer_link', text: 'Careers' },
                ]},
                { tag: 'div', className: 'footer_links-column', children: [
                  { tag: 'div', className: 'footer_links-heading', text: 'Support' },
                  { tag: 'a', className: 'footer_link', text: 'Help center' },
                  { tag: 'a', className: 'footer_link', text: 'Contact' },
                  { tag: 'a', className: 'footer_link', text: 'Status' },
                ]},
              ]},
            ]},
            { tag: 'div', className: 'footer_bottom', children: [
              { tag: 'div', className: 'text-size-small text-color-tertiary', text: '\u00a9 2026 Company. All rights reserved.' },
              { tag: 'div', className: 'footer_legal-links', children: [
                { tag: 'a', className: 'footer_legal-link', text: 'Privacy' },
                { tag: 'a', className: 'footer_legal-link', text: 'Terms' },
              ]},
            ]},
          ],
        }],
      }],
    },
  },

  // ── Contact ──
  {
    name: 'Contact — Form + Info',
    description: 'Contact section with form and company info side by side.',
    category: 'contact',
    tags: ['contact', 'form', 'info'],
    structure: {
      tag: 'section',
      className: 'section_contact',
      children: [{
        tag: 'div',
        className: 'padding-global',
        children: [{
          tag: 'div',
          className: 'container-large',
          children: [{
            tag: 'div',
            className: 'contact_layout',
            children: [
              { tag: 'div', className: 'contact_content', children: [
                { tag: 'h2', className: 'heading-style-h2', text: 'Get in touch' },
                { tag: 'p', className: 'text-size-medium text-color-secondary', text: 'Have a question? We\'d love to hear from you.' },
                { tag: 'div', className: 'contact_info-list', children: [
                  { tag: 'div', className: 'contact_info-item', children: [
                    { tag: 'div', className: 'contact_info-icon' },
                    { tag: 'div', className: 'contact_info-text', text: 'hello@company.com' },
                  ]},
                  { tag: 'div', className: 'contact_info-item', children: [
                    { tag: 'div', className: 'contact_info-icon' },
                    { tag: 'div', className: 'contact_info-text', text: '123 Main Street, City' },
                  ]},
                ]},
              ]},
              { tag: 'div', className: 'contact_form-wrapper', children: [
                { tag: 'form', className: 'contact_form', children: [
                  { tag: 'div', className: 'form_field-group', children: [
                    { tag: 'div', className: 'form_field', children: [
                      { tag: 'label', className: 'form_label', text: 'Name' },
                      { tag: 'input', className: 'form_input', attrs: { type: 'text', placeholder: 'Your name' } },
                    ]},
                    { tag: 'div', className: 'form_field', children: [
                      { tag: 'label', className: 'form_label', text: 'Email' },
                      { tag: 'input', className: 'form_input', attrs: { type: 'email', placeholder: 'your@email.com' } },
                    ]},
                  ]},
                  { tag: 'div', className: 'form_field', children: [
                    { tag: 'label', className: 'form_label', text: 'Message' },
                    { tag: 'textarea', className: 'form_textarea', attrs: { placeholder: 'Your message...' } },
                  ]},
                  { tag: 'button', className: 'button w-full', text: 'Send message', attrs: { type: 'submit' } },
                ]},
              ]},
            ],
          }],
        }],
      }],
    },
  },

  // ── Logo Strip ──
  {
    name: 'Logo Strip — Static',
    description: 'Row of partner/client logos.',
    category: 'logo-strip',
    tags: ['logos', 'clients', 'partners'],
    structure: {
      tag: 'section',
      className: 'section_logo-strip',
      children: [{
        tag: 'div',
        className: 'padding-global',
        children: [{
          tag: 'div',
          className: 'container-large',
          children: [
            { tag: 'p', className: 'text-size-small text-color-tertiary text-align-center', text: 'Trusted by leading companies' },
            { tag: 'div', className: 'logo-strip_grid', children: [
              { tag: 'img', className: 'logo-strip_logo', attrs: { alt: 'Company logo' } },
              { tag: 'img', className: 'logo-strip_logo', attrs: { alt: 'Company logo' } },
              { tag: 'img', className: 'logo-strip_logo', attrs: { alt: 'Company logo' } },
              { tag: 'img', className: 'logo-strip_logo', attrs: { alt: 'Company logo' } },
              { tag: 'img', className: 'logo-strip_logo', attrs: { alt: 'Company logo' } },
            ]},
          ],
        }],
      }],
    },
  },
  {
    name: 'Logo Strip — Marquee',
    description: 'Infinite scrolling logo marquee with GSAP animation.',
    category: 'logo-strip',
    tags: ['logos', 'marquee', 'animation', 'gsap'],
    structure: {
      tag: 'section',
      className: 'section_logo-strip',
      children: [{
        tag: 'div',
        className: 'logo-strip_marquee-wrapper',
        children: [{
          tag: 'div',
          className: 'logo-strip_marquee-track',
          children: [
            { tag: 'img', className: 'logo-strip_logo', attrs: { alt: 'Company logo' } },
            { tag: 'img', className: 'logo-strip_logo', attrs: { alt: 'Company logo' } },
            { tag: 'img', className: 'logo-strip_logo', attrs: { alt: 'Company logo' } },
            { tag: 'img', className: 'logo-strip_logo', attrs: { alt: 'Company logo' } },
            { tag: 'img', className: 'logo-strip_logo', attrs: { alt: 'Company logo' } },
          ],
        }],
      }],
    },
    animationAttrs: { 'data-gsap': 'marquee' },
  },

  // ── Team ──
  {
    name: 'Team — Grid',
    description: 'Team member grid with photos and roles.',
    category: 'team',
    tags: ['team', 'grid', 'about'],
    structure: {
      tag: 'section',
      className: 'section_team',
      children: [{
        tag: 'div',
        className: 'padding-global',
        children: [{
          tag: 'div',
          className: 'container-large',
          children: [
            { tag: 'div', className: 'section-heading_component is-centered', children: [
              { tag: 'h2', className: 'heading-style-h2', text: 'Meet the team' },
              { tag: 'p', className: 'text-size-medium text-color-secondary', text: 'The people behind the product.' },
            ]},
            { tag: 'div', className: 'team_grid', children: [
              { tag: 'div', className: 'team_member', children: [
                { tag: 'img', className: 'team_photo', attrs: { alt: 'Team member' } },
                { tag: 'div', className: 'text-weight-semibold', text: 'Alex Johnson' },
                { tag: 'div', className: 'text-size-small text-color-secondary', text: 'CEO & Co-founder' },
              ]},
              { tag: 'div', className: 'team_member', children: [
                { tag: 'img', className: 'team_photo', attrs: { alt: 'Team member' } },
                { tag: 'div', className: 'text-weight-semibold', text: 'Sam Williams' },
                { tag: 'div', className: 'text-size-small text-color-secondary', text: 'CTO & Co-founder' },
              ]},
              { tag: 'div', className: 'team_member', children: [
                { tag: 'img', className: 'team_photo', attrs: { alt: 'Team member' } },
                { tag: 'div', className: 'text-weight-semibold', text: 'Chris Lee' },
                { tag: 'div', className: 'text-size-small text-color-secondary', text: 'Head of Design' },
              ]},
              { tag: 'div', className: 'team_member', children: [
                { tag: 'img', className: 'team_photo', attrs: { alt: 'Team member' } },
                { tag: 'div', className: 'text-weight-semibold', text: 'Jordan Taylor' },
                { tag: 'div', className: 'text-size-small text-color-secondary', text: 'Lead Engineer' },
              ]},
            ]},
          ],
        }],
      }],
    },
    animationAttrs: { 'data-anim': 'fade-up' },
  },

  // ── Blog List ──
  {
    name: 'Blog — Grid',
    description: 'Blog post grid with thumbnails, titles, and meta info.',
    category: 'blog',
    tags: ['blog', 'grid', 'cms'],
    structure: {
      tag: 'section',
      className: 'section_blog',
      children: [{
        tag: 'div',
        className: 'padding-global',
        children: [{
          tag: 'div',
          className: 'container-large',
          children: [
            { tag: 'div', className: 'section-heading_component', children: [
              { tag: 'h2', className: 'heading-style-h2', text: 'Latest articles' },
              { tag: 'a', className: 'button is-link is-small', text: 'View all' },
            ]},
            { tag: 'div', className: 'blog_grid', children: [
              { tag: 'a', className: 'blog_card', children: [
                { tag: 'div', className: 'blog_image-wrapper', children: [
                  { tag: 'img', className: 'blog_image', attrs: { alt: 'Blog post' } },
                ]},
                { tag: 'div', className: 'blog_content', children: [
                  { tag: 'div', className: 'blog_meta', children: [
                    { tag: 'span', className: 'blog_category-badge', text: 'Category' },
                    { tag: 'span', className: 'text-size-small text-color-tertiary', text: 'Mar 10, 2026' },
                  ]},
                  { tag: 'h3', className: 'heading-style-h5', text: 'Blog post title goes here' },
                  { tag: 'p', className: 'text-size-small text-color-secondary', text: 'Brief excerpt of the blog post content...' },
                ]},
              ]},
              { tag: 'a', className: 'blog_card', children: [
                { tag: 'div', className: 'blog_image-wrapper', children: [
                  { tag: 'img', className: 'blog_image', attrs: { alt: 'Blog post' } },
                ]},
                { tag: 'div', className: 'blog_content', children: [
                  { tag: 'div', className: 'blog_meta', children: [
                    { tag: 'span', className: 'blog_category-badge', text: 'Category' },
                    { tag: 'span', className: 'text-size-small text-color-tertiary', text: 'Mar 8, 2026' },
                  ]},
                  { tag: 'h3', className: 'heading-style-h5', text: 'Another blog post title' },
                  { tag: 'p', className: 'text-size-small text-color-secondary', text: 'Brief excerpt of the blog post content...' },
                ]},
              ]},
              { tag: 'a', className: 'blog_card', children: [
                { tag: 'div', className: 'blog_image-wrapper', children: [
                  { tag: 'img', className: 'blog_image', attrs: { alt: 'Blog post' } },
                ]},
                { tag: 'div', className: 'blog_content', children: [
                  { tag: 'div', className: 'blog_meta', children: [
                    { tag: 'span', className: 'blog_category-badge', text: 'Category' },
                    { tag: 'span', className: 'text-size-small text-color-tertiary', text: 'Mar 5, 2026' },
                  ]},
                  { tag: 'h3', className: 'heading-style-h5', text: 'Third blog post title' },
                  { tag: 'p', className: 'text-size-small text-color-secondary', text: 'Brief excerpt of the blog post content...' },
                ]},
              ]},
            ]},
          ],
        }],
      }],
    },
  },
];
