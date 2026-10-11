import * as THREE from '../vendor/three.module.js';
// Original, seeded procedural materials; no remote assets or tracking.
function hash(x,y,s){ const v=Math.sin(x*127.1+y*311.7+s*17.4)*43758.5453; return v-Math.floor(v); }
function noise(x,y,s){ const a=Math.floor(x),b=Math.floor(y),u=x-a,v=y-b,tx=u*u*(3-2*u),ty=v*v*(3-2*v); return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(a,b,s),hash(a+1,b,s),tx),THREE.MathUtils.lerp(hash(a,b+1,s),hash(a+1,b+1,s),tx),ty); }
function texture(color,seed,star=false,gas=false){
 const c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d'),image=ctx.createImageData(c.width,c.height),base=new THREE.Color(color);
 for(let y=0;y<256;y++)for(let x=0;x<512;x++){
  const u=x/512,v=y/256;let n=0,amplitude=.55;
  for(let i=0;i<5;i++){n+=noise(u*12*2**i,v*8*2**i,seed+i)*amplitude;amplitude*=.5;}
  let r,g,b;
  if(star){const grain=hash(x,y,seed);r=1;g=.4+n*.45+grain*.1;b=.08+n*.21;}
  else if(seed===1){const land=n>.53;const clouds=Math.max(0,(noise(u*25,v*18,23)-.61)*2.6); const polar=Math.max(0,(Math.abs(v-.5)-.39)*6);r=(land?.22:.045)+clouds*.6+polar;g=(land?.36:.16)+clouds*.6+polar;b=(land?.26:.36)+clouds*.5+polar;}
  else {const bands=gas ? Math.sin(v*85+noise(u*10,v*9,seed)*2)*.13:0;const factor=.36+n*.94+bands;r=base.r*factor;g=base.g*factor;b=base.b*factor;}
  const idx=(y*512+x)*4;image.data[idx]=Math.min(255,r*255);image.data[idx+1]=Math.min(255,g*255);image.data[idx+2]=Math.min(255,b*255);image.data[idx+3]=255;
 }
 ctx.putImageData(image,0,0);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function glowTexture(){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');const g=ctx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,227,161,1)');g.addColorStop(.18,'rgba(255,166,73,.65)');g.addColorStop(.4,'rgba(245,111,39,.18)');g.addColorStop(1,'rgba(255,90,15,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);}
function labelSprite(label){const c=document.createElement('canvas');c.width=512;c.height=64;const ctx=c.getContext('2d');ctx.font='22px monospace';ctx.fillStyle='#a8bbd6';ctx.textAlign='center';ctx.fillText(label.toUpperCase(),256,39);const t=new THREE.CanvasTexture(c);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false,opacity:.85}));sprite.scale.set(3.9,.49,1);return sprite;}
export function createUniverse(container,{planets,isPaused,onSelect,interactive=false,tooltip}){
 const mobile=innerWidth<650; const renderer=new THREE.WebGLRenderer({antialias:!mobile,alpha:true,powerPreference:'low-power'}); renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.25:1.65)); renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.55;container.prepend(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(39,1,.1,170);camera.position.set(0,25,30);camera.lookAt(0,0,0);
 scene.add(new THREE.AmbientLight('#728eb7',1.4));const sunLight=new THREE.PointLight('#ffe4bd',115,90,1.2);scene.add(sunLight);
 const star=new THREE.Mesh(new THREE.SphereGeometry(1.62,48,32),new THREE.MeshBasicMaterial({map:texture('#f4c184',99,true)}));scene.add(star);
 const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture(),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));glow.scale.set(10,10,1);scene.add(glow);
 const positions=[],colors=[];for(let i=0;i<(mobile?450:1000);i++){let theta=hash(i,10,0)*Math.PI*2,phi=Math.acos(2*hash(i,20,0)-1),r=65+hash(i,30,0)*20;positions.push(r*Math.sin(phi)*Math.cos(theta),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(theta));const c=.2+hash(i,50,0)*.6;colors.push(c*.8,c*.88,c);}
 const points=new THREE.BufferGeometry();points.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));points.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));scene.add(new THREE.Points(points,new THREE.PointsMaterial({size:.07,vertexColors:true,transparent:true,opacity:.75,sizeAttenuation:true})));
 const meshes=[],worlds=[];let selected=null,hover=null,time=0,visible=true,disposed=false,raf;
 planets.forEach((p,i)=>{
 const path=[];for(let k=0;k<=160;k++){const a=k/160*Math.PI*2;path.push(new THREE.Vector3(Math.cos(a)*p.radius,0,Math.sin(a)*p.radius));}
 scene.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(path),new THREE.LineBasicMaterial({color:'#6285b4',transparent:true,opacity:.14})));
 const pivot=new THREE.Group();scene.add(pivot); const mat=new THREE.MeshStandardMaterial({map:texture(p.color,i+1,false,!!p.ring),roughness:.87,metalness:.05}); const mesh=new THREE.Mesh(new THREE.SphereGeometry(p.size,mobile?32:48,mobile?20:32),mat);mesh.userData.planet=p;mesh.rotation.z=.1+i*.07;pivot.add(mesh);meshes.push(mesh);
 const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(p.size*1.04,32,24),new THREE.ShaderMaterial({uniforms:{glowColor:{value:new THREE.Color(p.color)}},vertexShader:'varying vec3 vNormal; varying vec3 vPosition; void main(){vec4 p=modelViewMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vPosition=p.xyz;gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec3 vNormal;varying vec3 vPosition;uniform vec3 glowColor;void main(){float rim=pow(1.-abs(dot(normalize(vNormal),normalize(-vPosition))),3.);gl_FragColor=vec4(glowColor,rim*.45);}',transparent:true,depthWrite:false,side:THREE.FrontSide}));pivot.add(atmosphere);
 const halo=new THREE.Mesh(new THREE.RingGeometry(p.size*1.3,p.size*1.36,64),new THREE.MeshBasicMaterial({color:'#8abaff',transparent:true,opacity:.9,side:THREE.DoubleSide,depthWrite:false}));halo.visible=false;pivot.add(halo);
 if(p.ring){const ring=new THREE.Mesh(new THREE.RingGeometry(p.size*1.5,p.size*2.3,90),new THREE.MeshStandardMaterial({color:'#bca989',transparent:true,opacity:.55,side:THREE.DoubleSide,roughness:1}));ring.rotation.x=Math.PI/2-.25;pivot.add(ring);const line=new THREE.Mesh(new THREE.RingGeometry(p.size*1.8,p.size*1.84,90),new THREE.MeshBasicMaterial({color:'#252a36',side:THREE.DoubleSide}));line.rotation.copy(ring.rotation);pivot.add(line);}
 let label;if(interactive){label=labelSprite(`${String(i+1).padStart(2,'0')} · ${p.name}`);label.position.y=p.size+1.05;pivot.add(label);}
 worlds.push({pivot,mesh,halo,p,phase:[.55,2.4,4.4,3.4,5.9,1.3][i%6],label});
 });
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let lastPointer=null;
 function pick(e){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);scene.updateMatrixWorld();raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(meshes,false)[0]?.object.userData.planet || null;}
 function pointerMove(e){lastPointer=e;hover=pick(e)?.id||null;renderer.domElement.style.cursor=hover?'pointer':'default';if(tooltip){const p=planets.find(p=>p.id===hover);tooltip.hidden=!p;if(p){tooltip.replaceChildren();const strong=document.createElement('strong');strong.textContent=p.name;const small=document.createElement('small');small.textContent=p.note;tooltip.append(strong,small);const r=container.getBoundingClientRect();tooltip.style.left=`${Math.max(12,Math.min(e.clientX-r.left+16,r.width-250))}px`;tooltip.style.top=`${Math.max(55,e.clientY-r.top-64)}px`;}}}
 function leave(){lastPointer=null;hover=null;if(tooltip)tooltip.hidden=true;}
 function click(e){const p=pick(e);if(p)onSelect(p);}
 if(interactive){renderer.domElement.addEventListener('pointermove',pointerMove);renderer.domElement.addEventListener('pointerleave',leave);renderer.domElement.addEventListener('click',click);}
 function resize(){const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;const distance=interactive?(w/h<1?57:38):(w/h<1?47:37);camera.position.set(interactive?0:2,distance*.64,distance*.77);camera.lookAt(interactive?0:2,0,0);camera.updateProjectionMatrix();}
 const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(container);resize();
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();},{rootMargin:'80px'});observer.observe(container);
 let previous=0;
 function animate(now){raf=null;if(disposed||!visible||document.hidden)return;const dt=Math.min((now-previous)/1000,.05);previous=now;if(!isPaused())time+=dt;
 for(const w of worlds){const a=w.phase+time*w.p.speed;w.pivot.position.set(Math.cos(a)*w.p.radius,0,Math.sin(a)*w.p.radius);w.mesh.rotation.y=time*.045;w.halo.visible=w.p.id===selected||w.p.id===hover;w.halo.quaternion.copy(camera.quaternion);}
 star.rotation.y=time*.013;renderer.render(scene,camera);raf=requestAnimationFrame(animate);
 }
 function start(){if(!raf&&!disposed&&!document.hidden){previous=performance.now();raf=requestAnimationFrame(animate);}}
 function visibility(){if(!document.hidden&&visible)start();}
 document.addEventListener('visibilitychange',visibility);start();
 function lost(e){e.preventDefault();if(tooltip)tooltip.hidden=true;const fallback=document.querySelector('#fallback');if(interactive){fallback.textContent='The 3D view was interrupted. Use the section index to continue exploring.';fallback.hidden=false;}}
 function restored(){if(interactive)document.querySelector('#fallback').hidden=true;start();}
 renderer.domElement.addEventListener('webglcontextlost',lost);renderer.domElement.addEventListener('webglcontextrestored',restored);
 return {select(id){selected=id;},dispose(){disposed=true;cancelAnimationFrame(raf);resizeObserver.disconnect();observer.disconnect();document.removeEventListener('visibilitychange',visibility);renderer.domElement.removeEventListener('pointermove',pointerMove);renderer.domElement.removeEventListener('pointerleave',leave);renderer.domElement.removeEventListener('click',click);renderer.domElement.removeEventListener('webglcontextlost',lost);renderer.domElement.removeEventListener('webglcontextrestored',restored);scene.traverse(o=>{o.geometry?.dispose();if(o.material){const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>{m.map?.dispose();m.dispose();});}});renderer.dispose();renderer.domElement.remove();}};
}
