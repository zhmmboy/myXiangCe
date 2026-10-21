const DB_NAME = 'shiguang-album';
const STORE = 'photos';
const $ = (id) => document.getElementById(id);
let db, photos = [], current = 0, playing = false, timer, progressTimer;
function openDatabase() { return new Promise((resolve, reject) => { const request = indexedDB.open(DB_NAME, 1); request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' }); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
function loadPhotos() { return new Promise((resolve, reject) => { const request = db.transaction(STORE).objectStore(STORE).getAll(); request.onsuccess = () => resolve(request.result.sort((a,b) => a.order-b.order)); request.onerror = () => reject(request.error); }); }
function toast(message) { const el = $('toast'); el.textContent = message; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2200); }
function pad(number) { return String(number).padStart(2,'0'); }
function render() {
  const image = $('slideImage');
  if (!photos.length) { image.hidden = true; $('emptyView').hidden = false; $('counter').innerHTML = '00 <i>/</i> 00'; $('filmstrip').replaceChildren(); $('prev').hidden = true; $('next').hidden = true; $('playPause').disabled = true; return; }
  $('emptyView').hidden = true; image.hidden = false; $('prev').hidden = false; $('next').hidden = false; $('playPause').disabled = false;
  image.classList.add('switching');
  const photo = photos[current];
  setTimeout(() => { image.src = URL.createObjectURL(photo.blob); image.alt = photo.name; image.onload = () => image.classList.remove('switching'); }, 100);
  $('counter').innerHTML = `${pad(current+1)} <i>/</i> ${pad(photos.length)}`;
  $('photoName').textContent = photo.name;
  $('filmstrip').replaceChildren();
  photos.forEach((item, index) => { const thumb = document.createElement('img'); thumb.className = `film-thumb${index === current ? ' active' : ''}`; thumb.src = URL.createObjectURL(item.blob); thumb.alt = item.name; thumb.title = item.name; thumb.addEventListener('click', () => { current = index; render(); if (playing) startProgress(); }); $('filmstrip').append(thumb); });
}
function go(delta) { if (!photos.length) return; current = (current + delta + photos.length) % photos.length; render(); if (playing) startProgress(); }
function startProgress() { clearInterval(progressTimer); clearTimeout(timer); $('progressBar').style.transition = 'none'; $('progressBar').style.width = '0'; requestAnimationFrame(() => { $('progressBar').style.transition = 'width 5s linear'; $('progressBar').style.width = '100%'; }); timer = setTimeout(() => go(1), 5000); }
function togglePlay() { if (!photos.length) return; playing = !playing; $('playIcon').textContent = playing ? 'Ⅱ' : '▶'; $('playState').textContent = playing ? '正在播放 · 每张照片 5 秒' : '已暂停 · 点击继续播放'; if (playing) startProgress(); else { clearTimeout(timer); clearInterval(progressTimer); $('progressBar').style.transition = 'none'; } }
openDatabase().then(async (database) => { db = database; photos = await loadPhotos(); render(); }).catch(() => { render(); toast('无法读取本地相册'); });
$('prev').addEventListener('click', () => go(-1)); $('next').addEventListener('click', () => go(1)); $('playPause').addEventListener('click', togglePlay);
$('fullScreen').addEventListener('click', async () => { try { if (!document.fullscreenElement) await $('viewer').requestFullscreen(); else await document.exitFullscreen(); } catch { toast('当前浏览器不支持全屏'); } });
document.addEventListener('keydown', (event) => { if (event.key === 'ArrowLeft') go(-1); if (event.key === 'ArrowRight') go(1); if (event.code === 'Space') { event.preventDefault(); togglePlay(); } });
