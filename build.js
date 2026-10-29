// Static site builder: reads /content, writes /dist. No framework.
// Run: npm run build  (Vercel runs this automatically)
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');
const C = (...p) => path.join(ROOT, 'content', ...p);

marked.setOptions({ gfm: true, breaks: false });
// keep '~' as a range sign (e.g. 3~4, 11~12월) instead of strikethrough
marked.use({ tokenizer: { del() { return undefined; } } });

// ---------- helpers ----------
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const thumbFor = (id) => fs.existsSync(path.join(__dirname, 'static', 'uploads', 'thumbs', id + '.webp')) ? `/uploads/thumbs/${id}.webp` : '';
// lines like [[youtube:ID|caption|v]]; consecutive lines become one row
function ytBlocks(src) {
  return String(src ?? '').replace(/(?:^\[\[youtube:[\w-]+\|[^|\]]*\|v?\]\][ \t]*(?:\n|$))+/gm, (block) => {
    const cards = block.trim().split('\n').map((l) => {
      const m = l.trim().match(/^\[\[youtube:([\w-]+)\|([^|\]]*)\|(v?)\]\]$/);
      if (!m) return '';
      const [, id, cap, v] = m;
      const url = v ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`;
      const th = thumbFor(id);
      return `<a class="vid${v ? ' short' : ''}" href="${url}" target="_blank" rel="noopener"><span class="thumb" aria-hidden="true">${th ? `<img src="${th}" alt="" loading="lazy">` : ''}</span><span class="cap">${esc(cap)}</span><span class="src">${v ? 'YouTube Shorts' : 'YouTube에서 보기'} ↗</span></a>`;
    }).join('');
    return `\n<div class="vids">${cards}</div>\n\n`;
  });
}
const md = (s) => marked.parse(ytBlocks(s));
const mdi = (s) => marked.parseInline(String(s ?? ''));
const list = (x) => (Array.isArray(x) ? x : []);
const slugOf = (file) => path.basename(file, '.md');

function readFolder(dir) {
  const d = C(dir);
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const { data, content } = matter(fs.readFileSync(path.join(d, f), 'utf8'));
      return { ...data, slug: slugOf(f), body: content.trim() };
    });
}

function copyDir(src, dst) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), t = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, t); else fs.copyFileSync(s, t);
  }
}

function write(rel, html) {
  const f = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, html);
}

const fmtDate = (d) => {
  if (!d) return '';
  const x = new Date(d);
  if (isNaN(x)) return esc(d);
  return `${x.getFullYear()}.${String(x.getMonth() + 1).padStart(2, '0')}.${String(x.getDate()).padStart(2, '0')}`;
};

// ---------- data ----------
const site = JSON.parse(fs.readFileSync(C('site.json'), 'utf8'));
const cases = readFolder('cases').sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
const processes = Object.fromEntries(readFolder('process').map((p) => [p.case, p]));
const stories = readFolder('stories').sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
const posts = readFolder('posts')
  .filter((p) => !p.draft)
  .sort((a, b) => new Date(b.date) - new Date(a.date));

// ---------- shell ----------
function shell({ title, desc, body, home, navItems, brand, brandHref }) {
  const h = home ? '' : '/';
  const nav = navItems || [
    ['경력', `${h}#career`], ['이야기', `${h}#journey`], ['성장 모델', `${h}#model`], ['실험 원칙', `${h}#method`],
    ['케이스', `${h}#cases`], ['AI·자동화', `${h}#automation`], ['영상 포폴', '/video/'], ['연락처', `${h}#contact`],
  ];
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800&display=swap">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
<link rel="stylesheet" href="/assets/site.css">
</head>
<body>
<nav class="nav" aria-label="섹션">
  <div class="wrap">
    <a class="brand" href="${brandHref || '/'}"><strong>${esc(brand || site.name + ' · Growth Marketer')}</strong></a>
    <ul>${nav.map(([t, u]) => `<li><a href="${u}">${t}</a></li>`).join('')}</ul>
  </div>
</nav>
${body}
<script src="/assets/site.js" defer></script>
</body>
</html>
`;
}

// ---------- components ----------
const sectionHead = (s) => `<div class="eyebrow">${esc(s.eyebrow)}</div>\n    <h2>${esc(s.title)}</h2>${s.lede ? `\n    <p class="lede">${esc(s.lede)}</p>` : ''}`;

function videoCard(v) {
  const short = v.vertical ? ' short' : '';
  if (v.type === 'mp4' && v.file) {
    return `<div class="vid mp4${short}"><span class="thumb"><video src="${esc(v.file)}" controls controlslist="nodownload" playsinline preload="metadata"${v.thumbnail ? ` poster="${esc(v.thumbnail)}"` : ''}></video></span><span class="cap">${esc(v.caption)}</span></div>`;
  }
  if (!v.url) return '';
  return `<a class="vid${short}" href="${esc(v.url)}" target="_blank" rel="noopener"><span class="thumb" aria-hidden="true">${v.thumbnail ? `<img src="${esc(v.thumbnail)}" alt="" loading="lazy">` : ''}</span><span class="cap">${esc(v.caption)}</span><span class="src">${v.vertical ? 'YouTube Shorts' : 'YouTube에서 보기'} ↗</span></a>`;
}

function shotCard(im) {
  const inner = `<span class="im"><img src="${esc(im.image)}" alt="${esc(im.caption)}" loading="lazy"></span><span class="cap">${esc(im.caption)}${im.link ? ' ↗' : ''}</span>`;
  if (im.link) return `<a class="shot" href="${esc(im.link)}" target="_blank" rel="noopener">${inner}</a>`;
  return `<button class="shot" type="button" data-img="${esc(im.image)}" data-cap="${esc(im.caption)}">${inner}</button>`;
}

function mediaBlocks(c, wrap = true) {
  let out = '';
  const ims = list(c.images).filter((x) => x && x.image);
  const vids = list(c.videos).filter((x) => x && (x.url || x.file));
  const pr = processes[c.slug];
  if (pr) {
    out += `<div class="media"><span class="label">세부 작업 과정</span><button class="process-card" type="button" data-process="${esc(c.slug)}">
      ${pr.cover ? `<span class="pc-cover"><img src="${esc(pr.cover)}" alt="" loading="lazy"></span>` : ''}
      <span class="pc-body"><strong class="st">${esc(pr.title)}</strong><span class="pc-sub">문제 정의부터 실행, 성과까지 더 자세히 보기</span><span class="case-chip">전체 과정 읽기 <span aria-hidden="true">→</span></span></span>
    </button></div>`;
  } else if (ims.length) {
    const g = `<div class="shots">${ims.map(shotCard).join('')}</div>`;
    out += wrap ? `<div class="media"><span class="label">세부 작업 과정</span>${g}</div>` : g;
  }
  if (vids.length) {
    const g = `<div class="vids">${vids.map(videoCard).join('')}</div>`;
    out += wrap ? `<div class="media"><span class="label">소재 미리보기</span>${g}</div>` : g;
  }
  return out;
}

function caseFull(c) {
  const stages = list(c.stages);
  return `<article class="case" id="${esc(c.slug)}" data-stages="${esc(stages.join(' '))}">
  <header>
    <div class="meta">${c.label ? `<span class="mono">${esc(c.label)}</span>` : ''}<span>${esc(c.meta)}</span>${stages.map((s) => `<span class="tag">${esc(s.toUpperCase())}</span>`).join('')}</div>
    <h3>${esc(c.title)}</h3>
    ${c.question ? `<p class="q">${esc(c.question)}</p>` : ''}
  </header>
  <div class="body">${list(c.steps).map((s) => `<dl class="step"><dt>${esc(s.label)}</dt><dd>${md(s.body)}</dd></dl>`).join('')}</div>
  <div class="results"><span class="label">${esc(c.results_label || 'Results')}</span>${list(c.results).map((r) => `<div class="r"><span class="v"${r.small ? ' style="font-size:.8125rem;font-weight:500"' : ''}>${esc(r.value)}${r.delta ? `<span class="delta">${esc(r.delta)}</span>` : ''}</span><span class="t">${esc(r.text)}</span></div>`).join('')}</div>
  ${mediaBlocks(c)}
  ${c.body && c.details_summary ? `<details class="more"><summary>${esc(c.details_summary)}</summary><div class="inner">${md(c.body)}</div></details>` : ''}
</article>`;
}

function caseCompact(c) {
  return `<article id="${esc(c.slug)}">
  ${c.tag ? `<span class="tag" style="align-self:flex-start">${esc(c.tag)}</span>` : ''}
  <h4>${esc(c.title)}</h4>
  ${md(c.body)}
  ${mediaBlocks(c, false)}
</article>`;
}

function postCard(p) {
  return `<a class="post-card" href="/blog/${esc(p.slug)}/">
  ${p.cover ? `<span class="cover"><img src="${esc(p.cover)}" alt="" loading="lazy"></span>` : ''}
  <span class="pc-meta"><span class="date">${fmtDate(p.date)}</span><strong class="st">${esc(p.title)}</strong>${p.summary ? `<span class="sum">${esc(p.summary)}</span>` : ''}${list(p.tags).length ? `<span class="tags">${list(p.tags).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</span>` : ''}</span>
</a>`;
}


// "→ Case 01 · 03 · 05 · note" -> pill buttons per case + small note
function linkCases(text) {
  const bySlug = {};
  for (const c of cases) { const m = String(c.label || '').match(/(\d{2})/); if (m) bySlug[m[1]] = c.slug; }
  const t = String(text || '').replace(/^→\s*/, '');
  const m = t.match(/^Case ((?:\d{2})(?: · \d{2})*)(?: · (.*))?$/);
  if (!m) return `<span class="proof-note">${esc(t)}</span>`;
  const chips = m[1].split(' · ').map((n) => bySlug[n]
    ? `<a class="case-chip" href="#${esc(bySlug[n])}">Case ${n} 보기 <span aria-hidden="true">→</span></a>`
    : `<span class="case-chip off">Case ${n}</span>`).join('');
  return `<span class="chips">${chips}</span>${m[2] ? `<span class="proof-note">${esc(m[2])}</span>` : ''}`;
}

// ---------- home ----------
function home() {
  const hero = site.hero;
  const stagesUsed = ['acquisition', 'activation', 'retention', 'revenue', 'data'];
  const full = cases.filter((c) => !c.compact);
  const compact = cases.filter((c) => c.compact);

  const body = `
<header class="hero">
  <div class="wrap">
    <div class="who"><b>${esc(site.name)}</b><span>${esc(site.role)}</span>${site.phone ? `<span class="tel">${esc(site.phone)}</span>` : ''}${site.email ? `<span class="tel">${esc(site.email)}</span>` : ''}</div>
    <h1>${esc(hero.line1)}<br><em>${esc(hero.emphasis)}</em>${esc(hero.line2_rest)}</h1>
    <p class="lede">${esc(hero.lede)}</p>
    <div class="stats" role="list">${list(hero.stats).map((s) => (s.link ? `<a class="stat stat-link" role="listitem" href="${esc(s.link)}">` : `<div class="stat" role="listitem">`) + `<span class="k mono">${esc(s.value)}</span><span class="d">${esc(s.desc)}</span>${s.link ? `<span class="src src-link"><span>${esc(s.source)}</span><span class="case-chip">${esc(s.link_label || '케이스')} 보기 <span aria-hidden="true">→</span></span></span></a>` : `<span class="src">${esc(s.source)}</span></div>`}`).join('')}</div>
  </div>
</header>

<section id="career">
  <div class="wrap">
    ${sectionHead(site.career)}
    <div class="tl">
      ${list(site.career.jobs).map((j) => `<div class="job"><div class="when">${esc(j.when)}</div><div><h3>${esc(j.company)}<small>${esc(j.role)}</small></h3>${list(j.items).length ? `<ul>${list(j.items).map((i) => `<li>${mdi(i)}</li>`).join('')}</ul>` : ''}</div></div>`).join('\n      ')}
      ${list(site.career.education).length ? `<div class="tl-sub">Education</div>` : ''}
      ${list(site.career.education).map((e) => `<div class="job"><div class="when">${esc(e.when)}</div><div><h3>${esc(e.school)}<small>${esc(e.detail)}</small></h3>${list(e.items).length ? `<ul>${list(e.items).map((i) => `<li>${mdi(i)}</li>`).join('')}</ul>` : ''}</div></div>`).join('\n      ')}
    </div>
  </div>
</section>

<section id="journey">
  <div class="wrap">
    ${sectionHead(site.journey)}
    <div class="journey">
      ${stories.map((s) => `<button class="story" type="button" data-story="${esc(s.slug)}">
        <span class="cover">${s.cover ? `<img src="${esc(s.cover)}" alt="" loading="lazy">` : ''}</span>
        <span class="meta"><strong class="st">${esc(s.title)}</strong>${s.period ? `<span class="period">${esc(s.period)}</span>` : ''}${s.related ? `<span class="rel">${esc(s.related)}</span>` : ''}<span class="more-l">이야기 읽기 →</span></span>
      </button>`).join('\n      ')}
    </div>
  </div>
</section>
${Object.values(processes).map((p) => `<template id="process-${esc(p.case)}">
  <h2>${esc(p.title)}</h2>
  <div class="doc-props">${list(p.tags).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}${p.position ? `<span class="prop"><b>포지션</b> ${esc(p.position)}</span>` : ''}${p.contribution ? `<span class="prop"><b>기여도</b> ${esc(p.contribution)}%</span>` : ''}</div>
  ${md(p.body)}
</template>`).join('\n')}
${stories.map((s) => `<template id="story-${esc(s.slug)}">
  <h2>${esc(s.title)}</h2>${s.period ? `<span class="period">${esc(s.period)}</span>` : ''}
  ${s.cover ? `<figure><img src="${esc(s.cover)}" alt=""></figure>` : ''}
  ${md(s.body)}
</template>`).join('\n')}

<dialog class="reader" id="reader" aria-label="읽기">
  <div class="bar"><span id="reader-title">이야기</span><button class="close" type="button" id="reader-close">닫기</button></div>
  <div class="content" id="reader-content"></div>
</dialog>

<section id="model">
  <div class="wrap">
    ${sectionHead(site.model)}
    <div class="model">
      ${list(site.model.models).map((m) => `<div class="formula">
        <h3>${esc(m.title)} <span>${esc(m.sub)}</span></h3>
        <div class="eq" aria-label="${esc(m.title)} 성장 모델">
          <div class="term out"><span class="name">${esc(m.output_name)}</span><span class="lever">${esc(m.output_lever)}</span></div>
          <span class="op">=</span>
          ${list(m.terms).map((t) => `<div class="term${t.moved ? ' moved' : ''}"><span class="name">${esc(t.name)}</span><span class="lever">${esc(t.lever)}</span></div>`).join('\n          <span class="op">×</span>\n          ')}
        </div>
        <p class="note"><b>${esc(m.note_title)}</b> ${esc(m.note)}</p>
      </div>`).join('\n      ')}
    </div>
  </div>
</section>

<section id="method">
  <div class="wrap">
    ${sectionHead(site.method)}
    <div class="principles">
      ${list(site.method.principles).map((p) => `<div class="principle"><h3>${esc(p.title)}</h3><p>${esc(p.body)}</p><div class="proof">${linkCases(p.proof)}</div></div>`).join('\n      ')}
    </div>
  </div>
</section>

<section id="cases">
  <div class="wrap">
    ${sectionHead(site.cases_section)}
    <div class="filters" role="group" aria-label="퍼널 단계 필터">
      <button class="chip" type="button" data-f="all" aria-pressed="true">전체</button>
      ${stagesUsed.filter((s) => full.some((c) => list(c.stages).includes(s))).map((s) => `<button class="chip" type="button" data-f="${s}" aria-pressed="false">${s[0].toUpperCase() + s.slice(1)}</button>`).join('\n      ')}
    </div>
    <div class="cases">
      ${full.map(caseFull).join('\n')}
    </div>
    ${compact.length ? `<div class="minor">${compact.map(caseCompact).join('\n')}</div>` : ''}
  </div>
</section>

<section id="automation">
  <div class="wrap">
    ${sectionHead(site.automation)}
    <div class="auto">
      ${list(site.automation.cards).map((a) => `<article><div class="pipe">${esc(a.pipe)}</div><h3>${esc(a.title)}</h3><p>${esc(a.body)}</p></article>`).join('\n      ')}
    </div>
  </div>
</section>

<section id="skills-sec">
  <div class="wrap">
    ${sectionHead(site.skills)}
    <div class="skills">
      ${list(site.skills.groups).map((g) => `<div><h3>${esc(g.name)}</h3><ul>${list(g.items).map((i) => `<li>${esc(i.text)}${i.level ? `<span class="lv">${esc(i.level)}</span>` : ''}</li>`).join('')}</ul></div>`).join('\n      ')}
    </div>
  </div>
</section>

${contactSection(site.role)}
`;
  return shell({ title: `${site.name} · Growth Marketer`, desc: site.seo_description, body, home: true });
}

// 메인·/video 공용 연락처 섹션
function contactSection(role) {
  return `<section id="contact" class="contact">
  <div class="wrap">
    <div class="eyebrow">Contact</div>
    <div class="box">
      <div class="who2"><strong>${esc(site.name)}</strong><span class="hint">${esc(role)}</span></div>
      <div class="lines">
        ${site.phone ? `<div class="row"><span class="k">Phone</span><span class="num" id="tel-num">${esc(site.phone)}</span><button class="copy" type="button" data-target="tel-num" data-label="번호 복사">번호 복사</button></div>` : ''}
        ${site.email ? `<div class="row"><span class="k">Email</span><span class="num mail" id="mail-addr">${esc(site.email)}</span><button class="copy" type="button" data-target="mail-addr" data-label="이메일 복사">이메일 복사</button></div>` : ''}
      </div>
    </div>
  </div>
</section>`;
}


// ---------- video portfolio page (/video/) ----------
function videoPage() {
  const v = JSON.parse(fs.readFileSync(C('video.json'), 'utf8'));
  const ytUrl = (id, vert) => vert ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`;
  const byId = Object.fromEntries(list(v.work.items).map((w) => [w.id, w]));
  const reel = list(v.hero.reel).map((id) => {
    const w = byId[id] || { id, vertical: true, title: '' };
    const th = thumbFor(id);
    return `<a class="reel-item" href="${ytUrl(id, w.vertical)}" target="_blank" rel="noopener" aria-label="${esc(w.title)} 영상 보기">${th ? `<img src="${th}" alt="" loading="lazy">` : ''}<span class="play" aria-hidden="true"></span></a>`;
  }).join('');
  const work = list(v.work.items).map((w) => {
    const th = thumbFor(w.id);
    return `<a class="work${w.vertical ? ' short' : ''}" data-stages="${esc(list(w.tags).join(' '))}" href="${ytUrl(w.id, w.vertical)}" target="_blank" rel="noopener">
      <span class="thumb" aria-hidden="true">${th ? `<img src="${th}" alt="" loading="lazy">` : ''}</span>
      <span class="w-body"><span class="w-brand">${esc(w.brand)}</span><strong class="w-title">${esc(w.title)}</strong><span class="w-brief">${esc(w.brief)}</span><span class="w-result">${esc(w.result)}</span></span>
    </a>`;
  }).join('\n');
  const usedProc = list(v.cases.items).map((c) => processes[c.process]).filter(Boolean);
  const cases = list(v.cases.items).map((c) => {
    const pr = processes[c.process];
    return `<article class="vcase" id="${esc(c.anchor)}">
      <div class="vc-head"><span class="w-brand">${esc(c.brand)}</span><h3>${esc(c.title)}</h3></div>
      <ol class="vc-steps">${list(c.steps).map((s) => `<li><span class="lb">${esc(s.label)}</span><span>${esc(s.body)}</span></li>`).join('')}</ol>
      <div class="vc-foot"><div class="vc-results">${list(c.results).map((r) => `<div class="r"><span class="v">${esc(r.value)}</span><span class="t">${esc(r.text)}</span></div>`).join('')}</div>
      ${pr ? `<button class="case-chip process-open" type="button" data-process="${esc(c.process)}" data-title="${esc(pr.title)}">세부 작업 과정 보기 <span aria-hidden="true">→</span></button>` : ''}</div>
    </article>`;
  }).join('\n');
  const body = `
<header class="hero vhero">
  <div class="wrap">
    <div class="eyebrow">${esc(v.hero.eyebrow)}</div>
    <h1>${esc(v.hero.line1)}<br><em>${esc(v.hero.emphasis)}</em>${esc(v.hero.line2_rest)}</h1>
    <p class="lede">${esc(v.hero.lede)}</p>
    <p class="hero-cta"><a class="btn-dark" href="#contact">${esc(v.hero.cta)} →</a><a class="btn-line" href="#work">작업 보기</a></p>
    <div class="reel">${reel}</div>
    <div class="stats vstats" role="list">${list(v.hero.stats).map((s) => `<a class="stat stat-link" role="listitem" href="${esc(s.link)}"><span class="k mono">${esc(s.value)}</span><span class="d">${esc(s.desc)}</span><span class="src src-link"><span>${esc(s.source)}</span><span class="case-chip">${esc(s.link_label)} 보기 <span aria-hidden="true">→</span></span></span></a>`).join('')}</div>
  </div>
</header>

<section id="work"><div class="wrap">
  ${sectionHead(v.work)}
  <div class="filters" role="group" aria-label="작업 유형 필터">
    <button class="chip" type="button" data-f="all" aria-pressed="true">전체</button>
    ${list(v.work.filters).map((f) => `<button class="chip" type="button" data-f="${esc(f.value)}" aria-pressed="false">${esc(f.label)}</button>`).join('')}
  </div>
  <div class="works">${work}</div>
</div></section>
${v.gallery && list(v.gallery.items).length ? `
<section id="gallery"><div class="wrap">
  ${sectionHead(v.gallery)}
  <div class="gallery">${list(v.gallery.items).map((g) => `<div class="g-item"><video src="${esc(g.file)}#t=0.1" controls controlslist="nodownload" playsinline preload="metadata"></video></div>`).join('')}</div>
</div></section>` : ''}

<section id="vcases"><div class="wrap">
  ${sectionHead(v.cases)}
  <div class="vcases">${cases}</div>
</div></section>
${usedProc.map((p) => `<template id="process-${esc(p.case)}">
  <h2>${esc(p.title)}</h2>
  <div class="doc-props">${list(p.tags).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}${p.position ? `<span class="prop"><b>포지션</b> ${esc(p.position)}</span>` : ''}${p.contribution ? `<span class="prop"><b>기여도</b> ${esc(p.contribution)}%</span>` : ''}</div>
  ${md(p.body)}
</template>`).join('\n')}
<dialog class="reader" id="reader" aria-label="읽기">
  <div class="bar"><span id="reader-title">세부 작업 과정</span><button class="close" type="button" id="reader-close">닫기</button></div>
  <div class="content" id="reader-content"></div>
</dialog>

<section id="vprocess"><div class="wrap">
  ${sectionHead(v.process)}
  <ol class="vsteps">${list(v.process.steps).map((s, i) => `<li><span class="n">${String(i + 1).padStart(2, '0')}</span><h3>${esc(s.title)}</h3><p>${esc(s.body)}</p></li>`).join('')}</ol>
  ${v.process.guide_url ? `<p class="guide"><a class="case-chip" href="${esc(v.process.guide_url)}" target="_blank" rel="noopener">${esc(v.process.guide_label)} <span aria-hidden="true">↗</span></a></p>` : ''}
</div></section>

<section id="services"><div class="wrap">
  ${sectionHead(v.services)}
  <div class="services">${list(v.services.items).map((s) => `<article class="svc"><h3>${esc(s.title)}</h3><p>${esc(s.body)}</p><ul>${list(s.includes).map((i) => `<li>${esc(i)}</li>`).join('')}</ul></article>`).join('')}</div>
</div></section>

<section id="tools"><div class="wrap">
  <div class="tools-brands">
    <div>${sectionHead(v.tools)}<div class="tool-groups">${list(v.tools.groups).map((g) => `<div><h4>${esc(g.name)}</h4><p class="pills">${list(g.items).map((i) => `<span class="pill">${esc(i)}</span>`).join('')}</p></div>`).join('')}</div></div>
    <div>${sectionHead(v.brands)}<p class="pills brands">${list(v.brands.items).map((i) => `<span class="pill big">${esc(i)}</span>`).join('')}</p></div>
  </div>
</div></section>

${contactSection('Video Content Marketer')}
`;
  return shell({
    title: `${site.name} · 영상 콘텐츠 마케터`, desc: v.seo_description, body,
    brand: `${site.name} · Content Marketing`, brandHref: '/video/',
    navItems: [['작업', '#work'], ['케이스', '#vcases'], ['제작 방식', '#vprocess'], ['서비스', '#services'], ['연락처', '#contact'], ['그로스 포폴', '/']],
  });
}

// ---------- blog ----------
function blogIndex() {
  const body = `
<header class="hero blog-hero"><div class="wrap">${sectionHead(site.blog)}</div></header>
<section class="blog-list"><div class="wrap">
  ${posts.length ? `<div class="posts">${posts.map(postCard).join('')}</div>` : `<p class="empty">아직 공개된 글이 없어요.</p>`}
</div></section>`;
  return shell({ title: `${site.blog.title} · ${site.name}`, desc: site.blog.lede || site.seo_description, body });
}

function postPage(p) {
  const body = `
<article class="post"><div class="wrap narrow">
  <a class="back" href="/blog/">← ${esc(site.blog.title)}</a>
  <p class="date">${fmtDate(p.date)}</p>
  <h1>${esc(p.title)}</h1>
  ${list(p.tags).length ? `<p class="tags">${list(p.tags).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</p>` : ''}
  ${p.cover ? `<figure class="post-cover"><img src="${esc(p.cover)}" alt=""></figure>` : ''}
  <div class="prose">${md(p.body)}</div>
</div></article>`;
  return shell({ title: `${p.title} · ${site.name}`, desc: p.summary || site.seo_description, body });
}

// ---------- run ----------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
copyDir(path.join(ROOT, 'static'), OUT);
copyDir(path.join(ROOT, 'assets'), path.join(OUT, 'assets'));
copyDir(path.join(ROOT, 'admin'), path.join(OUT, 'admin'));
write('index.html', home());
write('blog/index.html', blogIndex());
if (fs.existsSync(C('video.json'))) write('video/index.html', videoPage());
for (const p of posts) write(`blog/${p.slug}/index.html`, postPage(p));
console.log(`built: ${cases.length} cases, ${stories.length} stories, ${posts.length} posts`);
