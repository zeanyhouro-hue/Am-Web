# AM Preset Player (web)

Jalankan lokal:  `node server.js`  lalu buka http://localhost:3000
Deploy: taruh folder ini di host Node.js mana pun (VPS, Render, Railway, dll), perintah start `node server.js`. Port dari env PORT.

Struktur: server.js (statis + /api/fetch), public/ (index.html, style.css, app.js, runtime.js).

## /api/fetch?url=...&kind=audio
Server mengambil link atas nama browser (tanpa CORS):
- Link share AM (alightcreative.com/am/share/..., alight.link): dicari di Firebase Storage AM. BELUM TERUJI dengan link asli.
- Google Drive: diubah ke link unduh langsung.
- TikTok: lewat tikwm.com (pihak ketiga, bisa berubah/mati).
- URL biasa (foto/audio/xml): di-proxy. Host privat/localhost diblokir.

Jika link AM gagal, pesan error memuat kode HTTP tiap percobaan. Kirim pesan itu untuk penyesuaian.

## window.AM
loadPreset(src, projectName), getAvailableProjects, selectProject, getMediaSlots, applyMedia, setAudio (URL/TikTok/Drive/File/Base64), renderVideo (audio ikut terekam), getRenderProgress, cancelRender, onLog.
