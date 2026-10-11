const config = window.BHUMIX;
const $ = s => document.querySelector(s);
const safeURL = (value, email = false) => { try { const u = new URL(value, location.href); return ['https:', 'http:', ...(email ? ['mailto:'] : [])].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
const text = (tag, value, cls) => { const el = document.createElement(tag); el.textContent = value; if (cls) el.className = cls; return el; };
$('#about-copy').textContent = config.about;
$('.student small').textContent = config.profile.education || 'Student · Builder · Explorer';
const fields = $('#profile-fields');
if (config.profile.name) fields.append(text('p', config.profile.name));
if (config.profile.image && safeURL(config.profile.image)) { const img = document.createElement('img'); img.src = safeURL(config.profile.image); img.alt = config.profile.name || 'Portfolio owner'; fields.append(img); }
if (config.profile.goals?.length) fields.append(text('p', `Current learning goals: ${config.profile.goals.join(' · ')}`));
if (config.siteUrl && safeURL(config.siteUrl)) { const canonical = document.createElement('link'); canonical.rel = 'canonical'; canonical.href = safeURL(config.siteUrl); document.head.append(canonical); }
const dialog = $('#planet-dialog');
let selectionCallback = () => {};
function selectPlanet(planet) {
  selectionCallback(planet.id);
  document.querySelectorAll('#planet-index button').forEach(b => { b.classList.toggle('selected', b.dataset.id === planet.id); b.setAttribute('aria-pressed', String(b.dataset.id === planet.id)); });
  $('#dialog-number').textContent = `WORLD ${String(config.planets.indexOf(planet) + 1).padStart(2, '0')} / BHUMIX CORE`;
  $('#dialog-title').textContent = planet.name; $('#dialog-note').textContent = planet.note;
  $('#dialog-link').href = `#${planet.id}`; if (!dialog.open) dialog.showModal();
}
config.planets.forEach((p, i) => { const b = document.createElement('button'); b.dataset.id = p.id; b.setAttribute('aria-pressed', 'false'); b.append(text('small', `WORLD ${String(i + 1).padStart(2, '0')}`)); const dot = text('span', '', 'planet-dot'); dot.style.color = p.color; dot.style.background = p.color; const title = text('strong', p.name); b.append(dot, title); b.addEventListener('click', () => selectPlanet(p)); $('#planet-index').append(b); });
$('.close').onclick = () => dialog.close(); $('#dialog-link').onclick = () => dialog.close();
dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
$('#menu').onclick = () => { const open = $('nav').classList.toggle('open'); $('#menu').setAttribute('aria-expanded', String(open)); };
document.querySelectorAll('nav a').forEach(a => a.onclick = () => { $('nav').classList.remove('open'); $('#menu').setAttribute('aria-expanded', 'false'); });
const navLinks = [...document.querySelectorAll('nav a')];
const sectionObserver = new IntersectionObserver(entries => { entries.forEach(e => { if (e.isIntersecting) { const id = ['security', 'code', 'ai'].includes(e.target.id) ? 'universe' : e.target.id; navLinks.forEach(a => { const active = a.hash === `#${id}`; a.classList.toggle('active', active); if (active) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); }); } }); }, { rootMargin: '-20% 0px -50% 0px' });
document.querySelectorAll('main>section').forEach(s => sectionObserver.observe(s));
const categories = ['All work', 'Cybersecurity', 'Web development', 'Software engineering', 'Artificial intelligence', 'Experiments'];
let filter = categories[0];
function projectCard(p) {
 const card = text('article', '', 'project-card');
 if (p.image && safeURL(p.image)) { const img = document.createElement('img'); img.src = safeURL(p.image); img.alt = `${p.title} preview`; img.loading = 'lazy'; card.append(img); }
 card.append(text('small', `${p.category || 'Experiment'} / ${p.status || 'In Progress'}`), text('h3', p.title), text('p', p.description));
 if (p.technologies?.length) card.append(text('p', p.technologies.join(' · ')));
 [['problem','Problem'],['objective','Objective'],['implementation','Implementation'],['lessons','What I learned']].forEach(([key,label]) => { if (p[key]) card.append(text('p', `${label}: ${p[key]}`)); });
 [['repo','Repository ↗'],['demo','Live demo ↗']].forEach(([key,label]) => { const url = safeURL(p[key] || ''); if (p[key] && url) { const a = text('a', label); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; card.append(a); } }); return card;
}
function renderProjects() {
 const grid = $('#project-grid'); grid.replaceChildren(); const projects = config.projects.filter(p => filter === 'All work' || p.category === filter);
 if (!projects.length) { const empty = text('div', '', 'empty-state'); empty.append(text('div', '◇', 'empty-icon'), text('h3', config.projects.length ? 'No work in this orbit yet.' : 'The next chapter is being built.'), text('p', 'No projects have been added to this collection yet. Real work, lessons learned, and repositories will live here as the journey develops.'), text('small', 'NO INVENTED PROJECTS. JUST ROOM TO GROW.')); grid.append(empty); }
 else projects.forEach(p => grid.append(projectCard(p)));
 document.querySelectorAll('#filters button').forEach(b => { const active = b.textContent === filter; b.classList.toggle('active',active); b.setAttribute('aria-pressed', String(active)); });
}
categories.forEach(category => { const button = text('button',category); button.onclick = () => { filter = category; renderProjects(); }; $('#filters').append(button); }); renderProjects();
document.querySelectorAll('.related').forEach(el => { const n = config.projects.filter(p => p.category === el.dataset.category).length; el.append(text('p', n ? `${n} real project${n > 1 ? 's' : ''} in this area.` : 'No published projects in this area yet.')); const a = text('a', 'Visit the project archive →'); a.href='#projects'; a.onclick=()=>{ filter=el.dataset.category; renderProjects(); }; el.append(a); });
const links = [...(config.profile.links || [])]; if (config.profile.email) links.unshift({ label: 'Email ↗', url: `mailto:${config.profile.email}` });
let contactCount = 0; links.forEach(l => { const url = safeURL(l.url, true); if (!url) return; const a = text('a', l.label, 'button secondary'); a.href=url; if (!url.startsWith('mailto:')) { a.target='_blank'; a.rel='noopener noreferrer'; } $('#contact-links').append(a); contactCount++; }); $('#contact-empty').hidden = contactCount > 0;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let paused = reduced.matches;
function updateMotion(){ $('#motion').textContent = paused ? '▶ Resume motion' : 'Ⅱ Pause motion'; $('#motion').setAttribute('aria-pressed',String(paused)); }
updateMotion(); $('#motion').onclick=()=>{ paused=!paused; updateMotion(); };
reduced.addEventListener('change', e => { paused=e.matches; updateMotion(); });
// Lazy-load the renderer. The entire readable portfolio works without WebGL.
async function bootScene(){
 try { const { createUniverse } = await import('./universe.js');
 const options={planets:config.planets,isPaused:()=>paused,onSelect:selectPlanet};
 const universe=createUniverse($('#scene'), {...options, interactive:true,tooltip:$('#tooltip')});
 const hero=createUniverse($('.hero-map'), {...options,interactive:false});
 selectionCallback=id=>universe.select(id); $('#reset').onclick=()=>{ universe.select(null); document.querySelectorAll('#planet-index button').forEach(b=>{b.classList.remove('selected');b.setAttribute('aria-pressed','false');}); };
 window.addEventListener('pagehide',()=>{ universe.dispose(); hero.dispose(); },{once:true});
 } catch(error){ $('#fallback').hidden=false; $('#motion').disabled=true; $('#reset').disabled=true; $('.hero-map').classList.add('static-universe'); console.info('3D unavailable; accessible portfolio remains available.', error.message); }
}
if ('requestIdleCallback' in window) requestIdleCallback(bootScene,{timeout:1200}); else setTimeout(bootScene,80);
