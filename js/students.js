import { db } from './firebase-config.js';
import { collection, addDoc, query, where, getDocs, doc, deleteDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { showToast, showLoading, hideLoading } from './app.js';

const studentsCol = collection(db,'students');

// Bulk Add Students Table
const bulkAddTableBody = document.getElementById('bulkAddTableBody');
const saveBulkStudentsBtn = document.getElementById('saveBulkStudents');
const clearBulkTableBtn = document.getElementById('clearBulkTable');
const bulkAddMessages = document.getElementById('bulkAddMessages');
const importStudentsFile = document.getElementById('importStudentsFile');
const importStudentsBtn = document.getElementById('importStudentsBtn');

// Initialize bulk add table with 10 empty rows
function initializeBulkTable(){
  bulkAddTableBody.innerHTML = '';
  for(let i = 0; i < 10; i++){
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="text" class="form-control form-control-sm bulkRoll" placeholder="e.g., 001"></td>
      <td><input type="text" class="form-control form-control-sm bulkName" placeholder="Full Name"></td>
      <td><input type="text" class="form-control form-control-sm bulkMobile" placeholder="10-digit mobile"></td>
      <td><input type="date" class="form-control form-control-sm bulkDob"></td>
      <td><button type="button" class="btn btn-danger btn-sm deleteRow">✕</button></td>
    `;
    bulkAddTableBody.appendChild(row);
  }
}

// Add a row to bulk table with given values
function addRowToBulkTable(values){
  const row = document.createElement('tr');
  row.innerHTML = `
    <td><input type="text" class="form-control form-control-sm bulkRoll" placeholder="e.g., 001" value="${values.roll||''}"></td>
    <td><input type="text" class="form-control form-control-sm bulkName" placeholder="Full Name" value="${values.name||''}"></td>
    <td><input type="text" class="form-control form-control-sm bulkMobile" placeholder="10-digit mobile" value="${values.mobile||''}"></td>
    <td><input type="date" class="form-control form-control-sm bulkDob" value="${values.dob||''}"></td>
    <td><button type="button" class="btn btn-danger btn-sm deleteRow">✕</button></td>
  `;
  bulkAddTableBody.appendChild(row);
}

// Parse uploaded file (CSV or XLSX) and populate bulk table
async function handleImportFile(file){
  if(!file) return;
  const name = file.name.toLowerCase();
  try{
    let wb;
    if(name.endsWith('.csv')){
      const txt = await file.text();
      wb = XLSX.read(txt, {type:'string'});
    } else {
      const ab = await file.arrayBuffer();
      wb = XLSX.read(ab, {type:'array'});
    }
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, {defval:''});
    if(!rows || rows.length === 0){ showToast('No data found in file',{type:'error'}); return; }

    // Map headers to expected fields: roll, rollNo, name, mobile, dob
    initializeBulkTable(); // reset first
    for(const r of rows){
      // find possible keys
      const obj = {};
      for(const k of Object.keys(r)){
        const key = k.toString().trim().toLowerCase();
        const v = r[k];
        if(key.includes('roll')) obj.roll = String(v).trim();
        else if(key.includes('name')) obj.name = String(v).trim();
        else if(key.includes('mobile') || key.includes('phone')) obj.mobile = String(v).trim();
        else if(key.includes('dob') || key.includes('date')){
          // try to normalize date to yyyy-mm-dd
          let dv = v;
          if(typeof dv === 'number'){
            // Excel date serial
            const date = XLSX.SSF.parse_date_code(dv);
            if(date) dv = new Date(Date.UTC(date.y, date.m-1, date.d));
          }
          if(dv instanceof Date) obj.dob = dv.toISOString().slice(0,10);
          else {
            // try parse string
            const parsed = new Date(String(dv));
            if(!isNaN(parsed)) obj.dob = parsed.toISOString().slice(0,10);
            else obj.dob = String(dv).trim();
          }
        }
      }
      if(obj.roll || obj.name || obj.mobile || obj.dob) addRowToBulkTable(obj);
    }
    showToast(`${rows.length} row(s) imported`, {type:'success'});
  }catch(err){
    console.error(err);
    showToast('Failed to import file', {type:'error'});
  }
}

// Wire import button
importStudentsBtn.addEventListener('click', ()=>{
  const f = importStudentsFile.files[0];
  if(!f){ showToast('Select a file to import', {type:'error'}); return; }
  handleImportFile(f);
});

// Clear all rows
clearBulkTableBtn.addEventListener('click', ()=>{
  if(confirm('Clear all rows?')) initializeBulkTable();
});

// Delete individual rows with event delegation
bulkAddTableBody.addEventListener('click', (e)=>{
  if(e.target.classList.contains('deleteRow')){
    e.target.closest('tr').remove();
  }
});

// Check if roll number exists
async function checkRollExists(roll){
  const q = query(studentsCol, where('rollNo','==',roll));
  const snap = await getDocs(q);
  return !snap.empty;
}

// Save all students from bulk table
saveBulkStudentsBtn.addEventListener('click', async ()=>{
  const rows = bulkAddTableBody.querySelectorAll('tr');
  const students = [];
  let hasErrors = false;
  
  // Validate and collect data
  for(let i = 0; i < rows.length; i++){
    const row = rows[i];
    const roll = row.querySelector('.bulkRoll').value.trim();
    const name = row.querySelector('.bulkName').value.trim();
    const mobile = row.querySelector('.bulkMobile').value.trim();
    const dob = row.querySelector('.bulkDob').value;
    
    // Skip empty rows
    if(!roll && !name && !mobile && !dob) continue;
    
    // Validate required fields
    if(!roll || !name || !mobile || !dob){
      showToast(`Row ${i+1}: All fields are required`, {type:'error'});
      hasErrors = true;
      continue;
    }
    
    // Validate mobile (10 digits)
    if(!/^\d{10}$/.test(mobile.replace(/\D/g,''))){
      showToast(`Row ${i+1}: Mobile must be 10 digits`, {type:'error'});
      hasErrors = true;
      continue;
    }
    
    students.push({index: i+1, rollNo: roll, name: name, mobile: mobile, dob: dob});
  }
  
  if(students.length === 0){
    showToast('No valid student data to save', {type:'error'});
    return;
  }
  
  if(hasErrors){
    showToast('Please fix errors before saving', {type:'error'});
    return;
  }
  
  showLoading();
  let successCount = 0;
  let failureCount = 0;
  
  try{
    // Check all rolls for duplicates first
    const rolls = students.map(s=> s.rollNo);
    const existingRolls = new Set();
    for(const roll of rolls){
      const exists = await checkRollExists(roll);
      if(exists) existingRolls.add(roll);
    }
    
    for(const student of students){
      try{
        // Check if roll already exists
        if(existingRolls.has(student.rollNo)){
          showToast(`Row ${student.index}: Roll number already exists`, {type:'error'});
          failureCount++;
          continue;
        }
        
        const payload = {
          rollNo: student.rollNo,
          name: student.name,
          mobile: student.mobile,
          dob: student.dob,
          createdAt: serverTimestamp()
        };
        
        await addDoc(studentsCol, payload);
        successCount++;
      }catch(err){
        console.error(err);
        failureCount++;
      }
    }
    
    hideLoading();
    if(successCount > 0){
      showToast(`${successCount} student(s) added successfully`, {type:'success'});
      initializeBulkTable();
      window.dispatchEvent(new CustomEvent('students:changed'));
    }
    
    if(failureCount > 0){
      showToast(`${failureCount} student(s) failed to add`, {type:'error'});
    }
  }catch(err){
    console.error(err);
    hideLoading();
    showToast('Failed to save students', {type:'error'});
  }
});

// Initialize table on page load
initializeBulkTable();

// Remove student
const removeSearch = document.getElementById('removeSearch');
const removeSearchBtn = document.getElementById('removeSearchBtn');
const removeResult = document.getElementById('removeResult');

removeSearchBtn.addEventListener('click', async ()=>{
  const qv = removeSearch.value.trim();
  if(!qv) return;
  showLoading();
  try{
    removeResult.innerHTML='';
    // search by roll first (exact match)
    const q1 = query(studentsCol, where('rollNo','==',qv));
    const s1 = await getDocs(q1);
    let html = '';
    if(!s1.empty){
      s1.forEach(d=>{ html += renderRemoveCard(d.id,d.data()); });
    }else{
      // fallback: search by name (partial match in JS)
      const allStudents = await getAllStudents();
      const matches = allStudents.filter(s=> s.name.toLowerCase().includes(qv.toLowerCase()));
      if(matches.length > 0){
        matches.forEach(d=>{ html += renderRemoveCard(d.id,d); });
      }
    }
    removeResult.innerHTML = html || '<div class="text-muted">No student found</div>';
  }catch(err){
    console.error(err);
    showToast('Search failed', {type:'error'});
    removeResult.innerHTML = '';
  }
  hideLoading();
});

function renderRemoveCard(id,data){
  return `<div class="border rounded p-2 mb-2 d-flex justify-content-between align-items-center" data-student-id="${id}">
    <div><strong>${data.rollNo}</strong> — ${data.name}<br><small>${data.mobile}</small></div>
    <div><button class="btn btn-danger btn-sm removeStudentBtn">Remove</button></div>
  </div>`;
}

// Remove student with event delegation
removeResult.addEventListener('click', async (e)=>{
  if(e.target.classList.contains('removeStudentBtn')){
    const card = e.target.closest('[data-student-id]');
    if(!card) return; // Safety check
    const id = card.dataset.studentId;
    if(!confirm('Delete student? This will remove the student record.')) return;
    showLoading();
    try{ 
      await deleteDoc(doc(db,'students',id)); 
      showToast('Student removed', {type:'success'}); 
      window.dispatchEvent(new CustomEvent('students:changed')); 
    }
    catch(err){ 
      console.error(err); 
      showToast('Failed to delete', {type:'error'}); 
    }
    hideLoading();
  }
});

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
