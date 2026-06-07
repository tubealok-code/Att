import { db } from './firebase-config.js';
import { collection, addDoc, query, where, getDocs, doc, deleteDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { showToast, showLoading, hideLoading } from './app.js';

const studentsCol = collection(db,'students');

// Add student form
const addForm = document.getElementById('addStudentForm');
const addRoll = document.getElementById('addRoll');
const addName = document.getElementById('addName');
const addMobile = document.getElementById('addMobile');
const addDob = document.getElementById('addDob');
const rollExistsEl = document.getElementById('rollExists');
const saveStudentBtn = document.getElementById('saveStudentBtn');

let rollUnique = true;

addRoll.addEventListener('input', async ()=>{
  const val = addRoll.value.trim();
  if(!val) { rollExistsEl.style.display='none'; saveStudentBtn.disabled=false; return; }
  // Check uniqueness
  const q = query(studentsCol, where('rollNo','==',val));
  const snap = await getDocs(q);
  if(!snap.empty){ rollExistsEl.style.display='block'; saveStudentBtn.disabled=true; rollUnique=false; }
  else{ rollExistsEl.style.display='none'; saveStudentBtn.disabled=false; rollUnique=true; }
});

addForm.addEventListener('submit', async e=>{
  e.preventDefault();
  if(!rollUnique){ showToast('Roll number exists','error'); return; }
  showLoading();
  try{
    const payload = {
      rollNo: addRoll.value.trim(),
      name: addName.value.trim(),
      mobile: addMobile.value.trim(),
      dob: addDob.value,
      createdAt: serverTimestamp()
    };
    await addDoc(studentsCol, payload);
    showToast('Student added','success');
    addForm.reset();
    // notify others
    window.dispatchEvent(new CustomEvent('students:changed'));
  }catch(err){ console.error(err); showToast('Failed to add student','error'); }
  hideLoading();
});

// Remove student
const removeSearch = document.getElementById('removeSearch');
const removeSearchBtn = document.getElementById('removeSearchBtn');
const removeResult = document.getElementById('removeResult');

removeSearchBtn.addEventListener('click', async ()=>{
  const qv = removeSearch.value.trim();
  if(!qv) return;
  removeResult.innerHTML='Searching...';
  // search by roll or name
  const q1 = query(studentsCol, where('rollNo','==',qv));
  const q2 = query(studentsCol, where('name','>=',qv));
  const s1 = await getDocs(q1);
  let html = '';
  if(!s1.empty){ s1.forEach(d=>{ html += renderRemoveCard(d.id,d.data()); }); }
  else{
    const s2 = await getDocs(q2);
    if(!s2.empty){ s2.forEach(d=>{ html += renderRemoveCard(d.id,d.data()); }); }
  }
  removeResult.innerHTML = html || '<div class="text-muted">No student found</div>';
});

function renderRemoveCard(id,data){
  return `<div class="border rounded p-2 mb-2 d-flex justify-content-between align-items-center">
    <div><strong>${data.rollNo}</strong> — ${data.name}<br><small>${data.mobile}</small></div>
    <div><button class="btn btn-danger btn-sm" data-id="${id}" onclick="window.removeStudent('${id}')">Remove</button></div>
  </div>`;
}

// Expose removeStudent on window for inline onclick
window.removeStudent = async function(id){
  if(!confirm('Delete student? This will remove the student record.')) return;
  showLoading();
  try{ await deleteDoc(doc(db,'students',id)); showToast('Student removed','success'); window.dispatchEvent(new CustomEvent('students:changed')); }
  catch(e){ console.error(e); showToast('Failed to delete','error'); }
  hideLoading();
};

// Helper: fetch all students
export async function getAllStudents(){
  const snap = await getDocs(studentsCol);
  const arr = [];
  snap.forEach(d=> arr.push({id:d.id, ...d.data()}));
  // sort by rollNo numeric when possible
  arr.sort((a,b)=>{ const x=parseInt(a.rollNo), y=parseInt(b.rollNo); if(!isNaN(x)&&!isNaN(y)) return x-y; return a.rollNo.localeCompare(b.rollNo); });
  return arr;
}

// helper to get student by roll or id
export async function findStudentByRoll(roll){
  const q = query(studentsCol, where('rollNo','==',roll));
  const snap = await getDocs(q);
  if(snap.empty) return null;
  const d = snap.docs[0]; return {id:d.id, ...d.data()};
}
