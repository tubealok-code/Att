import { db } from './firebase-config.js';
import { query, where, getDocs, collection } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { getAllStudents } from './students.js';
import { formatDateISO, showToast } from './app.js';

const totalEl = document.getElementById('totalStudents');
const presentEl = document.getElementById('presentToday');
const absentEl = document.getElementById('absentToday');
const absentLastEl = document.getElementById('absentLast');
const cards = document.querySelectorAll('.card-clickable');
const listModal = new bootstrap.Modal(document.getElementById('listModal'));
const listTitle = document.getElementById('listModalTitle');
const listBody = document.getElementById('listModalBody');

const attendanceCol = collection(db,'attendance');

async function refreshDashboard(){
  const students = await getAllStudents();
  totalEl.textContent = students.length;
  const today = formatDateISO(new Date());
  const q = query(attendanceCol, where('attendanceDate','==',today));
  const snap = await getDocs(q);
  let present=0, absent=0;
  snap.forEach(d=>{ const s=d.data(); if(s.status==='present'){ present++; } else { absent++; } });
  presentEl.textContent = present; absentEl.textContent = absent;

  // last working day (yesterday simple)
  const yesterdayDate = new Date(); yesterdayDate.setDate(yesterdayDate.getDate()-1);
  const ystr = formatDateISO(yesterdayDate);
  const q2 = query(attendanceCol, where('attendanceDate','==',ystr));
  const snap2 = await getDocs(q2);
  let absentLast = 0; snap2.forEach(d=>{ if(d.data().status!=='present') absentLast++; });
  absentLastEl.textContent = absentLast;
}

cards.forEach(card=> card.addEventListener('click', async ()=>{
  const action = card.dataset.action;
  await showList(action);
}));

async function showList(action){
  const students = await getAllStudents();
  const today = formatDateISO(new Date());
  let rows = [];
  if(action==='totalStudents'){
    listTitle.textContent = 'All Students';
    rows = students.map(s=>`<li>${s.rollNo} — ${s.name}</li>`);
  }else if(action==='presentToday' || action==='absentToday'){
    const q = query(attendanceCol, where('attendanceDate','==',today));
    const snap = await getDocs(q);
    const map = {}; snap.forEach(d=> map[d.data().studentId]=d.data().status);
    rows = students.filter(s=>{
      const st = map[s.id]||'absent';
      return action==='presentToday' ? st==='present' : st!=='present';
    }).map(s=>`<li>${s.rollNo} — ${s.name}</li>`);
    listTitle.textContent = action==='presentToday' ? 'Present Today' : 'Absent Today';
  }else if(action==='absentLast'){
    const y = new Date(); y.setDate(y.getDate()-1); const ystr=formatDateISO(y);
    const q = query(attendanceCol, where('attendanceDate','==',ystr));
    const snap = await getDocs(q); const map={}; snap.forEach(d=> map[d.data().studentId]=d.data().status);
    rows = students.filter(s=> map[s.id] !== 'present').map(s=>`<li>${s.rollNo} — ${s.name}</li>`);
    listTitle.textContent = 'Absent on Last Working Day';
  }
  listBody.innerHTML = `<ul>${rows.join('') || '<li class="text-muted">No records</li>'}</ul>`;
  listModal.show();
}

// refresh on load and when attendance/students change
refreshDashboard();
window.addEventListener('attendance:changed', refreshDashboard);
window.addEventListener('students:changed', refreshDashboard);
