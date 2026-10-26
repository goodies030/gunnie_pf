// GitHub 로그인 완료: 토큰을 받아 /admin 창으로 전달합니다.
function page(status, payload) {
  const msg = `authorization:github:${status}:${JSON.stringify(payload)}`;
  return `<!doctype html><html><body><script>
  (function () {
    function receive(e) {
      window.opener.postMessage(${JSON.stringify(msg)}, e.origin);
      window.removeEventListener('message', receive, false);
      setTimeout(function () { window.close(); }, 300);
    }
    window.addEventListener('message', receive, false);
    window.opener.postMessage('authorizing:github', '*');
  })();
  </script><p>로그인 처리 중… 창이 자동으로 닫히지 않으면 닫아주세요.</p></body></html>`;
}

module.exports = async (req, res) => {
  const { code, state } = req.query || {};
  const cookie = (req.headers.cookie || '').split(';').map((s) => s.trim()).find((s) => s.startsWith('decap_oauth_state='));
  const expected = cookie ? cookie.split('=')[1] : '';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Set-Cookie', 'decap_oauth_state=; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=0');

  if (!code || !state || state !== expected) {
    res.status(400).send(page('error', { message: '로그인 요청을 확인할 수 없어요. 다시 시도해 주세요.' }));
    return;
  }
  try {
    const r = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const data = await r.json();
    if (!data.access_token) throw new Error(data.error_description || 'no token');
    res.status(200).send(page('success', { token: data.access_token, provider: 'github' }));
  } catch (e) {
    res.status(500).send(page('error', { message: 'GitHub 로그인에 실패했어요: ' + e.message }));
  }
};
