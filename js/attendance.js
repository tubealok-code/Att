import { db } from './firebase-config.js';
import { collection, setDoc, doc, serverTimestamp, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { getAllStudents } from './students.js';
import { showToast, showLoading, hideLoading, formatDateISO } from './app.js';

const attendanceCol = collection(db,'attendance');
const tableBody = document.querySelector('#attendanceTable tbody');
const summaryTotal = document.getElementById('summaryTotal');
const summaryPresent = document.getElementById('summaryPresent');
const summaryAbsent = document.getElementById('summaryAbsent');
const saveBtn = document.getElementById('saveAttendance');
const editBtn = document.getElementById('editAttendance');

let studentsCache = [];

async function rebuildTable(){
  studentsCache = await getAllStudents();
  tableBody.innerHTML = '';
  studentsCache.forEach(s=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${s.rollNo}</td><td>${s.name}</td><td>${calcAge(s.dob)}</td><td><input type="checkbox" class="presentChk" data-id="${s.id}"></td>`;
    tableBody.appendChild(tr);
  });
  updateSummaryCounts();
}

function calcAge(dob){ if(!dob) return '-'; const b=new Date(dob); const now=new Date(); let age=now.getFullYear()-b.getFullYear(); const m=now.getMonth()-b.getMonth(); if(m<0 || (m===0 && now.getDate()<b.getDate())) age--; return age; }

function updateSummaryCounts(){
  const total = studentsCache.length;
  const present = tableBody.querySelectorAll('input.presentChk:checked').length;
  const absent = total - present;
  summaryTotal.textContent = total; summaryPresent.textContent = present; summaryAbsent.textContent = absent;
}

// listen for checkbox changes (event delegation)
tableBody.addEventListener('change', e=>{ if(e.target.classList.contains('presentChk')) updateSummaryCounts(); });

saveBtn.addEventListener('click', async ()=>{
  const date = formatDateISO(new Date());
  await saveAttendanceForDate(date);
});

async function saveAttendanceForDate(date){
  showLoading();
  try{
    const checks = tableBody.querySelectorAll('input.presentChk');
    const updates = [];
    checks.forEach(ch=>{
      const studentId = ch.dataset.id;
      const status = ch.checked ? 'present' : 'absent';
      const docId = `${studentId}_${date}`;
      const ref = doc(db,'attendance',docId);
      updates.push(setDoc(ref, { studentId, attendanceDate: date, status, updatedAt: serverTimestamp() }));
    });
    await Promise.all(updates);
    showToast('Attendance saved','success');
    window.dispatchEvent(new CustomEvent('attendance:changed'));
  }catch(e){ console.error(e); showToast('Save failed','error'); }
  hideLoading();
}

// Edit previous attendance: show date picker and load
editBtn.addEventListener('click', ()=>{
  const input = document.createElement('input'); input.type='date'; input.className='d-none';
  input.addEventListener('change', async ()=>{
    const date = input.value; if(!date) return;
    await loadAttendanceForDate(date);
    input.remove();
  });
  document.body.appendChild(input); input.showPicker ? input.showPicker() : input.click();
});

async function loadAttendanceForDate(date){
  showLoading();
  try{
    // reset all to unchecked
    tableBody.querySelectorAll('input.presentChk').forEach(i=>i.checked=false);
    const q = query(attendanceCol, where('attendanceDate','==',date));
    const snap = await getDocs(q);
    const map = {};
    snap.forEach(d=>{ const data=d.data(); map[data.studentId]=data.status; });
    tableBody.querySelectorAll('input.presentChk').forEach(i=>{ const st=map[i.dataset.id]; if(st) i.checked = st==='present'; });
    updateSummaryCounts();
    showToast(`Loaded attendance for ${date}`,'success');
  }catch(e){ console.error(e); showToast('Failed to load','error'); }
  hideLoading();
}

// Rebuild on startup and when students change
rebuildTable();
window.addEventListener('students:changed', ()=>rebuildTable());

export { saveAttendanceForDate, loadAttendanceForDate };
