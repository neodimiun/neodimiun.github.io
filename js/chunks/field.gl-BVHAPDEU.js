import{A as W,e as F,f as E,g as j,h as G,i as X,j as I,k as H,m as U,n as D,o as $,p as O,q as P,r as N,s as V,t as _,u as K,y as q}from"./chunk-NPLN2PEB.js";function ie(i,t,s,e){let o=3*i,u=3*(s-i)-o,r=1-o-u,x=3*t,g=3*(e-t)-x,y=1-x-g,v=n=>((r*n+u)*n+o)*n,d=n=>((y*n+g)*n+x)*n;return n=>{if(n<=0)return 0;if(n>=1)return 1;let f=0,h=1,c=n;for(let k=0;k<20;k++){let B=v(c);if(Math.abs(B-n)<1e-5)break;B<n?f=c:h=c,c=(f+h)/2}return d(c)}}var ne=ie(.2,.7,.2,1),Y=(i,t,s)=>Math.min(s,Math.max(t,i)),L=i=>i>-Math.PI&&i<=Math.PI?i:Math.atan2(Math.sin(i),Math.cos(i)),oe=(()=>{try{return Y(+new URLSearchParams(location.search).get("slow")||1,1,50)}catch{return 1}})(),m=class{constructor(t,{angle:s=!1,eps:e}={}){this.v=t,this.angle=s,this.eps=e??(s?.001:1e-4),this.tw=null,this.fl=null}get busy(){return!!(this.tw||this.fl)}set(t){this.v=t,this.tw=null,this.fl=null}tween(t,s,e,o=ne){this.tw={from:this.v,to:t,t0:performance.now(),ms:s*oe,done:e,curve:o},this.fl=null}follow(t,s){this.angle&&(t=this.v+L(t-this.v)),this.fl?(this.fl.to=t,this.fl.tau=s):this.fl={to:t,tau:s,last:performance.now()},this.tw=null}snap(){let t=this.tw,s=this.fl;this.tw=null,this.fl=null,t?(this.v=this.angle?L(t.to):t.to,t.done&&t.done()):s&&(this.v=this.angle?L(s.to):s.to)}step(t){if(this.tw){let s=this.tw,e=s.ms>0?Y((t-s.t0)/s.ms,0,1):1,o=s.from+(s.to-s.from)*s.curve(e),u=o!==this.v;return this.v=o,e>=1&&(this.tw=null,this.angle&&(this.v=L(this.v)),s.done&&s.done()),u}if(this.fl){let s=this.fl,e=Math.min(64,t-s.last);s.last=t;let o=this.v+(s.to-this.v)*(1-Math.exp(-e/s.tau));return Math.abs(s.to-o)<this.eps?(this.v=this.angle?L(s.to):s.to,this.fl=null):this.v=o,!0}return!1}};function Z(i,t){let s=!1,e=!1;for(let o=0;o<i.length;o++)i[o].step(t)&&(s=!0);for(let o=0;o<i.length;o++)if(i[o].busy){e=!0;break}return{changed:s,moving:e}}var S=i=>{for(let t=0;t<8;t++){let s=!1;for(let e of i)e.busy&&(e.snap(),s=!0);if(!s)break}};var p=null,A=2.4,C=1.2,T=1024,R=8,le=(()=>{try{return Math.min(50,Math.max(1,+new URLSearchParams(location.search).get("slow")||1))}catch{return 1}})(),ue=`
uvec4 pcg4d(uvec4 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.w; v.y += v.z * v.x; v.z += v.x * v.y; v.w += v.y * v.z;
  v ^= v >> 16u;
  v.x += v.y * v.w; v.y += v.z * v.x; v.z += v.x * v.y; v.w += v.y * v.z;
  return v;
}
vec4 hash4(vec2 c, float salt) {
  ivec2 i = ivec2(floor(c + 0.5));
  uvec4 u = pcg4d(uvec4(uint(i.x + 4096), uint(i.y + 4096), uint(salt), 2654435769u));
  return vec4(u >> 8u) / 16777215.0;
}
`,Q=`
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`,re=`
precision highp float;
precision highp int;
varying vec2 vUv;
uniform float uC;
${ue}
float vnoiseP(vec2 x, float period, float salt) {
  vec2 i = floor(x); vec2 f = x - i; vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash4(mod(i, period), salt).x;
  float b = hash4(mod(i + vec2(1.0, 0.0), period), salt).x;
  float c = hash4(mod(i + vec2(0.0, 1.0), period), salt).x;
  float d = hash4(mod(i + vec2(1.0, 1.0), period), salt).x;
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float pnoise(vec2 x, float salt) {
  float s = 0.0, amp = 0.5, per = uC * 0.5, norm = 0.0;
  for (int o = 0; o < 3; o++) { s += amp * vnoiseP(x, per, salt + float(o) * 13.0); norm += amp; x *= 2.0; per *= 2.0; amp *= 0.5; }
  return (s / norm) * 2.0 - 1.0;
}
vec2 seedOffset(vec2 cell) { return 0.5 + 0.9 * (hash4(mod(cell, uC), 0.0).xy - 0.5); }
float seedW(vec2 cell) { float u = hash4(mod(cell, uC), 3.0).x; return 0.9 * u * u * u * u * u - 0.10; }
void main() {
  vec2 p0 = vUv * uC;
  vec2 p = p0 + 0.30 * vec2(pnoise(p0 * 0.5, 1.0), pnoise(p0 * 0.5 + 17.3, 2.0));
  vec2 n = floor(p); vec2 f = p - n;
  vec2 mg = vec2(0.0), mr = vec2(0.0); float md = 1e9;
  for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {
    vec2 g = vec2(float(i), float(j)); vec2 r = g + seedOffset(n + g) - f;
    float d = dot(r, r) - seedW(n + g);
    if (d < md) { md = d; mr = r; mg = g; }
  }
  float own = md; md = 8.0;
  for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {
    vec2 g = mg + vec2(float(i), float(j)); vec2 r = g + seedOffset(n + g) - f;
    vec2 dr = r - mr; float L = length(dr);
    if (L > 1e-3) md = min(md, (dot(r, r) - seedW(n + g) - own) / (2.0 * L));
  }
  vec2 id = mod(n + mg, uC);
  vec4 h = hash4(id, 5.0); vec4 h2 = hash4(id, 9.0);
  vec2 seed = n + mg + seedOffset(n + mg); vec2 rel = p0 - seed;
  float tsd = 1.0;
  if (h.x < 0.68) {
    float a = h.y * 3.14159265; vec2 nn = vec2(cos(a), sin(a));
    float s = dot(rel, nn); float o = (h.z - 0.5) * 0.8;
    float w = 0.09 + 0.36 * pow(h.w, 1.8);
    float e = abs(s - o) - 0.5 * w;
    if (h2.z < 0.05) {
      float b = (h2.y < 0.5 ? 1.0 : -1.0) * (0.55 + 0.35 * h2.x);
      vec2 tdir = vec2(-nn.y, nn.x) * cos(b) + nn * sin(b);
      float side = h2.z < 0.025 ? 1.0 : -1.0;
      e = max(e, side * (dot(rel, tdir) - (h2.w - 0.5) * 0.6));
    }
    tsd = e;
    if (h.x < 0.06) {
      float w2 = 0.09 + 0.08 * h2.y; float o2 = o + 0.5 * w + 0.10 + 0.20 * h2.x + 0.5 * w2;
      tsd = min(tsd, abs(s - o2) - 0.5 * w2);
    }
  }
  float R = h2.x;
  gl_FragColor = vec4(R, fract(R * 1.618 + h.z), clamp(md / 0.15, 0.0, 1.0), clamp(0.5 + tsd / 0.3, 0.0, 1.0));
}
`,ce=`
precision highp float;
precision highp int;
varying vec2 vUv;
uniform sampler2D uGrain;
uniform sampler2D uNoise;
uniform float uTile, uFieldMicrons, uMipBias, uLightAz, uLightEl, uSweep, uA1, uA2, uDist, uGloss;
uniform vec2 uOffset, uIndentC;
uniform float uEtch, uIndent, uEtch2, uIndent2, uXf;   // specimen A, specimen B, cross-fade A -> B
uniform float uXh, uXhA, uXhA2;                        // crosshair spread (1 = on the corners) and opacity (A, B)
uniform vec3 uAcc, uUnder;                             // crosshair line + underlay (display sRGB, from tokens)
float vnoise(vec2 x, vec2 salt, vec4 ch) {
  vec2 i = floor(x); vec2 f = x - i; vec2 u = f * f * (3.0 - 2.0 * f);
  return dot(texture(uNoise, (i + salt + u + 0.5) / 256.0), ch);
}
vec4 noiseAt(vec2 cell) { return texelFetch(uNoise, ivec2(mod(cell, 256.0)), 0); }
float shade(float R, float azimuth, float mott, vec3 L, vec3 H, float e) {
  float tilt = 0.03 + 0.28 * e;
  float az = azimuth * 6.2831853;
  vec3 n = normalize(vec3(cos(az) * tilt, sin(az) * tilt, 1.0));
  float base = mix(1.05, 0.98 - 0.46 * pow(R, 2.6), e);
  base *= 1.0 + mott * e;
  float spec = pow(max(dot(n, H), 0.0), mix(64.0, 40.0, uGloss)) * (0.08 + (0.18 + 0.10 * uGloss) * e);
  return base * (0.78 + 0.22 * dot(n, L)) + spec;
}
// per-pixel inputs shared by both specimens
vec4 g, gf; vec2 um, q; vec3 L, H;
float pxum, aa, defocus, gb, tb, twin, mott0, slow, attack, inc;
float lumAt(float etch, float ind) {
  float eB = smoothstep(0.0, 0.55, etch);
  float eC = smoothstep(0.25, 1.0, etch);
  float lum = mix(shade(g.r, g.g, mott0 + 0.22 * slow * (g.g - 0.5), L, H, eC),
                  shade(fract(g.r + 0.37), fract(g.g + 0.6), mott0 + 0.22 * slow * (fract(g.g + 0.6) - 0.5), L, H, eC), twin);
  if (defocus > 0.0) {
    float far = shade(gf.r, gf.g, 0.0, L, H, eC) * (1.0 - 0.10 * eB);
    lum = mix(lum, far, smoothstep(0.0, 1.0, defocus));
  }
  lum = mix(lum, 0.10, inc * 0.85);
  lum *= 1.0 - 0.85 * attack * gb * eB;
  lum *= 1.0 - 0.32 * (0.6 + 0.4 * attack) * tb * eC;
  if (ind > 0.0) {
    float a1 = uA1 * ind, a2 = uA2 * ind;
    float m = abs(q.x) / a1 + abs(q.y) / a2;
    float u = (abs(q.x) / a1) / max(m, 1e-4);
    m /= 1.0 - 0.06 * u * (1.0 - u);           // sink-in: sides bow inward, corners stay at +-a1, +-a2
    float aa2 = max(fwidth(m), 1e-4) * 0.75;
    float inside = 1.0 - smoothstep(1.0 - aa2, 1.0 + aa2, m);
    vec3 fn = normalize(vec3(-sign(q.x) * 0.286, -sign(q.y) * 0.286, 1.0));   // 22 deg faces of the 136 deg pyramid
    float facet = (0.11 + 0.07 * max(dot(fn, L), 0.0)) * (0.82 + 0.18 * m);
    float crease = min(abs(q.x), abs(q.y));
    facet *= 1.0 - 0.5 * (1.0 - smoothstep(0.6 - aa, 0.6 + aa, crease));
    float outside = smoothstep(1.0 - aa2, 1.0 + aa2, m);
    lum *= 1.0 - 0.12 * exp(-pow((m - 1.0) * uA1 / 1.5, 2.0)) * outside * ind;
    lum = mix(lum, facet, inside);
  }
  return lum;
}
void main() {
  um = (vUv - 0.5) * uFieldMicrons + uOffset;
  q = um - uIndentC;
  pxum = uFieldMicrons * fwidth(vUv.x);                  // um per device pixel (orthographic: exact)
  defocus = clamp(uMipBias * 0.25, 0.0, 1.0);
  g = texture(uGrain, um / uTile, uMipBias * 0.5);
  float dGB = g.b * uDist;
  float eT = (g.a - 0.5) * 2.0 * uDist;
  float dTB = abs(eT);
  aa = max(pxum * 0.75, 0.0012 * uFieldMicrons);
  gb = 1.0 - smoothstep(0.7 - aa, 0.7 + aa, dGB);
  tb = 1.0 - smoothstep(0.4 - aa, 0.4 + aa, dTB);
  if (defocus > 0.0) {
    float bl = 3.0 * defocus;
    gb = (1.0 - smoothstep(0.0, 0.7 + aa + bl, dGB)) * (1.0 - 0.6 * defocus);
    tb *= 1.0 - defocus;
    gf = texture(uGrain, um / uTile, uMipBias + 2.5);
  }
  twin = 1.0 - smoothstep(-aa, aa, eT);
  L = vec3(cos(uLightAz) * cos(uLightEl), sin(uLightAz) * cos(uLightEl), sin(uLightEl));
  H = normalize(L + vec3(0.0, 0.0, 1.0));
  float fine = (vnoise(um / 9.0, vec2(0.0), vec4(0.0, 1.0, 0.0, 0.0)) - 0.5) * (1.0 - smoothstep(0.08, 0.2, pxum / 9.0));
  mott0 = 0.10 * (vnoise(um / 26.0, vec2(0.0), vec4(1.0, 0.0, 0.0, 0.0)) - 0.5) + 0.05 * fine;
  slow = vnoise(um / 70.0, vec2(41.0, 17.0), vec4(0.0, 0.0, 1.0, 0.0)) - 0.5;
  // non-metallic inclusions (small oxides): about one 50 um cell in 14 holds one, 0.8-2.2 um in radius, so a 700 um
  // field at x200 shows about ten, as in clean 316L bar; the same dots sit in the polished and the etched field
  vec2 ic = floor(um / 50.0);
  vec4 ni = noiseAt(ic + vec2(101.0, 57.0));
  inc = 0.0;
  float ir = 0.8 + 1.4 * ni.w;
  if (ni.x > 0.93) inc = 1.0 - smoothstep(ir - aa, ir + aa, length(um - (ic + 0.2 + 0.6 * ni.yz) * 50.0));
  attack = 0.55 + 0.45 * vnoise(um / 17.0, vec2(83.0, 29.0), vec4(0.0, 0.0, 0.0, 1.0));

  float lum = lumAt(uEtch, uIndent);
  if (uXf > 0.0) lum = mix(lum, lumAt(uEtch2, uIndent2), uXf);
  lum += 0.26 * exp(-pow((vUv.x + vUv.y - 1.0 - uSweep) / 0.13, 2.0));
  lum *= mix(1.0, 0.88, smoothstep(0.72, 1.0, length(vUv - 0.5) * 2.0));
  float eC = smoothstep(0.25, 1.0, mix(uEtch, uEtch2, uXf));
  vec3 tint = mix(vec3(0.975, 0.985, 1.0), vec3(1.0, 0.99, 0.97), eC);
  float k = max(lum - 0.92, 0.0);
  lum = min(lum, 0.92) + 0.14 * (1.0 - exp(-k / 0.14));
  vec3 col = mix(vec3(0.16, 0.17, 0.18), vec3(0.95, 0.95, 0.94), max(lum, 0.0)) * tint;

  // measuring crosshairs (Fig. 2): vertical pair at x = +-a1, horizontal pair at y = +-a2, spread uXh (1.7 -> 1 as they
  // close). Widths are fractions of the field (1.5 px line, 3.5 px underlay on a 560 px field), never under 1.5 device px,
  // so a poster and the live frame show the same lines at any size.
  float xa = mix(uXhA, uXhA2, uXf);
  if (xa > 0.0) {
    float d = min(abs(abs(q.x) - uA1 * uXh), abs(abs(q.y) - uA2 * uXh));
    float wl = 0.5 * max(0.0027 * uFieldMicrons, 1.5 * pxum);   // never under 1.5 device px: a line that falls between
    float wu = 0.5 * max(0.0063 * uFieldMicrons, 3.0 * pxum);   // two pixel centres keeps its colour instead of going muddy
    float cu = 1.0 - smoothstep(wu - 0.5 * pxum, wu + 0.5 * pxum, d);
    float cl = 1.0 - smoothstep(wl - 0.5 * pxum, wl + 0.5 * pxum, d);
    col = mix(col, uUnder, cu * 0.6 * xa);
    col = mix(col, uAcc, cl * xa);
  }
  col += (texelFetch(uNoise, ivec2(gl_FragCoord.xy) & 255, 0).w - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}
`;function fe(){let i=new V;return i.setAttribute("position",new N(new Float32Array([-1,-1,0,3,-1,0,-1,3,0]),3)),i.setAttribute("uv",new N(new Float32Array([0,0,2,0,0,2]),2)),i}function he(i){let t=i.shared.get("field.grain");if(t)return t;let s=new $(T,T,{type:G,format:X,generateMipmaps:!0,minFilter:j,magFilter:E,wrapS:F,wrapT:F,depthBuffer:!1,stencilBuffer:!1,colorSpace:I}),e=256,o=new Uint8Array(e*e*4),u=2654435769;for(let n=0;n<o.length;n++)u^=u<<13,u^=u>>>17,u^=u<<5,o[n]=u>>>0&255;let r=new K(o,e,e,X,G);r.wrapS=r.wrapT=F,r.magFilter=r.minFilter=E,r.generateMipmaps=!1,r.colorSpace=I,r.needsUpdate=!0;let x=fe(),g=new W(-1,1,1,-1,0,1),y=new q({vertexShader:Q,fragmentShader:re,uniforms:{uC:{value:p.GRAIN.cells}},depthTest:!1,depthWrite:!1}),v=new P,d=new _(x,y);return d.frustumCulled=!1,v.add(d),t={rt:s,noise:r,geo:x,camera:g,bakeP:null},t.bake=async n=>{await i.compile(n,v,g),await i.nextTask();let f=Math.ceil(T/R),h=n.autoClear;n.autoClear=!1;try{for(let c=0;c<R;c++)s.scissor.set(0,c*f,T,Math.min(f,T-c*f)),s.scissorTest=!0,s.texture.generateMipmaps=c===R-1,n.setRenderTarget(s),n.render(v,g),s.texture.generateMipmaps=!0,n.setRenderTarget(null),c<R-1&&await i.nextTask()}finally{s.scissorTest=!1,n.autoClear=h}},t.ensure=n=>t.bakeP||(t.bakeP=t.bake(n)),t.restore=async n=>{n.properties.get(s).__webglFramebuffer||(t.bakeP=t.bake(n),await t.bakeP)},i.shared.set("field.grain",t),t}var J=i=>{let t={r:0,g:0,b:0};return new O(i).getRGB(t,H),new D(t.r,t.g,t.b)};function pe(i){p=i.fig.__field;let t=i.id==="field",s=t?p.HERO:p.BAND,e={etch:new m(1),indent:new m(t?0:1),sweep:new m(C),mip:new m(0),az:new m(A,{angle:!0}),gloss:new m(0),xh:new m(1),xhA:new m(t?0:1),xf:new m(0)},o=Object.values(e),u={etch:1,indent:0,xhA:0},r,x,g,y,v,d=i.fig.dataset.final,n=null,f=!1,h=0;function c(a){e.sweep.set(C),e.mip.set(0),e.xh.set(1),e.xf.set(0),t?(e.etch.set(a==="etched"?1:0),e.indent.set(0),e.xhA.set(0)):(e.etch.set(1),e.indent.set(a==="etched"?0:1),e.xhA.set(a==="measured"?1:0))}function k(a){let l=++h;S(o),l===h&&(Object.assign(u,{etch:e.etch.v,indent:e.indent.v,xhA:e.xhA.v},a),e.xf.set(0),e.xf.tween(1,240,()=>{e.etch.set(u.etch),e.indent.set(u.indent),e.xhA.set(u.xhA),e.xh.set(1),e.xf.set(0)}))}let B=()=>!o.some(a=>a.busy)&&e.xf.v===0&&e.mip.v===0&&e.sweep.v===C;return{id:i.id,async init(a){r=a,v=he(i),g=new W(-1,1,1,-1,0,1);let l=i.tokens;y=new q({vertexShader:Q,fragmentShader:ce,depthTest:!1,depthWrite:!1,uniforms:{uGrain:{value:v.rt.texture},uNoise:{value:v.noise},uTile:{value:p.GRAIN.cells*p.GRAIN.cellUm},uFieldMicrons:{value:s.field},uOffset:{value:new U(...p.OFFSET)},uIndentC:{value:new U(...p.OFFSET)},uMipBias:{value:0},uLightAz:{value:A},uLightEl:{value:.61},uSweep:{value:C},uA1:{value:p.A1},uA2:{value:p.A2},uDist:{value:.15*p.GRAIN.cellUm},uGloss:{value:0},uEtch:{value:1},uIndent:{value:0},uEtch2:{value:1},uIndent2:{value:0},uXf:{value:0},uXh:{value:1},uXhA:{value:0},uXhA2:{value:0},uAcc:{value:J(l.a)},uUnder:{value:J(l.surface)}}}),this.clear=new O(l.surface),x=new P;let w=new _(v.geo,y);w.frustumCulled=!1,x.add(w),await i.nextTask(),await v.ensure(r),await i.nextTask(),await i.compile(r,x,g)},resize(){},setState(a,{animate:l=!0}={}){let w=d;if(d=a,f=!1,n=null,!l){h++,S(o),c(a);return}let b=++h,z=()=>b===h;if(t){a==="etched"?(e.sweep.busy&&e.sweep.set(C),e.xf.busy&&e.xf.snap(),(e.etch.v!==1||e.etch.busy)&&e.etch.tween(1,600)):(e.etch.v!==0||e.etch.busy||w!==a)&&k({etch:0});return}if((e.mip.v!==0||e.mip.busy)&&e.mip.tween(0,300),(e.az.v!==A||e.az.busy)&&e.az.tween(A,400),a==="etched")(e.indent.v>0||e.xhA.v>0||e.indent.busy)&&k({indent:0,xhA:0});else if(a==="indented")e.xhA.v>0?k({indent:1,xhA:0}):(e.indent.v!==1||e.indent.busy)&&e.indent.tween(1,600);else{let M=()=>{z()&&(e.xhA.set(1),e.xh.set(1.7),e.xh.tween(1,700))};e.xf.busy&&e.xf.snap(),e.indent.v<1||e.indent.busy?e.indent.tween(1,600,M):(e.xhA.v<1||e.xh.busy)&&M()}},intro(){let a=++h,l=()=>a===h;f=!0;let w=performance.now(),b=(M,ee,te,se,ae)=>{M.tween(ee,te,ae),M.tw.t0=w+se*le},z=()=>{l()&&(f=!1,n=null)};if(t){d="etched",n="polished",c("polished"),e.sweep.set(-C),b(e.sweep,C,900,0,()=>{l()&&(n="etching")}),b(e.etch,1,1200,900,z);return}d="measured",n="etched",c("etched"),e.mip.set(4),e.az.set(A-Math.PI),e.xh.set(1.7),b(e.mip,0,700,0),b(e.az,A,1600,700),b(e.indent,1,600,2300,()=>{l()&&(n="indented",e.xhA.set(1))}),b(e.xh,1,700,2900,z)},step(a){let l=Z(o,a);return l.changed||l.moving},draw(){let a=y.uniforms;a.uEtch.value=e.etch.v,a.uIndent.value=e.indent.v,a.uSweep.value=e.sweep.v,a.uMipBias.value=e.mip.v,a.uLightAz.value=e.az.v,a.uGloss.value=e.gloss.v,a.uXh.value=e.xh.v,a.uXhA.value=e.xhA.v,a.uXf.value=e.xf.v,a.uEtch2.value=u.etch,a.uIndent2.value=u.indent,a.uXhA2.value=u.xhA,r.setRenderTarget(null),r.autoClear=!0,r.setClearColor(this.clear,1),r.render(x,g)},snapshot(){let a=f?t?"polished":n:d,l=B()&&Math.abs(e.az.v-A)<.001&&e.gloss.v===0,w=null;if(l&&!f){let M=t?e.etch.v===1?"etched":e.etch.v===0?"polished":null:e.indent.v===0&&e.xhA.v===0?"etched":e.indent.v===1&&e.xhA.v===0?"indented":e.indent.v===1&&e.xhA.v===1&&e.xh.v===1?"measured":null;w=M===d?M:null}let b=!t&&e.xhA.v===1&&e.xh.v===1&&!e.xh.busy&&!e.indent.busy&&e.xf.v===0,z=t?null:p.readout(a==="measured"&&b?"measured":"none");return{state:a,poster:w,readout:z,phase:f?n:null,key:`${a}|${w}|${f?n:""}|${z?z.hv:""}`}},rest(){e.az.set(A),e.gloss.set(0),this.snap()},snap(){h++,S(o),c(d),f=!1,n=null},pointer(a,l){if(t){if(a.type==="pointerleave"||a.type==="pointercancel"){e.az.follow(A,180),(e.gloss.v!==0||e.gloss.busy)&&e.gloss.tween(0,400);return}e.az.follow(Math.atan2(-(a.clientY-(l.top+l.height/2)),a.clientX-(l.left+l.width/2)),120),!(e.gloss.tw&&e.gloss.tw.to===1)&&e.gloss.v!==1&&e.gloss.tween(1,300)}},async restore(a){r=a,await v.restore(a)},dispose(){y.dispose()},stats(){return{drawCalls:1,triangles:1}},scale(a){return a?.75:1}}}export{pe as create};
