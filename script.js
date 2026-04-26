const ALLDL = (u) => `https://api-library-kohi.onrender.com/api/alldl?url=${encodeURIComponent(u)}`;
const SMFAHIM = (u) => `https://www.smfahim.xyz/download/facebook/v1?url=${encodeURIComponent(u)}`;

const urlInput = document.getElementById('urlInput');
const btn = document.getElementById('downloadBtn');
const status = document.getElementById('status');
const resultBox = document.getElementById('result');

function setStatus(m, t) { status.className = 'status' + (t ? ' ' + t : ''); status.textContent = m || ''; }
function setLoading(on) { btn.disabled = on; btn.innerHTML = on ? '<span class="spinner"></span>Processing…' : 'Download'; }
function clear() { resultBox.innerHTML = ''; setStatus(''); }
function escape(s) { const d = document.createElement('div'); d.textContent = String(s || ''); return d.innerHTML; }

function pickSmfahim(data) {
  const d = data?.data || data;
  const hd = d?.hd || d?.HD || d?.hd_url || d?.video_hd || d?.videoUrl || d?.url || d?.download_url;
  const sd = d?.sd || d?.SD || d?.sd_url || d?.video_sd;
  const thumb = d?.thumbnail || d?.cover || d?.image;
  const title = d?.title || d?.description || '';
  return { hd, sd, thumb, title };
}

async function fetchVideo(url) {
  const [a, s] = await Promise.allSettled([
    fetch(ALLDL(url)).then(r => r.json()).catch(() => null),
    fetch(SMFAHIM(url)).then(r => r.json()).catch(() => null),
  ]);
  const all = a.value;
  const sm = s.value ? pickSmfahim(s.value) : {};
  const result = {
    videoUrl: (all?.status && all?.data?.videoUrl) || sm.hd || sm.sd,
    sdUrl: sm.sd && sm.sd !== (all?.data?.videoUrl) ? sm.sd : null,
    thumbnail: sm.thumb,
    title: sm.title,
    platform: all?.data?.platform || 'Facebook',
  };
  if (!result.videoUrl) throw new Error('No video found');
  return result;
}

async function run() {
  const url = urlInput.value.trim();
  clear();
  if (!url) return setStatus('⚠️ Please enter a Facebook URL.', 'error');
  if (!/facebook\.com|fb\.watch|fb\.com/i.test(url)) return setStatus('⚠️ Invalid Facebook URL.', 'error');

  setLoading(true); setStatus('⏳ Fetching video…');
  try {
    const m = await fetchVideo(url);
    console.log('FB result', m);

    let html = `<div class="result">`;
    if (m.platform) html += `<span class="platform-badge">📘 ${escape(m.platform)}</span>`;
    html += `<video class="preview" src="${m.videoUrl}" ${m.thumbnail ? `poster="${m.thumbnail}"` : ''} controls preload="metadata" playsinline></video>`;
    if (m.title) html += `<div class="meta">${escape(m.title)}</div>`;
    html += `<a class="dl" href="${m.videoUrl}" download="facebook-hd.mp4" target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
      Download HD
    </a>`;
    if (m.sdUrl) html += `<a class="dl alt" href="${m.sdUrl}" download="facebook-sd.mp4" target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
      Download SD
    </a>`;
    html += `</div>`;

    resultBox.innerHTML = html;
    setStatus('');
  } catch (e) {
    console.error(e);
    setStatus('❌ Failed to fetch video. Make sure the post is public.', 'error');
  } finally { setLoading(false); }
}

btn.addEventListener('click', run);
urlInput.addEventListener('keypress', e => { if (e.key === 'Enter') run(); });
