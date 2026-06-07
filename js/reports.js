import { db } from './firebase-config.js';
import { collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { getAllStudents, findStudentByRoll } from './students.js';
import { showToast, showLoading, hideLoading, formatDateISO } from './app.js';

const reportDate = document.getElementById('reportDate');
const runDateReport = document.getElementById('runDateReport');
const reportStudentSearch = document.getElementById('reportStudentSearch');
const runStudentReport = document.getElementById('runStudentReport');
const reportOutput = document.getElementById('reportOutput');

const attendanceCol = collection(db,'attendance');

runDateReport.addEventListener('click', async ()=>{
  const date = reportDate.value; if(!date){ showToast('Select date','error'); return; }
  showLoading();
  try{
    const students = await getAllStudents();
    const q = query(attendanceCol, where('attendanceDate','==',date));
    const snap = await getDocs(q); const map={}; snap.forEach(d=> map[d.data().studentId]=d.data().status);
    const rows = students.map(s=> `<tr><td>${s.rollNo}</td><td>${s.name}</td><td>${map[s.id]||'absent'}</td></tr>`);
    reportOutput.innerHTML = `<h6>Date: ${date}</h6><div class="table-responsive"><table class="table table-sm"><thead><tr><th>Roll</th><th>Name</th><th>Status</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
  }catch(e){ console.error(e); showToast('Report failed','error'); }
  hideLoading();
});

runStudentReport.addEventListener('click', async ()=>{
  const qv = reportStudentSearch.value.trim(); if(!qv) return;
  showLoading();
  try{
    // find student by roll or name
    let student = await findStudentByRoll(qv);
    if(!student){ // fallback search by name
      const all = await getAllStudents(); student = all.find(s=> s.name.toLowerCase().includes(qv.toLowerCase()));
    }
    if(!student){ reportOutput.innerHTML = '<div class="text-muted">Student not found</div>'; hideLoading(); return; }
    const q = query(attendanceCol, where('studentId','==',student.id));
    const snap = await getDocs(q);
    let present=0, absent=0; const days=[];
    snap.forEach(d=>{ const s=d.data(); if(s.status==='present') present++; else absent++; days.push(s.attendanceDate); });
    const total = present+absent; const pct = total? Math.round((present/total)*100):0;
    reportOutput.innerHTML = `<h6>${student.name} (${student.rollNo})</h6><p>Total Present: ${present} | Total Absent: ${absent} | Percentage: ${pct}%</p>`;
  }catch(e){ console.error(e); showToast('Search failed','error'); }
  hideLoading();
});
