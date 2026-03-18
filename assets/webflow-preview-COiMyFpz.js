import{r as f,j as m}from"./index-DClIfznR.js";import{L as x}from"./live-preview-C83Ns4Oj.js";function l(e,a=0){const i=e.properties._styles??{},o=e.properties.text,n=Object.entries(i).map(([t,r])=>`${t.replace(/([A-Z])/g,"-$1").toLowerCase()}: ${r}`).join("; "),p=e.suggestedClass;let s="div";if(e.type==="section")s="section";else if(e.type==="text"){const t=e.properties.fontSize,r=e.properties.fontWeight;t&&t>=32?s="h1":t&&t>=24?s="h2":t&&t>=20?s="h3":r&&r>=600&&t&&t>=16?s="h4":s="p"}else e.type==="svg"?s="div":e.type==="hr"&&(s="hr");if(s==="hr")return`<hr class="${p}" style="${n}" />`;const h=e.children.map(t=>l(t,a+1)).join(`
`),g=o?b(o):h;return e.properties.backgroundImage?`<div class="${p}" style="${n}; display: flex; align-items: center; justify-content: center; color: #888; font-size: 11px; background-color: #f0f0f0;">
      <span>Image</span>
    </div>`:`<${s} class="${p}" style="${n}">${g}</${s}>`}function b(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function y({structure:e,title:a,animationScript:i}){const o=f.useMemo(()=>l(e),[e]);return m.jsx(x,{html:o,css:`
    * { margin: 0; padding: 0; box-sizing: border-box; }
    img { max-width: 100%; height: auto; display: block; }
    h1, h2, h3, h4, h5, h6 { font-weight: inherit; }
    section { position: relative; min-height: 40px; border: 1px dashed #e2e8e6; padding: 8px; margin-bottom: 4px; }
    div { position: relative; min-height: 8px; }
    section:hover, div:hover { outline: 1px solid rgba(16, 185, 129, 0.3); }
    p, h1, h2, h3, h4, h5, h6 { padding: 2px 4px; }
    [class]::before { content: attr(class); position: absolute; top: 0; right: 0; font-size: 9px; color: rgba(16, 185, 129, 0.6); font-family: monospace; padding: 1px 4px; background: rgba(255,255,255,0.85); pointer-events: none; opacity: 0; transition: opacity 150ms; }
    [class]:hover::before { opacity: 1; }
  `,animationScript:i,showResponsiveControls:!0,showAnimationToggle:!!i,height:"100%"})}export{y as W};
