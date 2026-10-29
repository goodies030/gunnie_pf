(function () {
  // case filters
  var chips = [].slice.call(document.querySelectorAll('.chip'));
  var cases = [].slice.call(document.querySelectorAll('.case, .work'));
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      var f = c.getAttribute('data-f');
      chips.forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
      cases.forEach(function (el) {
        el.hidden = !(f === 'all' || (el.getAttribute('data-stages') || '').split(' ').indexOf(f) > -1);
      });
    });
  });

  // reader dialog (stories + image lightbox)
  var dlg = document.getElementById('reader');
  if (dlg) {
    var box = document.getElementById('reader-content');
    var ttl = document.getElementById('reader-title');
    var open = function (title, nodes) {
      box.innerHTML = ''; box.appendChild(nodes); ttl.textContent = title;
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
      dlg.scrollTop = 0;
    };
    var close = function () { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); };
    document.getElementById('reader-close').addEventListener('click', close);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
    [].forEach.call(document.querySelectorAll('.story'), function (b) {
      b.addEventListener('click', function () {
        var t = document.getElementById('story-' + b.getAttribute('data-story'));
        if (t) open(b.querySelector('.st').textContent, t.content.cloneNode(true));
      });
    });
    [].forEach.call(document.querySelectorAll('.process-open'), function (b) {
      b.addEventListener('click', function () {
        var t = document.getElementById('process-' + b.getAttribute('data-process'));
        if (t) open(b.getAttribute('data-title') || '세부 작업 과정', t.content.cloneNode(true));
      });
    });
    [].forEach.call(document.querySelectorAll('.process-card'), function (b) {
      b.addEventListener('click', function () {
        var t = document.getElementById('process-' + b.getAttribute('data-process'));
        if (t) open(b.querySelector('.st').textContent, t.content.cloneNode(true));
      });
    });
    [].forEach.call(document.querySelectorAll('button.shot'), function (b) {
      b.addEventListener('click', function () {
        var f = document.createDocumentFragment();
        var fig = document.createElement('figure'); fig.className = 'full';
        var im = document.createElement('img'); im.src = b.getAttribute('data-img'); im.alt = b.getAttribute('data-cap');
        fig.appendChild(im); f.appendChild(fig);
        open(b.getAttribute('data-cap'), f);
      });
    });
  }

  // copy contact
  [].forEach.call(document.querySelectorAll('.contact .copy'), function (cb) {
    cb.addEventListener('click', function () {
      var n = document.getElementById(cb.getAttribute('data-target'));
      var lb = cb.getAttribute('data-label');
      var sel = function () {
        var r = document.createRange(); r.selectNodeContents(n);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        cb.textContent = '선택됨 · 복사하세요';
      };
      try {
        navigator.clipboard.writeText(n.textContent).then(function () {
          cb.textContent = '복사됨';
          setTimeout(function () { cb.textContent = lb; }, 1800);
        }, sel);
      } catch (e) { sel(); }
    });
  });
})();
// jumping to a case resets the funnel filter so the target is visible
document.addEventListener('click', function (e) {
  var a = e.target.closest && e.target.closest('a[href^="#"]');
  if (!a) return;
  var t = document.getElementById(a.getAttribute('href').slice(1));
  if (t && t.hidden) {
    var all = document.querySelector('.chip[data-f="all"]');
    if (all) all.click();
  }
});
// videos: hide the download menu item and block right-click save (incl. videos inside markdown)
function noDownload(root) {
  if (!root.querySelectorAll) return;
  var vs = root.tagName === 'VIDEO' ? [root] : root.querySelectorAll('video');
  Array.prototype.forEach.call(vs, function (v) {
    if (v.controlsList) v.controlsList.add('nodownload');
  });
}
noDownload(document);
new MutationObserver(function (ms) {
  ms.forEach(function (m) { m.addedNodes.forEach(noDownload); });
}).observe(document.body, { childList: true, subtree: true });
document.addEventListener('contextmenu', function (e) {
  if (e.target.closest && e.target.closest('video, .g-item, .vid')) e.preventDefault();
});
