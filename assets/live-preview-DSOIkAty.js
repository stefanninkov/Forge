import{c as g,r as d,j as t}from"./index-HPjshD1Z.js";import{S as I,T as E,M}from"./tablet-DrBy4F6n.js";import{R as L}from"./rotate-ccw-BED8W1vh.js";const P=[["rect",{x:"14",y:"3",width:"5",height:"18",rx:"1",key:"kaeet6"}],["rect",{x:"5",y:"3",width:"5",height:"18",rx:"1",key:"1wsw3u"}]],H=g("pause",P);const N=[["path",{d:"M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z",key:"10ikf1"}]],O=g("play",N),x={desktop:{width:1440,label:"Desktop",icon:M},tablet:{width:768,label:"Tablet",icon:E},mobile:{width:375,label:"Mobile",icon:I}};function v(e,a=0){const r="  ".repeat(a),o=e.attributes?Object.entries(e.attributes).map(([n,u])=>` ${n}="${u}"`).join(""):"",s=e.className?` class="${e.className}"`:"";if(!e.children?.length&&!e.text)return e.tag==="img"?`${r}<${e.tag}${s}${o} />`:`${r}<${e.tag}${s}${o}></${e.tag}>`;const c=e.text||"",f=e.children?.map(n=>v(n,a+1)).join(`
`)||"",p=c+(f?`
`+f+`
`+r:"");return`${r}<${e.tag}${s}${o}>${p}</${e.tag}>`}function T(e){return Object.entries(e).map(([a,r])=>{const o=Object.entries(r).map(([s,c])=>`  ${s.replace(/([A-Z])/g,"-$1").toLowerCase()}: ${c};`).join(`
`);return`${a} {
${o}
}`}).join(`

`)}function W({html:e,css:a,js:r,elements:o,styles:s,animationScript:c,showResponsiveControls:f=!0,showAnimationToggle:p=!1,height:n=400}){const[u,j]=d.useState("desktop"),[l,$]=d.useState(!1),w=d.useRef(null),[k,C]=d.useState(0),b=d.useMemo(()=>e||(o?o.map(i=>v(i)).join(`
`):'<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#6b7270;font-family:sans-serif;">No content to preview</div>'),[e,o]),m=d.useMemo(()=>a||(s?T(s):""),[a,s]),z=d.useMemo(()=>{const i=l&&c?`<script>${c}<\/script>`:"";return`<!DOCTYPE html>
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
    ${m}
  </style>
</head>
<body>
  ${b}
  ${r?`<script>${r}<\/script>`:""}
  ${i}
</body>
</html>`},[b,m,r,l,c]),h=x[u].width;return t.jsxs("div",{style:{display:"flex",flexDirection:"column",height:typeof n=="number"?n:void 0,minHeight:typeof n=="string"?n:void 0,border:"1px solid var(--border-default)",borderRadius:8,overflow:"hidden",backgroundColor:"var(--bg-secondary)"},children:[(f||p)&&t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",height:36,padding:"0 12px",borderBottom:"1px solid var(--border-default)",backgroundColor:"var(--bg-primary)"},children:[f&&t.jsxs("div",{style:{display:"flex",gap:2},children:[Object.keys(x).map(i=>{const{icon:S,label:R}=x[i],y=i===u;return t.jsx("button",{onClick:()=>j(i),title:R,style:{display:"flex",alignItems:"center",justifyContent:"center",width:28,height:28,border:"none",borderRadius:4,backgroundColor:y?"var(--accent-subtle)":"transparent",color:y?"var(--accent-text)":"var(--text-tertiary)",cursor:"pointer"},children:t.jsx(S,{size:14})},i)}),t.jsxs("span",{style:{marginLeft:8,fontSize:"var(--text-xs)",fontFamily:"var(--font-mono)",color:"var(--text-tertiary)",alignSelf:"center"},children:[h,"px"]})]}),t.jsxs("div",{style:{display:"flex",gap:4},children:[p&&t.jsxs("button",{onClick:()=>$(!l),style:{display:"flex",alignItems:"center",gap:4,height:24,padding:"0 8px",border:"none",borderRadius:4,backgroundColor:l?"var(--accent-subtle)":"var(--surface-hover)",color:l?"var(--accent-text)":"var(--text-secondary)",fontSize:"var(--text-xs)",fontWeight:500,cursor:"pointer",fontFamily:"var(--font-sans)"},children:[l?t.jsx(H,{size:12}):t.jsx(O,{size:12}),"Animations"]}),t.jsx("button",{onClick:()=>C(i=>i+1),title:"Reload preview",style:{display:"flex",alignItems:"center",justifyContent:"center",width:24,height:24,border:"none",borderRadius:4,backgroundColor:"transparent",color:"var(--text-tertiary)",cursor:"pointer"},children:t.jsx(L,{size:12})})]})]}),t.jsx("div",{style:{flex:1,display:"flex",justifyContent:"center",alignItems:"stretch",padding:16,overflow:"auto",minHeight:0},children:t.jsx("div",{style:{width:h,maxWidth:"100%",flex:1,transition:"width 300ms ease",boxShadow:"0 1px 3px rgba(0,0,0,0.1)",borderRadius:4,overflow:"hidden",backgroundColor:"#ffffff"},children:t.jsx("iframe",{ref:w,srcDoc:z,sandbox:"allow-scripts",style:{width:"100%",height:typeof n=="number"?n-70:"100%",minHeight:300,border:"none",display:"block"},title:"Live Preview"},k)})})]})}export{W as L};
