import{r as g,j as m}from"./index-tZrm9WAL.js";import{L as u}from"./live-preview-lbrId3eJ.js";function p(e,c=0){const i=e.properties._styles??{},r=e.properties.text,n=Object.entries(i).map(([t,o])=>`${t.replace(/([A-Z])/g,"-$1").toLowerCase()}: ${o}`).join("; "),l=e.suggestedClass;let s="div";if(e.type==="section")s="section";else if(e.type==="text"){const t=e.properties.fontSize,o=e.properties.fontWeight;t&&t>=32?s="h1":t&&t>=24?s="h2":t&&t>=20?s="h3":o&&o>=600&&t&&t>=16?s="h4":s="p"}else e.type==="svg"?s="div":e.type==="hr"&&(s="hr");if(s==="hr")return`<hr class="${l}" style="${n}" />`;const h=e.children.map(t=>p(t,c+1)).join(`
`),f=r?v(r):h;return e.properties.backgroundImage?`<div class="${l}" style="${n}; display: flex; align-items: center; justify-content: center; color: #888; font-size: 11px; background-color: #f0f0f0;">
      <span>Image</span>
    </div>`:`<${s} class="${l}" style="${n}">${f}</${s}>`}function v(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function w({structure:e,title:c,animationScript:i}){const r=g.useMemo(()=>p(e),[e]);return m.jsx(u,{html:r,css:`
    * { margin: 0; padding: 0; box-sizing: border-box; }
    img { max-width: 100%; height: auto; display: block; }
    h1, h2, h3, h4, h5, h6 { font-weight: inherit; }
    section, div { position: relative; }
  `,animationScript:i,showResponsiveControls:!0,showAnimationToggle:!!i,height:"100%"})}export{w as W};
