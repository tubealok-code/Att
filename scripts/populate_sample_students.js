/**
 * Populate sample students into Firestore using Firebase Admin SDK.
 *
 * Usage:
 * 1. Install dependencies: `npm install firebase-admin`
 * 2. Set env var pointing to your service account JSON:
 *    export SERVICE_ACCOUNT_FILE="/path/to/serviceAccount.json"
 * 3. Run: `node scripts/populate_sample_students.js`
 *
 * The script will skip students whose rollNo already exists.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = process.env.SERVICE_ACCOUNT_FILE || process.argv[2];
if(!serviceAccountPath){
  console.error('Provide service account JSON path via SERVICE_ACCOUNT_FILE env or as first arg');
  process.exit(1);
}

if(!fs.existsSync(serviceAccountPath)){
  console.error('Service account file not found:', serviceAccountPath);
  process.exit(1);
}

const serviceAccount = require(path.resolve(serviceAccountPath));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const sampleFile = path.join(__dirname,'sample_students.json');
const samples = require(sampleFile);

async function main(){
  try{
    for(const s of samples){
      // check existing by rollNo
      const q = await db.collection('students').where('rollNo','==',String(s.rollNo)).limit(1).get();
      if(!q.empty){
        console.log(`Skipping existing roll ${s.rollNo} - ${s.name}`);
        continue;
      }
      const payload = {
        rollNo: String(s.rollNo),
        name: s.name,
        mobile: s.mobile,
        dob: s.dob,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('students').add(payload);
      console.log(`Added ${s.rollNo} - ${s.name}`);
    }
    console.log('Done');
    process.exit(0);
  }catch(err){ console.error('Error',err); process.exit(2); }
}

main();
