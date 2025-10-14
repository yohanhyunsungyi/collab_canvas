import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// IMPORTANT: Make sure you have the serviceAccountKey.json in the root of the project
const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

const PROJECT_ID = 'gauntlet-collabcanvas-7d9d7';
const COLLECTION_NAME = 'canvasObjects';

console.log(`🔥 Verifying Firestore Data for project: ${PROJECT_ID}`);
console.log(`🔥 Collection: ${COLLECTION_NAME}\n`);

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: PROJECT_ID,
  });

  const db = admin.firestore();

  const verifyData = async () => {
    try {
      console.log('Fetching documents...');
      const snapshot = await db.collection(COLLECTION_NAME).get();

      if (snapshot.empty) {
        console.log('❌ No documents found in the collection. The test may have failed.');
        process.exit(1);
      }

      console.log(`✅ Success! Found ${snapshot.size} document(s).\n`);
      console.log('--- Document Data ---');
      snapshot.forEach(doc => {
        console.log(`ID: ${doc.id}`);
        console.log(JSON.stringify(doc.data(), null, 2));
        console.log('---------------------');
      });
      
      // Clean up the documents after verification
      console.log('\nCleaning up test documents...');
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log('✅ Cleanup complete.');
      
      process.exit(0);

    } catch (error) {
      console.error('❌ Error fetching data:', error);
      process.exit(1);
    }
  };

  verifyData();

} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK. Make sure serviceAccountKey.json is correct.', error.message);
  process.exit(1);
}
