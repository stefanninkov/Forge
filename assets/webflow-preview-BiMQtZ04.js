import{r as g,j as f}from"./index-D0HxGdT-.js";import{L as d}from"./live-preview-CZt-ZrSs.js";function l(e,o=0){const s={...e.properties._styles??{}},r=e.properties.text,n=e.suggestedClass;o===0&&(s.width="100%",s.maxWidth="100%",delete s.height),o<=2&&s.width&&parseInt(s.width)>=1200&&(s.width="100%");const a=Object.entries(s).map(([t,p])=>`${t.replace(/([A-Z])/g,"-$1").toLowerCase()}: ${p}`).join("; ");let i="div";if(e.type==="section")i="section";else if(e.type==="text"){const t=e.properties.fontSize,p=e.properties.fontWeight;t&&t>=32?i="h1":t&&t>=24?i="h2":t&&t>=20?i="h3":p&&p>=600&&t&&t>=16?i="h4":i="p"}else e.type==="svg"?i="div":e.type==="hr"&&(i="hr");if(i==="hr")return`<hr class="${n}" style="${a}" />`;const c=e.children.map(t=>l(t,o+1)).join(`
`),h=r?m(r):c;return e.properties.backgroundImage?`<div class="${n}" style="${a}; display: flex; align-items: center; justify-content: center; color: #999; font-size: 11px; background-color: #f1f5f4; min-height: 80px; border: 1px dashed #cdd5d3;">
      <span>IMG</span>
    </div>`:`<${i} class="${n}" style="${a}">${h}</${i}>`}function m(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function u({structure:e,title:o,animationScript:s}){const r=g.useMemo(()=>l(e),[e]);return f.jsx(d,{html:r,css:`
    * { margin: 0; padding: 0; box-sizing: border-box; }
    img { max-width: 100%; height: auto; display: block; }
    h1, h2, h3, h4, h5, h6 { font-weight: inherit; }
    section { position: relative; min-height: 40px; border: 1px dashed #e2e8e6; padding: 8px; margin-bottom: 4px; }
    div { position: relative; min-height: 8px; }
    section:hover, div:hover { outline: 1px solid rgba(16, 185, 129, 0.3); }
    p, h1, h2, h3, h4, h5, h6 { padding: 2px 4px; }
    [class]::before { content: attr(class); position: absolute; top: 0; right: 0; font-size: 9px; color: rgba(16, 185, 129, 0.6); font-family: monospace; padding: 1px 4px; background: rgba(255,255,255,0.85); pointer-events: none; opacity: 0; transition: opacity 150ms; }
    [class]:hover::before { opacity: 1; }
  `,animationScript:s,showResponsiveControls:!0,showAnimationToggle:!!s,height:"100%"})}export{u as W};
