// Forge Browser Extension - Content Script
// Handles section capture and element inspection on the page.

(() => {
  let mode = null; // 'capture' | 'inspect' | null
  let overlay = null;
  let hoveredElement = null;

  function createOverlay() {
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'forge-overlay';

    const toolbar = document.createElement('div');
    toolbar.id = 'forge-toolbar';

    const modeLabel = document.createElement('span');
    modeLabel.id = 'forge-mode-label';
    modeLabel.textContent = 'Capture Mode';

    const elementInfo = document.createElement('span');
    elementInfo.id = 'forge-element-info';

    const confirmBtn = document.createElement('button');
    confirmBtn.id = 'forge-confirm';
    confirmBtn.textContent = 'Capture';

    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'forge-cancel';
    cancelBtn.textContent = '\u2715';

    toolbar.appendChild(modeLabel);
    toolbar.appendChild(elementInfo);
    toolbar.appendChild(confirmBtn);
    toolbar.appendChild(cancelBtn);
    overlay.appendChild(toolbar);
    document.body.appendChild(overlay);

    cancelBtn.addEventListener('click', stopMode);
    confirmBtn.addEventListener('click', confirmAction);

    return overlay;
  }

  function removeOverlay() {
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
    removeHighlight();
  }

  function highlightElement(el) {
    removeHighlight();
    if (!el || el === document.body || el === document.documentElement) return;

    hoveredElement = el;
    el.classList.add('forge-highlight');

    const info = document.getElementById('forge-element-info');
    if (info) {
      const tag = el.tagName.toLowerCase();
      const cls = el.className
        .toString()
        .replace('forge-highlight', '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .join('.');
      info.textContent = '<' + tag + (cls ? '.' + cls : '') + '>';
    }
  }

  function removeHighlight() {
    if (hoveredElement) {
      hoveredElement.classList.remove('forge-highlight');
      hoveredElement = null;
    }
  }

  function handleMouseMove(e) {
    if (!mode) return;
    highlightElement(e.target);
  }

  function handleClick(e) {
    if (!mode) return;
    e.preventDefault();
    e.stopPropagation();
  }

  function confirmAction() {
    if (!hoveredElement) return;

    if (mode === 'capture') {
      const html = hoveredElement.outerHTML;
      const computedStyles = getComputedStylesForElement(hoveredElement);

      sendToForge({
        type: 'section_captured',
        html,
        css: computedStyles,
        url: window.location.href,
        selector: getUniqueSelector(hoveredElement),
      });
    } else if (mode === 'inspect') {
      const info = getElementInfo(hoveredElement);
      sendToForge({
        type: 'element_inspected',
        ...info,
      });
    }

    stopMode();
  }

  function stopMode() {
    mode = null;
    removeOverlay();
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('click', handleClick, true);
  }

  function startMode(newMode) {
    mode = newMode;
    createOverlay();

    const label = document.getElementById('forge-mode-label');
    const btn = document.getElementById('forge-confirm');
    if (label) label.textContent = newMode === 'capture' ? 'Capture Mode' : 'Inspect Mode';
    if (btn) btn.textContent = newMode === 'capture' ? 'Capture' : 'Copy Info';

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick, true);
  }

  function getComputedStylesForElement(el) {
    const styles = window.getComputedStyle(el);
    const relevant = [
      'display', 'flex-direction', 'align-items', 'justify-content', 'gap',
      'padding', 'margin', 'width', 'height', 'max-width',
      'background-color', 'color', 'font-size', 'font-weight', 'font-family',
      'border', 'border-radius', 'box-shadow', 'position', 'z-index',
    ];
    const result = {};
    relevant.forEach((prop) => {
      const val = styles.getPropertyValue(prop);
      if (val) result[prop] = val;
    });
    return JSON.stringify(result, null, 2);
  }

  function getElementInfo(el) {
    const rect = el.getBoundingClientRect();
    const styles = window.getComputedStyle(el);
    return {
      tag: el.tagName.toLowerCase(),
      classes: Array.from(el.classList).filter((c) => c !== 'forge-highlight'),
      id: el.id || null,
      dimensions: { width: Math.round(rect.width), height: Math.round(rect.height) },
      text: (el.textContent || '').slice(0, 100) || null,
      attributes: Object.fromEntries(
        Array.from(el.attributes)
          .filter((a) => a.name !== 'class' && a.name !== 'id')
          .map((a) => [a.name, a.value])
      ),
      fontSize: styles.fontSize,
      color: styles.color,
      backgroundColor: styles.backgroundColor,
    };
  }

  function getUniqueSelector(el) {
    if (el.id) return '#' + el.id;
    const path = [];
    let current = el;
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.id) {
        path.unshift('#' + current.id);
        break;
      }
      if (current.className && typeof current.className === 'string') {
        const classes = current.className.replace('forge-highlight', '').trim();
        if (classes) selector += '.' + classes.split(/\s+/).join('.');
      }
      path.unshift(selector);
      current = current.parentElement;
    }
    return path.join(' > ');
  }

  async function sendToForge(data) {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      showNotification('Captured! Data copied to clipboard.');
    } catch {
      showNotification('Captured! Check extension popup for details.');
    }

    chrome.storage.local.set({ lastCapture: data });
  }

  function showNotification(message) {
    const notif = document.createElement('div');
    notif.className = 'forge-notification';
    notif.textContent = message;
    document.body.appendChild(notif);

    requestAnimationFrame(() => {
      notif.style.opacity = '1';
      notif.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
      notif.style.opacity = '0';
      notif.style.transform = 'translateY(-8px)';
      setTimeout(() => notif.remove(), 200);
    }, 2500);
  }

  // Handle messages from popup
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'startCapture') {
      startMode('capture');
    } else if (message.action === 'startInspect') {
      startMode('inspect');
    } else if (message.action === 'copySelection') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = document.createElement('div');
        container.appendChild(range.cloneContents());
        const selectionHtml = container.outerHTML;
        navigator.clipboard.writeText(selectionHtml).then(() => {
          showNotification('Selection HTML copied!');
        });
      }
    }
  });
})();
