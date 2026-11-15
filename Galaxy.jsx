/* Galaxy — adapted from the React Bits shader supplied for this portfolio. */
function Galaxy({ density=1, glowIntensity=0.3, flareIntensity=1, starSpeed=0.5, starSize=1, twinkleIntensity=0.3, speed=1, rotationSpeed=0.1, layers=4, mouseRepulsion=true, clickWarp=true, mouseInteraction=true, repulsionStrength=2, direction="forward", intro=true, saturation=0, hueShift=140, starColors=[], lightMode=false }) {
 const ref=useRef(null);
 useEffect(()=>{
 const canvas=ref.current, gl=canvas.getContext('webgl2',{alpha:true,antialias:false});
 if(!gl){
 // Canvas fallback for browsers with WebGL disabled.
 const replacement=document.createElement('canvas');canvas.replaceWith(replacement);
 const ctx=replacement.getContext('2d');let frameId,t=0;const stars=Array.from({length:240},()=>({x:Math.random(),y:Math.random(),r:.4+Math.random()*1.3,p:Math.random()*6.28}));
 const draw=()=>{const rect=replacement.getBoundingClientRect();replacement.width=Math.max(1,rect.width);replacement.height=Math.max(1,rect.height);ctx.clearRect(0,0,replacement.width,replacement.height);for(const s of stars){ctx.beginPath();ctx.fillStyle='rgba(220,230,255,'+(.35+.3*Math.sin(t+s.p))+')';ctx.shadowBlur=7;ctx.shadowColor='#dbe6ff';ctx.arc(s.x*replacement.width,((s.y+t*.002)%1)*replacement.height,s.r,0,Math.PI*2);ctx.fill();}t+=.012;frameId=requestAnimationFrame(draw);};draw();return()=>{cancelAnimationFrame(frameId);replacement.replaceWith(canvas);};
 }
 const vert=`#version 300 es
 in vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
 const frag=`#version 300 es
 precision highp float;
 uniform vec2 resolution,mouse;uniform float time,active,boost;out vec4 color;
 float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
 float star(vec2 p,float flare){float d=max(length(p),.0001);float m=${0.05*glowIntensity}/d;float rays=1.-smoothstep(0.,1.,abs(p.x*p.y*1000.));m+=rays*flare*${glowIntensity*flareIntensity};p=mat2(.7071,-.7071,.7071,.7071)*p;m+=(1.-smoothstep(0.,1.,abs(p.x*p.y*1000.)))*.3*flare*${glowIntensity*flareIntensity};return m*(1.-smoothstep(.2,1.,d));}
 void main(){vec2 uv=(gl_FragCoord.xy-.5*resolution)/resolution.y;vec2 mp=(mouse-.5)*resolution/resolution.y;vec2 away=uv-mp;uv-=normalize(away+vec2(.0001))*exp(-dot(away,away)*22.)*.045*active;float a=time*${Number(rotationSpeed).toFixed(4)};uv=mat2(cos(a),-sin(a),sin(a),cos(a))*uv;vec3 col=vec3(0.);for(int k=0;k<${Math.max(2,Math.min(8,layers))};k++){float i=float(k)/${Number(layers).toFixed(4)};float depth=fract(i+time*${starSpeed/10.});float scale=mix(20.*${Number(density).toFixed(4)},.5*${Number(density).toFixed(4)},depth);vec2 grid=uv*scale+i*453.32;vec2 cell=floor(grid),gv=fract(grid)-.5;for(int y=-1;y<=1;y++){for(int x=-1;x<=1;x++){vec2 off=vec2(float(x),float(y));float seed=hash(cell+off),size=fract(seed*345.32);vec2 pad=vec2(sin(seed*34.+time*.1),sin(seed*38.+time*.033))*.3;vec2 p=gv-off-pad;p/=1.+boost;float value=star(p,smoothstep(.9,1.,size));float twinkle=1.+${Number(twinkleIntensity*.5).toFixed(4)}*sin(time+seed*6.2831);col+=value*size*twinkle*depth*(1.-smoothstep(.9,1.,depth))*mix(vec3(1.),vec3(1.),seed);}}}float alpha=clamp(length(col),0.,.7);color=vec4(col,alpha);}`;
 const program=gl.createProgram();const shaders=[];
 for(const [type,source] of [[gl.VERTEX_SHADER,vert],[gl.FRAGMENT_SHADER,frag]]){const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){console.warn(gl.getShaderInfoLog(sh));return;}gl.attachShader(program,sh);shaders.push(sh);}
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return;gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);const loc=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
 const u=Object.fromEntries(['resolution','mouse','time','active','boost'].map(n=>[n,gl.getUniformLocation(program,n)]));let raf,visible=true,t=0,last=0,warp=0;const pointer={x:.5,y:.5,active:0};const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const resize=()=>{const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.max(1,Math.round(r.width*d));canvas.height=Math.max(1,Math.round(r.height*d));};const ro=new ResizeObserver(resize);ro.observe(canvas);resize();
 const move=e=>{const r=canvas.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width;pointer.y=1-(e.clientY-r.top)/r.height;pointer.active=pointer.x>=0&&pointer.x<=1&&pointer.y>=0&&pointer.y<=1?1:0;};const click=()=>{if(pointer.active&&clickWarp&&!reduce)warp=1;};window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerdown',click,{passive:true});const io=new IntersectionObserver(es=>{visible=es[0].isIntersecting;});io.observe(canvas);
 const frame=now=>{const dt=last?Math.min((now-last)/1000,.05):0;last=now;if(visible&&!document.hidden){if(!reduce)t+=dt*speed*(direction==="backward"?-1:1)*(1+warp*8);warp*=Math.exp(-dt*2);gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(u.resolution,canvas.width,canvas.height);gl.uniform2f(u.mouse,pointer.x,pointer.y);gl.uniform1f(u.time,t);gl.uniform1f(u.active,reduce||!mouseInteraction||!mouseRepulsion?0:pointer.active);gl.uniform1f(u.boost,warp);gl.drawArrays(gl.TRIANGLES,0,3);}raf=requestAnimationFrame(frame);};raf=requestAnimationFrame(frame);
 return()=>{cancelAnimationFrame(raf);ro.disconnect();io.disconnect();window.removeEventListener('pointermove',move);window.removeEventListener('pointerdown',click);gl.deleteBuffer(buffer);shaders.forEach(s=>gl.deleteShader(s));gl.deleteProgram(program);};
 },[density,glowIntensity,flareIntensity,starSpeed]);
 return <div className="galaxy-background" aria-hidden="true"><canvas ref={ref}/></div>;
}
