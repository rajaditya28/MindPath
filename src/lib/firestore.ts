// Server-side Firestore using client SDK — works with test mode rules, no service account needed
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  type Firestore,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

let _app: FirebaseApp;
let _db: Firestore;

function getClientApp(): FirebaseApp {
  if (!_app) {
    _app = getApps().find((a) => a.name === 'server') ?? initializeApp(firebaseConfig, 'server');
  }
  return _app;
}

function getDb(): Firestore {
  if (!_db) {
    _db = getFirestore(getClientApp());
  }
  return _db;
}

export const COLLECTIONS = {
  LEARNING_PATHS: 'learning_paths',
  CHAT_HISTORY: 'chat_history',
  PROGRESS: 'progress',
} as const;

export async function saveDocument(
  collectionName: string,
  docId: string,
  data: Record<string, unknown>
): Promise<void> {
  const db = getDb();
  await setDoc(doc(db, collectionName, docId), data, { merge: true });
}

export async function getDocument<T>(
  collectionName: string,
  docId: string
): Promise<T | null> {
  const db = getDb();
  const snap = await getDoc(doc(db, collectionName, docId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as unknown as T;
}

export async function queryByUser<T extends Record<string, unknown>>(
  collectionName: string,
  userId: string,
  maxResults = 50
): Promise<T[]> {
  const db = getDb();
  const q = query(
    collection(db, collectionName),
    where('userId', '==', userId),
    limit(maxResults)
  );
  const snap = await getDocs(q);
  const results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as T));
  // Sort by createdAt descending in memory — avoids composite index requirement
  return results.sort((a, b) =>
    String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))
  );
}
