/* global CMS */
// 사이트 스타일을 미리보기에 적용
CMS.registerPreviewStyle('/assets/site.css');
CMS.registerPreviewStyle('.prose-preview{font-family:Pretendard,"Noto Sans KR",sans-serif;line-height:1.85} .cols{display:grid;gap:10px;align-items:start} .col{display:flex;flex-direction:column;gap:10px} .col img{width:100%;border-radius:10px} video{max-width:100%;border-radius:12px;background:#000}', { raw: true });

// ---------- 사진 나란히 (노션의 컬럼 배치) ----------
function rowHtml(data) {
  var cols = (data.columns || []).filter(function (c) { return c && (c.images || []).length; });
  if (!cols.length) return '';
  var tpl = cols.map(function (c) { return (Number(c.width) || 1) + 'fr'; }).join(' ');
  var inner = cols.map(function (c) {
    return '<div class="col">' + (c.images || []).map(function (src) {
      var s = typeof src === 'string' ? src : (src && src.image) || '';
      return s ? '<img src="' + s + '" alt="">' : '';
    }).join('') + '</div>';
  }).join('');
  return '<div class="cols" style="grid-template-columns:' + tpl + '">' + inner + '</div>';
}

CMS.registerEditorComponent({
  id: 'image-row',
  label: '사진 나란히',
  fields: [
    {
      name: 'columns', label: '칸', widget: 'list', summary: '칸 (비율 {{fields.width}})',
      fields: [
        { name: 'width', label: '너비 비율', widget: 'number', value_type: 'float', default: 1, hint: '예: 두 칸을 6:4로 하려면 6과 4' },
        { name: 'images', label: '사진 (위에서 아래로 쌓임)', widget: 'list', field: { name: 'image', label: '사진', widget: 'image' } }
      ]
    }
  ],
  pattern: /^<!--row-->([\s\S]*?)<!--\/row-->$/m,
  fromBlock: function (match) {
    var doc = new DOMParser().parseFromString(match[1], 'text/html');
    var wrap = doc.querySelector('.cols');
    var widths = ((wrap && wrap.style.gridTemplateColumns) || '').split(/\s+/).map(function (w) { return parseFloat(w) || 1; });
    var cols = [].map.call(doc.querySelectorAll('.col'), function (col, i) {
      return { width: widths[i] || 1, images: [].map.call(col.querySelectorAll('img'), function (im) { return im.getAttribute('src'); }) };
    });
    return { columns: cols };
  },
  toBlock: function (data) { return '<!--row-->' + rowHtml(data) + '<!--/row-->'; },
  toPreview: function (data) { return rowHtml(data); }
});

// ---------- 영상 (mp4) ----------
function videoHtml(d) {
  if (!d.file) return '';
  return '<video controls playsinline preload="metadata" src="' + d.file + '"' + (d.poster ? ' poster="' + d.poster + '"' : '') + '></video>';
}
CMS.registerEditorComponent({
  id: 'mp4',
  label: '영상 (mp4)',
  fields: [
    { name: 'file', label: 'mp4 파일', widget: 'file', hint: '50MB 이하 권장' },
    { name: 'poster', label: '표지 이미지 (선택)', widget: 'image', required: false }
  ],
  pattern: /^<video controls playsinline preload="metadata" src="([^"]*)"(?: poster="([^"]*)")?><\/video>$/m,
  fromBlock: function (m) { return { file: m[1], poster: m[2] || '' }; },
  toBlock: function (d) { return videoHtml(d); },
  toPreview: function (d) { return videoHtml(d); }
});
