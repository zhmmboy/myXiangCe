const DB_NAME = 'shiguang-album';
const STORE = 'photos';
let db;
let photos = [];
const $ = (id) => document.getElementById(id);

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
function transaction(mode = 'readonly') { return db.transaction(STORE, mode).objectStore(STORE); }
function getAll() { return new Promise((resolve, reject) => { const r = transaction().getAll(); r.onsuccess = () => resolve(r.result.sort((a,b) => a.order-b.order)); r.onerror = () => reject(r.error); }); }
function save(photo) { return new Promise((resolve, reject) => { const r = transaction('readwrite').put(photo); r.onsuccess = resolve; r.onerror = () => reject(r.error); }); }
function remove(id) { return new Promise((resolve, reject) => { const r = transaction('readwrite').delete(id); r.onsuccess = resolve; r.onerror = () => reject(r.error); }); }
function clearStore() { return new Promise((resolve, reject) => { const r = transaction('readwrite').clear(); r.onsuccess = resolve; r.onerror = () => reject(r.error); }); }
function showToast(message) { const toast = $('toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200); }
function render() {
  $('photoCount').textContent = `${photos.length} 张照片`;
  $('previewWrap').hidden = photos.length === 0;
  $('photoGrid').replaceChildren();
  photos.forEach((photo, index) => {
    const card = document.createElement('div'); card.className = 'photo-thumb';
    const image = document.createElement('img'); image.src = URL.createObjectURL(photo.blob); image.alt = photo.name;
    const button = document.createElement('button'); button.className = 'remove-photo'; button.type = 'button'; button.setAttribute('aria-label', `移除${photo.name}`); button.textContent = '×';
    button.addEventListener('click', async () => { await remove(photo.id); photos = photos.filter((item) => item.id !== photo.id); photos.forEach((item, i) => { item.order = i; save(item); }); render(); });
    card.append(image, button); $('photoGrid').append(card);
  });
  const url = new URL('slideshow.html', location.href);
  url.searchParams.set('album', 'local');
  $('shareUrl').value = photos.length ? url.href : '';
  $('shareUrl').placeholder = photos.length ? '' : '添加照片后生成链接';
  $('copyLink').disabled = photos.length === 0;
  $('previewAlbum').disabled = photos.length === 0;
}
async function addFiles(files) {
  const images = [...files].filter((file) => file.type.startsWith('image/'));
  if (!images.length) { showToast('请选择图片文件'); return; }
  for (const file of images) {
    const photo = { id: crypto.randomUUID(), name: file.name, blob: file, order: photos.length };
    await save(photo); photos.push(photo);
  }
  render(); showToast(`已添加 ${images.length} 张照片`);
}

openDatabase().then(async (database) => { db = database; photos = await getAll(); render(); }).catch(() => showToast('本地相册暂不可用，请使用现代浏览器打开'));
$('photoInput').addEventListener('change', (event) => { addFiles(event.target.files); event.target.value = ''; });
$('clearPhotos').addEventListener('click', async () => { await clearStore(); photos = []; render(); showToast('相册已清空'); });
$('previewAlbum').addEventListener('click', () => { if (photos.length) window.open($('shareUrl').value, '_blank', 'noopener'); });
$('copyLink').addEventListener('click', async () => { try { await navigator.clipboard.writeText($('shareUrl').value); showToast('展示链接已复制'); } catch { $('shareUrl').select(); document.execCommand('copy'); showToast('展示链接已复制'); } });
const dropzone = $('dropzone');
dropzone.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); $('photoInput').click(); } });
['dragenter','dragover'].forEach((name) => dropzone.addEventListener(name, (event) => { event.preventDefault(); dropzone.classList.add('dragover'); }));
['dragleave','drop'].forEach((name) => dropzone.addEventListener(name, (event) => { event.preventDefault(); dropzone.classList.remove('dragover'); }));
dropzone.addEventListener('drop', (event) => addFiles(event.dataTransfer.files));
