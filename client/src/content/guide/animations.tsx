import { guideStyles as s } from './guide-styles';

export function AnimationsGuide() {
  return (
    <div style={s.section}>
      <h2 style={s.h2}>How the Animation System Works</h2>
      <p style={s.p}>
        Forge uses a data-attribute-based animation system. Instead of writing JavaScript or
        using Webflow Interactions, you add data attributes to elements. A single master script
        reads these attributes at runtime and creates the animations.
      </p>
      <p style={s.p}>
        This approach keeps animations declarative (visible in the Webflow Designer as custom
        attributes), easy to modify (change a value, see the result), and performant (one
        optimized script handles everything).
      </p>

      <h3 style={s.h3}>Example attributes</h3>
      <pre style={s.codeBlock}>
        <code>{`<!-- Basic fade-up on scroll -->
<div data-anim="fade-up" data-anim-duration="0.6" data-anim-delay="0.1">
  Content here
</div>

<!-- GSAP scroll-linked with scrub -->
<div data-anim="fade-up" data-anim-engine="gsap"
     data-anim-scrub="true" data-anim-start="top bottom"
     data-anim-end="top center">
  Scroll-linked content
</div>

<!-- Staggered children -->
<div data-anim="stagger" data-anim-stagger="0.1"
     data-anim-children="fade-up">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>`}</code>
      </pre>

      <hr style={s.divider} />

      <h2 style={s.h2}>CSS vs GSAP</h2>
      <p style={s.p}>
        The animation system supports two engines. Forge recommends the right one for each
        animation based on what it needs to do.
      </p>

      <h3 style={s.h3}>CSS Animations</h3>
      <p style={s.p}>
        CSS animations use IntersectionObserver to trigger CSS transitions when elements enter
        the viewport. They require no external library and work well for:
      </p>
      <ul style={s.ul}>
        <li>Fade in/out</li>
        <li>Scale up/down</li>
        <li>Slide from any direction</li>
        <li>Blur reveal</li>
        <li>Rotate entrance</li>
      </ul>

      <div style={s.tip}>
        <div style={s.calloutLabel}>Tip</div>
        If CSS can handle the animation, prefer it. CSS animations have zero JavaScript
        dependency and a smaller performance footprint.
      </div>

      <h3 style={s.h3}>GSAP Animations</h3>
      <p style={s.p}>
        GSAP (GreenSock Animation Platform) is needed when the animation requires features
        that CSS cannot provide:
      </p>
      <ul style={s.ul}>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Scroll-linked (scrub)</strong> — Animation
          progress tied directly to scroll position.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Pinning</strong> — Element stays fixed
          while the user scrolls through its animation.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Split text</strong> — Animate individual
          characters, words, or lines of text.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Complex stagger</strong> — Precise
          sequencing of multiple elements with custom timing.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Custom easing</strong> — Cubic bezier
          curves and spring physics beyond CSS ease functions.
        </li>
      </ul>

      <hr style={s.divider} />

      <h2 style={s.h2}>The Animation Playground</h2>
      <p style={s.p}>
        The Playground displays all available animations as a card grid. Each card contains a
        preview area where the animation loops on hover, the animation name, an engine badge
        (CSS or GSAP), and a trigger type badge (scroll, hover, click, or load).
      </p>
      <p style={s.p}>
        Use the search bar and filter dropdowns at the top to find animations by name, engine,
        trigger type, or category. Click any card to open the configurator.
      </p>

      <h2 style={s.h2}>The Configurator</h2>
      <p style={s.p}>
        The configurator provides real-time parameter adjustment with a live preview:
      </p>
      <ul style={s.ul}>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Duration</strong> — How long the
          animation takes (0.1s to 3s). Sweet spot for most UI animations: 0.3-0.8s.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Delay</strong> — Time before the
          animation starts (0s to 5s). Useful for staggered sequences.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Easing</strong> — The acceleration curve.
          Presets include ease-out (natural entrances), ease-in-out (smooth transitions),
          and custom cubic-bezier input.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Distance</strong> — How far the element
          moves in pixels or rem. 20-60px is typical. Larger values create more dramatic
          entrances.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Threshold</strong> — How much of the
          element must be visible to trigger (0-1). Lower values trigger earlier as you scroll.
        </li>
      </ul>
      <p style={s.p}>
        For GSAP animations, additional controls appear: scrub toggle, pin toggle, start/end
        scroll position, stagger delay, and split-text type (chars/words/lines).
      </p>

      <h2 style={s.h2}>Applying Animations</h2>
      <p style={s.p}>
        After configuring, you have three options:
      </p>
      <ul style={s.ul}>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Copy Attributes</strong> — Copies the
          data-attribute string to your clipboard. Paste it directly onto elements in Webflow.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Apply to Element</strong> — Opens an
          element selector to pick a Webflow element and push the attributes via MCP.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Save as Custom</strong> — Saves the
          configured animation to your personal library for reuse.
        </li>
      </ul>

      <hr style={s.divider} />

      <h2 style={s.h2}>The Master Script</h2>
      <p style={s.p}>
        The master script is the single JavaScript file that powers all data-attribute animations
        on your site. Without it, the data attributes do nothing.
      </p>

      <h3 style={s.h3}>Generating the script</h3>
      <ol style={s.ol}>
        <li>Go to the Animations page and click "Generate Script".</li>
        <li>
          Forge scans your project for all animation types in use and builds a script that
          includes only what is needed.
        </li>
        <li>
          The script includes: IntersectionObserver for CSS animations, GSAP initialization
          (if GSAP animations are used), scroll trigger setup, Lenis smooth scrolling (optional),
          and <code style={s.code}>prefers-reduced-motion</code> respect.
        </li>
      </ol>

      <h3 style={s.h3}>Deployment options</h3>
      <ul style={s.ul}>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>Embed</strong> — Paste the script into
          Webflow&apos;s global custom code (<code style={s.code}>{'<head>'}</code> or before{' '}
          <code style={s.code}>{'</body>'}</code>). Simple, but harder to update.
        </li>
        <li>
          <strong style={{ color: 'var(--text-primary)' }}>CDN</strong> — Host the script externally
          and paste the URL into Webflow. Better for caching and updates — change the hosted file
          without republishing in Webflow.
        </li>
      </ul>

      <div style={s.warning}>
        <div style={s.calloutLabel}>Important</div>
        Regenerate the master script whenever you add, remove, or modify animations. The status
        bar at the bottom of project pages will show "Script outdated" as a reminder.
      </div>
    </div>
  );
}
