import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearCanvasObjects() {
  const snapshot = await getDocs(collection(db, 'canvasObjects'));
  console.log(\`Deleting \${snapshot.docs.length} documents...\`);
  
  for (const doc of snapshot.docs) {
    await deleteDoc(doc.ref);
    console.log(\`Deleted: \${doc.id}\`);
  }
  
  console.log('All canvas objects cleared!');
  process.exit(0);
}

clearCanvasObjects().catch(console.error);
