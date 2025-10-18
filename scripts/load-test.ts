/**
 * Load Testing Script for Collab Canvas
 * 
 * Tests:
 * 1. Canvas with 1000+ objects - measure FPS and render performance
 * 2. Simulate 10+ concurrent users - measure sync latency
 * 
 * Usage:
 *   npm run load-test
 * 
 * Requirements:
 *   - Firebase emulator running (for safe testing without affecting prod data)
 *   - Vite dev server running
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, writeBatch, connectFirestoreEmulator, deleteDoc, getDocs } from 'firebase/firestore';

// Firebase config (should match your project)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'demo-key',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abcdef',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to emulator if USE_EMULATOR env variable is set
if (process.env.USE_EMULATOR === 'true') {
  console.log('🔧 Connecting to Firestore Emulator...');
  connectFirestoreEmulator(db, 'localhost', 8080);
}

const CANVAS_COLLECTION = 'canvasObjects';
const TEST_USER_ID = 'load-test-user';

// Color palette for test shapes
const COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Orange
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Sky Blue
];

interface TestShape {
  id: string;
  type: 'rectangle' | 'circle' | 'text';
  x: number;
  y: number;
  color: string;
  zIndex: number;
  createdBy: string;
  createdAt: number;
  lastModifiedBy: string;
  lastModifiedAt: number;
  lockedBy: null;
  lockedAt: null;
  // Type-specific properties
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  fontSize?: number;
}

/**
 * Generate random shapes for load testing
 */
function generateRandomShapes(count: number, canvasWidth: number = 5000, canvasHeight: number = 5000): TestShape[] {
  const shapes: TestShape[] = [];
  const timestamp = Date.now();
  
  for (let i = 0; i < count; i++) {
    const shapeType = Math.random() < 0.33 ? 'rectangle' : Math.random() < 0.5 ? 'circle' : 'text';
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const x = Math.random() * (canvasWidth - 200) - canvasWidth / 2 + 100;
    const y = Math.random() * (canvasHeight - 200) - canvasHeight / 2 + 100;
    
    const baseShape = {
      id: `load-test-shape-${i}`,
      type: shapeType,
      x,
      y,
      color,
      zIndex: i,
      createdBy: TEST_USER_ID,
      createdAt: timestamp,
      lastModifiedBy: TEST_USER_ID,
      lastModifiedAt: timestamp,
      lockedBy: null,
      lockedAt: null,
    };
    
    if (shapeType === 'rectangle') {
      shapes.push({
        ...baseShape,
        type: 'rectangle',
        width: Math.random() * 150 + 50,
        height: Math.random() * 150 + 50,
      });
    } else if (shapeType === 'circle') {
      shapes.push({
        ...baseShape,
        type: 'circle',
        radius: Math.random() * 75 + 25,
      });
    } else {
      shapes.push({
        ...baseShape,
        type: 'text',
        text: `Test ${i}`,
        fontSize: Math.random() * 24 + 16,
      });
    }
  }
  
  return shapes;
}

/**
 * Create shapes in Firestore using batch writes
 */
async function createShapesInBatches(shapes: TestShape[]): Promise<void> {
  const BATCH_SIZE = 500; // Firestore batch limit
  const batches = Math.ceil(shapes.length / BATCH_SIZE);
  
  console.log(`📝 Creating ${shapes.length} shapes in ${batches} batches...`);
  
  for (let i = 0; i < batches; i++) {
    const batch = writeBatch(db);
    const start = i * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, shapes.length);
    
    for (let j = start; j < end; j++) {
      const shape = shapes[j];
      const shapeRef = doc(db, CANVAS_COLLECTION, shape.id);
      batch.set(shapeRef, shape);
    }
    
    await batch.commit();
    console.log(`  ✓ Batch ${i + 1}/${batches} committed (${end - start} shapes)`);
  }
  
  console.log(`✅ Successfully created ${shapes.length} shapes`);
}

/**
 * Clean up test shapes from Firestore
 */
async function cleanupTestShapes(): Promise<void> {
  console.log('🧹 Cleaning up test shapes...');
  
  const snapshot = await getDocs(collection(db, CANVAS_COLLECTION));
  const testDocs = snapshot.docs.filter(doc => doc.id.startsWith('load-test-shape-'));
  
  if (testDocs.length === 0) {
    console.log('  No test shapes to clean up');
    return;
  }
  
  const BATCH_SIZE = 500;
  const batches = Math.ceil(testDocs.length / BATCH_SIZE);
  
  for (let i = 0; i < batches; i++) {
    const batch = writeBatch(db);
    const start = i * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, testDocs.length);
    
    for (let j = start; j < end; j++) {
      batch.delete(testDocs[j].ref);
    }
    
    await batch.commit();
    console.log(`  ✓ Deleted batch ${i + 1}/${batches}`);
  }
  
  console.log(`✅ Cleaned up ${testDocs.length} test shapes`);
}

/**
 * Test 1: Canvas with 1000+ objects
 */
async function test1000PlusObjects(): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('TEST 1: Canvas Performance with 1000+ Objects');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const SHAPE_COUNT = 1500; // Test with 1500 shapes
  
  try {
    // Generate shapes
    console.log(`Generating ${SHAPE_COUNT} random shapes...`);
    const shapes = generateRandomShapes(SHAPE_COUNT);
    
    // Create shapes in Firestore
    const startTime = Date.now();
    await createShapesInBatches(shapes);
    const writeTime = Date.now() - startTime;
    
    console.log(`\n📊 Write Performance:`);
    console.log(`  Total time: ${writeTime}ms`);
    console.log(`  Average: ${(writeTime / SHAPE_COUNT).toFixed(2)}ms per shape`);
    console.log(`  Throughput: ${(SHAPE_COUNT / (writeTime / 1000)).toFixed(0)} shapes/second`);
    
    console.log('\n📋 Next Steps:');
    console.log('  1. Open the app in your browser');
    console.log('  2. Observe FPS in browser DevTools Performance tab');
    console.log('  3. Try panning, zooming, and selecting shapes');
    console.log('  4. Check console for virtualization stats');
    console.log('  5. Target: Maintain 60 FPS with all shapes visible');
    console.log('\n  Press Ctrl+C when done testing, then run cleanup');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

/**
 * Test 2: Simulate concurrent users
 */
async function testConcurrentUsers(): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('TEST 2: Concurrent Users Simulation');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const USER_COUNT = 12; // Simulate 12 concurrent users
  const UPDATES_PER_USER = 10;
  
  console.log(`Simulating ${USER_COUNT} concurrent users...`);
  console.log(`Each user will perform ${UPDATES_PER_USER} shape updates`);
  
  try {
    // Create a few shapes for users to interact with
    const shapes = generateRandomShapes(50);
    await createShapesInBatches(shapes);
    
    // Simulate concurrent user updates
    const startTime = Date.now();
    const userPromises: Promise<void>[] = [];
    
    for (let userId = 0; userId < USER_COUNT; userId++) {
      const userPromise = (async () => {
        for (let update = 0; update < UPDATES_PER_USER; update++) {
          // Pick a random shape to update
          const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
          const shapeRef = doc(db, CANVAS_COLLECTION, randomShape.id);
          
          // Simulate a position update
          const batch = writeBatch(db);
          batch.update(shapeRef, {
            x: Math.random() * 5000 - 2500,
            y: Math.random() * 5000 - 2500,
            lastModifiedBy: `user-${userId}`,
            lastModifiedAt: Date.now(),
          });
          await batch.commit();
          
          // Small delay between updates
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        }
      })();
      
      userPromises.push(userPromise);
    }
    
    await Promise.all(userPromises);
    const totalTime = Date.now() - startTime;
    const totalUpdates = USER_COUNT * UPDATES_PER_USER;
    
    console.log(`\n📊 Concurrent Update Performance:`);
    console.log(`  Total updates: ${totalUpdates}`);
    console.log(`  Total time: ${totalTime}ms`);
    console.log(`  Average latency: ${(totalTime / totalUpdates).toFixed(2)}ms per update`);
    console.log(`  Throughput: ${(totalUpdates / (totalTime / 1000)).toFixed(0)} updates/second`);
    
    console.log('\n📋 Next Steps:');
    console.log('  1. Open multiple browser windows/tabs');
    console.log('  2. Log in as different users in each');
    console.log('  3. Try moving shapes simultaneously');
    console.log('  4. Observe real-time sync behavior');
    console.log('  5. Target: < 100ms sync latency between users');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

/**
 * Main test runner
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  try {
    switch (command) {
      case 'load':
        await test1000PlusObjects();
        break;
        
      case 'concurrent':
        await testConcurrentUsers();
        break;
        
      case 'all':
        await test1000PlusObjects();
        await new Promise(resolve => setTimeout(resolve, 2000));
        await testConcurrentUsers();
        break;
        
      case 'cleanup':
        await cleanupTestShapes();
        break;
        
      default:
        console.log('Collab Canvas Load Testing');
        console.log('===========================\n');
        console.log('Usage:');
        console.log('  npm run load-test load       - Test with 1000+ objects');
        console.log('  npm run load-test concurrent - Test concurrent users');
        console.log('  npm run load-test all        - Run all tests');
        console.log('  npm run load-test cleanup    - Remove test data\n');
        console.log('Environment:');
        console.log('  USE_EMULATOR=true  - Use Firestore emulator (recommended)');
        console.log('\nExample:');
        console.log('  USE_EMULATOR=true npm run load-test load');
        break;
    }
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { generateRandomShapes, createShapesInBatches, cleanupTestShapes };

