import{a as Tt,b as Yt,c as pt,l as Xt,m as mt,n as Ft,p as Nt,q as Jt,r as U,s as Ct,t as Qt,v as Kt,w as Et,x as Zt,y as te,z as ee}from"./chunk-NPLN2PEB.js";var we=()=>document.getElementById("fig-burette").__burette,{R:K,TILT:R,LOOK:P,DEG:J,readingText:ge,lookOf:oe,TRUE_ML:Q}=we(),ne=.43,A=.428,G=.075,Me=3,ue=.03,rt=8.6,zt=18,Ge=2*rt*Math.tan(zt/2*J),S=22,at=28,xt=-.85,ae=.17,re=.055,be={rise:750,hold:700,fall:1150},ye=n=>Math.min(1100,Math.max(450,450+650*(Math.abs(n)/R))),Pe=90,wt=.002,se=.06,_t=n=>n<=0?0:n>=1?1:n*n*n*(n*(6*n-15)+10),Ht=(n,f,V)=>Math.max(f,Math.min(V,n)),Ae=(n,f,V)=>{let q=Ht((V-n)/(f-n),0,1);return q*q*(3-2*q)},Gt=n=>{let f=new Nt(n).getHex();return new Ft((f>>16&255)/255,(f>>8&255)/255,(f&255)/255)},$t=.06,ke=`
out vec3 vWorldPos;
out vec3 vNormal;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorldPos = w.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`,ie=`
uniform vec3 uInk;
uniform vec3 uGround;
uniform vec3 uLiquid;
uniform vec3 uGloss3;
uniform float uAlpha;
uniform float uHalo;
uniform float uGloss;
in vec3 vWorldPos;
out highp vec4 fragColor;
float band(float d, float hw, float aa) { return 1.0 - smoothstep(hw - aa, hw + aa, d); }
float dist(float v, float period) { return abs(fract(v / period + 0.5) - 0.5) * period; }
void main() {
  float mL = ${Q.toFixed(2)} - vWorldPos.y;
  float aa = max(fwidth(mL), 1e-5);
  float ax = abs(vWorldPos.x);
  float axa = max(fwidth(vWorldPos.x), 1e-5);
  float front = step(0.0, vWorldPos.z);
  float d1 = dist(mL, 0.1), d5 = dist(mL, 0.5), d10 = dist(mL, 1.0);
  // minor ticks span \xB10.27 rad of the front, half-mL ticks \xB10.42 rad, whole-mL rings the full circumference
  float wMinor = ${(K*Math.sin(.27)).toFixed(4)}, wHalf = ${(K*Math.sin(.42)).toFixed(4)};
  float minor = band(d1, 0.006, aa) * band(ax, wMinor, axa) * front;
  float halfT = band(d5, 0.008, aa) * band(ax, wHalf, axa) * front;
  float ring = band(d10, 0.010, aa);
  float core = max(max(minor, halfT), ring);
  float k = 1.6; // knockout width in pixels, above and below each front tick (not past its ends)
  float halo = max(
    band(d1, 0.006 + k * aa, aa) * band(ax, wMinor, axa),
    band(d5, 0.008 + k * aa, aa) * band(ax, wHalf, axa)) * front * uHalo;
  float a = max(core, halo);
  vec3 dir = vWorldPos - cameraPosition;
  float tm = (${ue.toFixed(3)} - vWorldPos.y) / min(dir.y, -1e-6);
  bool overLiquid = vWorldPos.y < ${G.toFixed(3)} || (dir.y < 0.0 && length((vWorldPos + dir * tm).xz) < ${A.toFixed(3)});
  vec3 under = overLiquid ? uLiquid : uGround;
  // a faint highlight streak down the front glass (paper tone), under the graduations
  float gloss = uGloss * 0.5 * (1.0 - smoothstep(0.0, 0.03, abs(vWorldPos.x - 0.335))) * front;
  float A = 1.0 - (1.0 - gloss) * (1.0 - a);
  vec3 P = uInk * core + under * (a - core) + uGloss3 * gloss * (1.0 - a);
  fragColor = vec4(P / max(A, 1e-4), A * uAlpha);
}`,Le=`
uniform vec3 uInk;
in vec3 vWorldPos;
in vec3 vNormal;
out highp vec4 fragColor;
void main() {
  float f = 1.0 - abs(dot(normalize(vNormal), normalize(cameraPosition - vWorldPos)));
  fragColor = vec4(uInk, ${$t.toFixed(3)} + 0.07 * f * f * f * f);
}`,We=`
uniform vec3 uInk;
uniform vec3 uGround;
uniform float uHalo;
in vec3 vWorldPos;
out highp vec4 fragColor;
void main() {
  vec3 p = vWorldPos;
  float s = cameraPosition.y * p.z;
  float dark = 1.0 - smoothstep(0.0, fwidth(s) + 1e-9, s);
  vec3 v = cameraPosition - p;
  float a = dot(v.xz, v.xz), b = dot(p.xz, v.xz), c = dot(p.xz, p.xz) - ${(A*A).toFixed(6)};
  float t = (-b + sqrt(max(b * b - a * c, 0.0))) / max(a, 1e-8);
  float yExit = p.y + t * v.y;
  float fy = fwidth(yExit) + 1e-6;
  float glaze = ${$t.toFixed(3)} * smoothstep(${G.toFixed(3)} - fy, ${G.toFixed(3)} + fy, yExit);
  float rr = length(p.xz) / ${A.toFixed(3)};
  float across = abs(p.z) / max(sqrt(max(${(A*A).toFixed(6)} - p.x * p.x, 0.0)), 1e-4);
  float tone = mix(0.88, 0.42, uHalo * smoothstep(0.0, 0.55, across));
  float edge = 1.0 - smoothstep(1.0 - fwidth(rr) - 1e-5, 1.0, rr);
  vec3 col = mix(uInk, mix(uGround, uInk, tone), dark);
  fragColor = vec4(col, mix(glaze, 1.0, dark) * edge);
}`,Te=`
in vec4 aLine;   // side (-1|1), radius, half width (world units at the target), alpha
in float aAcross;
uniform vec2 uViewport;
uniform float uPxPerUnit;
out float vAcross;
out float vHalf;
out float vAlpha;
void main() {
  float r = aLine.y;
  float dc = length(cameraPosition.xz);
  float zs = r * r / dc;
  float xs = aLine.x * sqrt(max(r * r - zs * zs, 0.0));
  vec4 c0 = projectionMatrix * viewMatrix * vec4(xs, position.y, zs, 1.0);
  vec4 c1 = projectionMatrix * viewMatrix * vec4(xs, position.y + 0.25, zs, 1.0);
  vec2 s0 = c0.xy / c0.w * uViewport * 0.5;
  vec2 s1 = c1.xy / c1.w * uViewport * 0.5;
  vec2 dir = normalize(s1 - s0);
  float hp = max(aLine.z * uPxPerUnit, 0.5);
  float ext = hp + 1.0;
  vec2 off = vec2(-dir.y, dir.x) * aAcross * ext;
  gl_Position = c0 + vec4(off / (uViewport * 0.5) * c0.w, 0.0, 0.0);
  vAcross = aAcross * ext;
  vHalf = hp;
  vAlpha = aLine.w;
}`,Fe=`
uniform vec3 uInk;
in float vAcross;
in float vHalf;
in float vAlpha;
out highp vec4 fragColor;
void main() {
  fragColor = vec4(uInk, clamp(vHalf + 0.5 - abs(vAcross), 0.0, 1.0) * vAlpha);
}`,Ne=`
in float aN;
out vec2 vUv;
out float vN;
out vec3 vWorldPos;
void main() {
  vUv = uv;
  vN = aN;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorldPos = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`,Ce=`
uniform sampler2D uMap;
uniform vec2 uRange;
uniform vec3 uInk;
uniform vec3 uGround;
uniform vec3 uLiquid;
in vec2 vUv;
in float vN;
in vec3 vWorldPos;
out highp vec4 fragColor;
void main() {
  if (vN < uRange.x - 0.5 || vN > uRange.y + 0.5) discard;
  float fill = texture(uMap, vec2(vUv.x * 0.5, vUv.y)).a;
  float knock = max(texture(uMap, vec2(0.5 + vUv.x * 0.5, vUv.y)).a, fill);
  vec3 dir = vWorldPos - cameraPosition;
  float tm = (${ue.toFixed(3)} - vWorldPos.y) / min(dir.y, -1e-6);
  float r = length((vWorldPos + dir * tm).xz);
  float fr = fwidth(r) + 1e-5;
  float onMen = (dir.y < 0.0 && vWorldPos.y > ${G.toFixed(3)}) ? 1.0 - smoothstep(${A.toFixed(3)} - fr, ${A.toFixed(3)} + fr, r) : 0.0;
  vec3 behind = vWorldPos.y < ${G.toFixed(3)} ? uLiquid : uGround;
  float ka = (knock - fill) * (1.0 - onMen);
  fragColor = vec4(uInk * fill + behind * ka, fill + ka);
}`,Ee=n=>new Promise(f=>setTimeout(f,n));function ze(n){let{tokens:f,fig:V}=n,q=Gt(f.fg),It=Gt(f.plate),D={value:q},st={value:It},gt={value:It.clone().lerp(q,$t)},Ut={value:Gt(f.surface)},Mt={value:0},St={value:new mt(1,1)},Rt={value:100},bt={value:new mt(S,at)},ce=new Nt(f.plate),Vt=(getComputedStyle(V).getPropertyValue("--mono")||"").trim()||"ui-monospace, monospace",c=null,z,x,F,H,p,N=[],O=1,B=1,it=1,lt=1,r=0,j=NaN,g=!0,yt=!1,s="rest",l=null,k=0,ut=0,u={t0:0,phase:"",on:!1,done:!1},L="level",d="level",$=!1,ct=-1,Pt=-1,Z=t=>{x.position.set(0,rt*Math.sin(t),rt*Math.cos(t)),x.lookAt(0,0,0),x.updateMatrixWorld(),Mt.value=Ae(.5*J,2.5*J,Math.abs(t))},At=t=>Math.abs(t-P.above)<1e-9?"above":Math.abs(t-P.below)<1e-9?"below":oe(Q,t)==="level"?"level":null;function fe(){let a=at-S+1;p.clearRect(0,0,H.width,H.height),p.font=`500 88px ${Vt}`,p.textAlign="center",p.textBaseline="alphabetic",p.lineJoin="round",p.lineWidth=6,p.fillStyle=p.strokeStyle="#fff";for(let o=0;o<a;o++){let i=String(S+o),v=p.measureText(i),w=v.actualBoundingBoxAscent||62,M=v.actualBoundingBoxDescent||0,b=128*o+64+(w-M)/2;p.fillText(i,256/2,b),p.strokeText(i,256*1.5,b),p.fillText(i,256*1.5,b)}}function ft(t,e=zt){x.aspect=t,x.fov=e,x.updateProjectionMatrix()}function kt(t,e){St.value.set(t,e),Rt.value=e/(2*rt*Math.tan(x.fov*J/2))}let tt=2.9;function qt(t,e,a){return new Ft(t,e,a).project(x).y}function de(){let t=.505*Math.sin(xt),e=.505*Math.cos(xt),a=[],o=[];for(let i=S-1;i<=at+1;i++){let v=-(i-Q);[-.5,.5].some(M=>Math.abs(qt(0,v,M))<1)&&o.push(i);let w=v+ae;[w+re,w-re].every(M=>Math.abs(qt(t,M,e))<.96)&&a.push(i)}return{rings:o,labelled:a}}function ve(){let t=[],e=[P.above,P.level,P.below].map((o,i)=>{let v=Math.round(i*O/3),w=Math.round((i+1)*O/3),M=w-v,b=M/B,dt=2*Math.atan(tt/2/rt)/J;tt*b<1.15&&t.push(`panel only ${(tt*b).toFixed(2)} mL wide: the tube walls would be cut`),ft(b,dt),Z(o);let{rings:vt,labelled:Y}=de();for(let h of vt)Y.includes(h)||t.push(`${(o/J).toFixed(0)}\xB0: ring ${h} shows without its numeral`);return{t:o,x0:v,w:M,aspect:b,fov:dt,rings:vt}});for(let o of e)o.rings.join()!==e[1].rings.join()&&t.push(`rings ${o.rings} differ from level ${e[1].rings}`);let a=e.flatMap(o=>o.rings);bt.value.set(Math.min(...a),Math.max(...a)),c.setScissorTest(!0);for(let o of e)c.setViewport(o.x0,0,o.w,B),c.setScissor(o.x0,0,o.w,B),ft(o.aspect,o.fov),kt(o.w*(it/O),lt),Z(o.t),c.render(z,x);c.setScissorTest(!1),c.setViewport(0,0,O,B),bt.value.set(S,at),ft(O/B),kt(it,lt),Z(r),V.dataset.triCheck=JSON.stringify({errors:t,rings:e[1].rings,spanMl:tt,panelWidthMl:+(tt*e[1].aspect).toFixed(2)}),j=NaN}function Dt(t,e){if(t=Ht(t,-R,R),k=t,Math.abs(t-r)<=wt){l=null,r=t,s="rest",g=!0;return}l={from:r,to:t,dur:ye(t-r),t0:0,kind:e},s="glide"}function I(t){r=t,l=null,s="rest",d=$?L:At(t)}function he(t){let{rise:e,hold:a,fall:o}=be;if(t<e)return u.phase="rise",R*_t(t/e);if(t<e+a)return u.phase="hold",R;u.phase="fall";let i=(t-e-a)/o;return i>=1?null:R*(1-_t(i))}return{id:n.id,async init(t){c=t,z=new Jt,x=new ee(zt,1,.1,50);let e=0,a=(h,y,W=0)=>{let m=new Qt(h,y);return m.position.y=W,m.renderOrder=e++,m.matrixAutoUpdate=!1,m.updateMatrix(),m.frustumCulled=!1,z.add(m),N.push(y),m},o=(h,y={},W=ke)=>new te({glslVersion:Xt,vertexShader:W,fragmentShader:h,transparent:!0,depthWrite:!1,depthTest:!1,...y}),i=new Et(K,K,6,128,1,!0);N.push(i),a(i,o(ie,{side:Yt,uniforms:{uInk:D,uGround:st,uLiquid:gt,uGloss3:Ut,uAlpha:{value:.22},uHalo:{value:0},uGloss:{value:0}}}));let v=3+G,w=new Et(A,A,v,96,1,!0);N.push(w),a(w,o(Le,{side:Tt,uniforms:{uInk:D}}),G-v/2);let M=[];for(let h=0;h<=32;h++){let y=h/32;M.push(new mt(A*y,G*y**Me))}let b=new Zt(M,96);N.push(b),a(b,o(We,{side:pt,uniforms:{uInk:D,uGround:st,uHalo:Mt}}));{let h=[[-1,K,.0046,.9],[1,K,.0046,.9],[-1,ne,.0026,.55],[1,ne,.0026,.55]],y=[],W=[],m=[],et=[];h.forEach(([ot,nt,C,E],ht)=>{for(let Lt of[-3,3])for(let Wt of[-1,1])y.push(ot*nt,Lt,0),W.push(ot,nt,C,E),m.push(Wt);let _=ht*4;et.push(_,_+1,_+2,_+2,_+1,_+3)});let T=new Ct;T.setAttribute("position",new U(new Float32Array(y),3)),T.setAttribute("aLine",new U(new Float32Array(W),4)),T.setAttribute("aAcross",new U(new Float32Array(m),1)),T.setIndex(et),N.push(T),a(T,o(Fe,{side:pt,uniforms:{uInk:D,uViewport:St,uPxPerUnit:Rt}},Te))}a(i,o(ie,{side:Tt,uniforms:{uInk:D,uGround:st,uLiquid:gt,uGloss3:Ut,uAlpha:{value:1},uHalo:Mt,uGloss:{value:1}}})),await n.nextTask();try{await Promise.race([Promise.all([document.fonts.load(`500 88px ${Vt}`),document.fonts.ready]),Ee(3e3)])}catch{}let dt=256,vt=128,Y=at-S+1;H=document.createElement("canvas"),H.width=2*dt,H.height=vt*Y,p=H.getContext("2d"),fe(),F=new Kt(H),F.premultiplyAlpha=!0,F.anisotropy=4,N.push(F);{let W=Math.cos(xt),m=Math.sin(xt),et=[],T=[],ot=[],nt=[];for(let E=0;E<Y;E++){let ht=S+E,_=.505*m,Lt=.505*W,Wt=-(ht-Q)+ae,Ot=1-(E+1)/Y,Bt=1-E/Y;for(let[jt,pe,me,xe]of[[-.42/2,-.22/2,0,Ot],[.42/2,-.22/2,1,Ot],[-.42/2,.22/2,0,Bt],[.42/2,.22/2,1,Bt]])et.push(_+jt*W,Wt+pe,Lt-jt*m),T.push(me,xe),ot.push(ht);let X=E*4;nt.push(X,X+1,X+2,X+2,X+1,X+3)}let C=new Ct;C.setAttribute("position",new U(new Float32Array(et),3)),C.setAttribute("uv",new U(new Float32Array(T),2)),C.setAttribute("aN",new U(new Float32Array(ot),1)),C.setIndex(nt),N.push(C),a(C,o(Ce,{side:pt,premultipliedAlpha:!0,uniforms:{uMap:{value:F},uRange:bt,uInk:D,uGround:st,uLiquid:gt}},Ne))}Z(r),await n.nextTask(),await n.compile(c,z,x),await n.nextTask(),c.initTexture(F),g=!0},resize(t,e){O=t,B=e,it=c.domElement.width,lt=c.domElement.height,ft(t/e),kt(it,lt),g=!0},setState(t,{animate:e=!0}={}){if(t==="tri"){yt=!0,g=!0;return}t in P&&(u.on=!1,L=t,d=t,$=!0,ct=Pt=-1,e?Dt(P[t],"button"):(l=null,s="rest",r=k=P[t]),g=!0)},intro(){l=null,$=!1,L="level",d=null,r=k=0,u.on=!0,u.t0=0,u.phase="rise",u.done=!1,s="intro",g=!0},step(t){if(s==="intro"){u.t0||(u.t0=t-1e3/60);let e=he(t-u.t0);return e===null?(u.on=!1,u.done=!0,I(0),d="level",r!==j):(r=k=e,d=u.phase==="hold"?"above":null,!0)}if(s==="glide"){l.t0||(l.t0=t-1e3/60);let e=(t-l.t0)/l.dur;if(e>=1){let a=l.kind;return I(l.to),a==="button"&&(d=L),r!==j}return r=l.from+(l.to-l.from)*_t(e),!0}if(s==="follow"){let e=ut?Math.min(t-ut,64):16.666666666666668;return ut=t,r+=(k-r)*(1-Math.exp(-e/Pe)),Math.abs(k-r)<=wt?(I(k),r!==j):!0}return!1},draw(){if(c.setRenderTarget(null),c.setClearColor(ce,1),c.autoClear=!0,yt){yt=!1,ve();return}!g&&Math.abs(r-j)<1e-4||(Z(r),c.render(z,x),j=r,g=!1)},snapshot(){c&&c.getContext().isContextLost()&&(s!=="rest"||At(r)===null)&&this.rest();let t=s!=="rest",e=le(r),a=e&&(!t||s==="intro"&&u.phase==="hold")?e:null,o=t&&l&&l.kind==="button"?l.to:r,i=ge(Q,o),v=oe(Q,o),w=s==="intro"?"intro":t?"moving":u.done?"after-intro":"rest";return{state:a,poster:a,readout:{value:i,look:v,lit:d,phase:w},key:`${a}|${i}|${v}|${d}|${w}`}},rest(){s==="intro"&&(u.on=!1,u.done=!0),l=null;let t=le(r);if(t&&t===L){s="rest",d=L;return}r=k=P[L],s="rest",d=L,g=!0},snap(){if(s==="intro")u.on=!1,u.done=!0,I(0),d="level";else if(s==="glide"){let t=l.kind;I(l.to),t==="button"&&(d=L)}else s==="follow"&&I(k);g=!0},pointer(t,e){if(s==="intro")return;if(t.type==="pointerleave"||t.type==="pointercancel"){if($)return;d=null,Dt(0,"return"),s==="rest"&&I(0);return}if(t.type==="pointerenter")$=!1;else if($){if(ct<0){ct=t.clientX,Pt=t.clientY;return}if(Math.abs(t.clientX-ct)<24&&Math.abs(t.clientY-Pt)<24)return;$=!1}let a=Ht((e.top+e.height/2-t.clientY)/(e.height/2),-1,1),o=Math.sign(a)*Math.max(0,Math.abs(a)-se)/(1-se)*R;L="level",!(Math.abs(o-r)<=wt&&s==="rest")&&(s!=="follow"&&(ut=0),k=o,l=null,s="follow",(At(o)===null||Math.abs(o-r)>wt)&&(d=null))},async restore(){F&&(F.needsUpdate=!0),g=!0},dispose(){for(let t of N)t.dispose()},stats(){return{drawCalls:z?z.children.length:0,triangles:0}},scale(){return 1}}}function le(n){return Math.abs(n-P.above)<1e-9?"above":Math.abs(n-P.below)<1e-9?"below":Math.abs(n)<1e-9?"level":null}export{Ge as VIEW_H,ze as create};
