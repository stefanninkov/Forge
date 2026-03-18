import{c as g,r as l,j as t}from"./index-Bh_ZuSqJ.js";import{S as I,T as E,M}from"./tablet-gkubP16S.js";import{R as L}from"./rotate-ccw-mesweK5n.js";const P=[["rect",{x:"14",y:"3",width:"5",height:"18",rx:"1",key:"kaeet6"}],["rect",{x:"5",y:"3",width:"5",height:"18",rx:"1",key:"1wsw3u"}]],H=g("pause",P);const N=[["path",{d:"M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z",key:"10ikf1"}]],O=g("play",N),x={desktop:{width:1440,label:"Desktop",icon:M},tablet:{width:768,label:"Tablet",icon:E},mobile:{width:375,label:"Mobile",icon:I}};function v(e,s=0){const r="  ".repeat(s),i=e.attributes?Object.entries(e.attributes).map(([a,u])=>` ${a}="${u}"`).join(""):"",o=e.className?` class="${e.className}"`:"";if(!e.children?.length&&!e.text)return e.tag==="img"?`${r}<${e.tag}${o}${i} />`:`${r}<${e.tag}${o}${i}></${e.tag}>`;const c=e.text||"",f=e.children?.map(a=>v(a,s+1)).join(`
`)||"",p=c+(f?`
`+f+`
`+r:"");return`${r}<${e.tag}${o}${i}>${p}</${e.tag}>`}function T(e){return Object.entries(e).map(([s,r])=>{const i=Object.entries(r).map(([o,c])=>`  ${o.replace(/([A-Z])/g,"-$1").toLowerCase()}: ${c};`).join(`
`);return`${s} {
${i}
}`}).join(`

`)}function W({html:e,css:s,js:r,elements:i,styles:o,animationScript:c,showResponsiveControls:f=!0,showAnimationToggle:p=!1,height:a=400}){const[u,j]=l.useState("desktop"),[d,$]=l.useState(!1),w=l.useRef(null),[k,C]=l.useState(0),h=l.useMemo(()=>e||(i?i.map(n=>v(n)).join(`
`):'<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#6b7270;font-family:sans-serif;">No content to preview</div>'),[e,i]),b=l.useMemo(()=>s||(o?T(o):""),[s,o]),S=l.useMemo(()=>{const n=d&&c?`<script>${c}<\/script>`:"";return`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      color: #1a1f1e;
      background: #ffffff;
      min-height: 100vh;
    }
    img { max-width: 100%; height: auto; display: block; }
    .forge-image-placeholder {
      background: #f1f5f4;
      border: 1px dashed #cdd5d3;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #9ca3a1;
      font-size: 12px;
      min-height: 120px;
    }
    ${b}
  </style>
</head>
<body>
  ${h}
  ${r?`<script>${r}<\/script>`:""}
  ${n}
</body>
</html>`},[h,b,r,d,c]),m=x[u].width;return t.jsxs("div",{style:{display:"flex",flexDirection:"column",height:typeof a=="number"?a:void 0,minHeight:typeof a=="string"?a:void 0,border:"1px solid var(--border-default)",borderRadius:8,overflow:"hidden",backgroundColor:"var(--bg-secondary)"},children:[(f||p)&&t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",height:36,padding:"0 12px",borderBottom:"1px solid var(--border-default)",backgroundColor:"var(--bg-primary)"},children:[f&&t.jsxs("div",{style:{display:"flex",gap:2},children:[Object.keys(x).map(n=>{const{icon:z,label:R}=x[n],y=n===u;return t.jsx("button",{onClick:()=>j(n),title:R,style:{display:"flex",alignItems:"center",justifyContent:"center",width:28,height:28,border:"none",borderRadius:4,backgroundColor:y?"var(--accent-subtle)":"transparent",color:y?"var(--accent-text)":"var(--text-tertiary)",cursor:"pointer"},children:t.jsx(z,{size:14})},n)}),t.jsxs("span",{style:{marginLeft:8,fontSize:"var(--text-xs)",fontFamily:"var(--font-mono)",color:"var(--text-tertiary)",alignSelf:"center"},children:[m,"px"]})]}),t.jsxs("div",{style:{display:"flex",gap:4},children:[p&&t.jsxs("button",{onClick:()=>$(!d),style:{display:"flex",alignItems:"center",gap:4,height:24,padding:"0 8px",border:"none",borderRadius:4,backgroundColor:d?"var(--accent-subtle)":"var(--surface-hover)",color:d?"var(--accent-text)":"var(--text-secondary)",fontSize:"var(--text-xs)",fontWeight:500,cursor:"pointer",fontFamily:"var(--font-sans)"},children:[d?t.jsx(H,{size:12}):t.jsx(O,{size:12}),"Animations"]}),t.jsx("button",{onClick:()=>C(n=>n+1),title:"Reload preview",style:{display:"flex",alignItems:"center",justifyContent:"center",width:24,height:24,border:"none",borderRadius:4,backgroundColor:"transparent",color:"var(--text-tertiary)",cursor:"pointer"},children:t.jsx(L,{size:12})})]})]}),t.jsx("div",{style:{flex:1,display:"flex",justifyContent:"center",alignItems:"flex-start",padding:16,overflow:"auto",minHeight:0},children:t.jsx("div",{style:{width:m,maxWidth:"100%",flexShrink:0,height:"100%",transition:"width 300ms ease",boxShadow:"0 1px 3px rgba(0,0,0,0.1)",borderRadius:4,overflow:"hidden",backgroundColor:"#ffffff"},children:t.jsx("iframe",{ref:w,srcDoc:S,sandbox:"allow-scripts",style:{width:"100%",height:"100%",minHeight:300,border:"none",display:"block"},title:"Live Preview"},k)})})]})}export{W as L};
