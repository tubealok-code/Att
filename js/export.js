import { getAllStudents } from './students.js';
import { collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { db } from './firebase-config.js';
import { showToast } from './app.js';

const exportCsvBtn = document.getElementById('exportCsv');
const exportXlsxBtn = document.getElementById('exportXlsx');
const exportPdfBtn = document.getElementById('exportPdf');
const reportDateInput = document.getElementById('reportDate');
const attendanceCol = collection(db,'attendance');

async function buildDateReportRows(date){
  const students = await getAllStudents();
  const q = query(attendanceCol, where('attendanceDate','==',date));
  const snap = await getDocs(q); const map={}; snap.forEach(d=> map[d.data().studentId]=d.data().status);
  return students.map(s=> ({roll:s.rollNo,name:s.name, status: map[s.id]||'absent'}));
}

exportCsvBtn.addEventListener('click', async ()=>{
  const date = reportDateInput.value;
  if(!date){ showToast('Select a date to export date-wise','error'); return; }
  const rows = await buildDateReportRows(date);
  const csv = [ ['Roll','Name','Status'], ...rows.map(r=>[r.roll,r.name,r.status]) ].map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`attendance_${date}.csv`; a.click(); URL.revokeObjectURL(url);
  showToast('CSV exported','success');
});

exportXlsxBtn.addEventListener('click', async ()=>{
  const date = reportDateInput.value; if(!date){ showToast('Select a date to export','error'); return; }
  const rows = await buildDateReportRows(date);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Attendance');
  XLSX.writeFile(wb, `attendance_${date}.xlsx`);
  showToast('Excel exported','success');
});

exportPdfBtn.addEventListener('click', async ()=>{
  const date = reportDateInput.value; if(!date){ showToast('Select a date to export','error'); return; }
  const rows = await buildDateReportRows(date);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text(`Attendance ${date}`,14,16);
  const body = rows.map(r=> [r.roll, r.name, r.status]);
  doc.autoTable({ startY:22, head:[['Roll','Name','Status']], body });
  doc.save(`attendance_${date}.pdf`);
  showToast('PDF exported','success');
});
