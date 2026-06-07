import { db } from './firebase-config.js';

// App-wide utilities: time, toasts, loading, theme, service worker
const currentDateEl = document.getElementById('currentDate');
const currentTimeEl = document.getElementById('currentTime');

function updateClock(){
  const now = new Date();
  currentDateEl.textContent = now.toLocaleDateString(undefined, {weekday:'long',year:'numeric',month:'short',day:'numeric'});
  currentTimeEl.textContent = now.toLocaleTimeString();
}
setInterval(updateClock,1000); updateClock();

// Toast helper
export function showToast(message, opts={type:'info',timeout:3000}){
  const container = document.getElementById('toastContainer');
  const toastEl = document.createElement('div');
  toastEl.className = 'toast align-items-center text-bg-'+(opts.type==='error'?'danger':opts.type)+' border-0';
  toastEl.setAttribute('role','alert');
  toastEl.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
  container.appendChild(toastEl);
  const bs = new bootstrap.Toast(toastEl,{delay:opts.timeout});
  bs.show();
  toastEl.addEventListener('hidden.bs.toast',()=>toastEl.remove());
}

// Loading overlay
let loadingEl=null;
export function showLoading(){
  if(loadingEl) return;
  loadingEl = document.createElement('div');
  loadingEl.className='loading-overlay';
  loadingEl.innerHTML = `<div class="spinner-border text-light" role="status"><span class="visually-hidden">Loading...</span></div>`;
  document.body.appendChild(loadingEl);
}
export function hideLoading(){ if(loadingEl){loadingEl.remove();loadingEl=null;} }

// Dark mode
const darkToggle = document.getElementById('darkToggle');
function applyDark(val){ if(val) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark'); }
darkToggle.addEventListener('change',e=>{applyDark(e.target.checked); localStorage.setItem('pref-dark', e.target.checked)});
applyDark(localStorage.getItem('pref-dark')==='true');

// Register service worker
if('serviceWorker' in navigator){
  window.addEventListener('load', async ()=>{
    try{ await navigator.serviceWorker.register('/service-worker.js'); console.log('SW registered'); }
    catch(e){ console.warn('SW failed',e); }
  });
}

// Export helpers for other modules
export function formatDateISO(d=new Date()){ const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; }
