import { initializeApp, getApps, cert, applicationDefault, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

function getFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  // In Cloud Run, explicitly use Application Default Credentials
  if (process.env.K_SERVICE) {
    return initializeApp({ credential: applicationDefault(), projectId });
  }

  // Local development with service account
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp({ credential: applicationDefault(), projectId });
  }

  // Fallback: use env vars
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      } as ServiceAccount),
    });
  }

  // Initialize without credentials for development (will use emulators or fail gracefully)
  return initializeApp({ projectId });
}

let db: Firestore | null = null;
let auth: Auth | null = null;

const firestoreDatabaseId = process.env.FIRESTORE_DATABASE_ID || 'default';

export function getDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseAdmin(), firestoreDatabaseId);
  }
  return db;
}

export function getAdminAuth(): Auth {
  if (!auth) {
    getFirebaseAdmin();
    auth = getAuth();
  }
  return auth;
}

// Firestore collection names
export const COLLECTIONS = {
  USERS: 'users',
  LEARNING_PATHS: 'learning_paths',
  LESSONS: 'lessons',
  QUIZ_RESULTS: 'quiz_results',
  CHAT_HISTORY: 'chat_history',
  PROGRESS: 'progress',
} as const;

// Helper functions for Firestore operations
export async function getDocument<T>(collection: string, docId: string): Promise<T | null> {
  const doc = await getDb().collection(collection).doc(docId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as T;
}

export async function setDocument(collection: string, docId: string, data: Record<string, unknown>): Promise<void> {
  await getDb().collection(collection).doc(docId).set(data, { merge: true });
}

export async function addDocument(collection: string, data: Record<string, unknown>): Promise<string> {
  const ref = await getDb().collection(collection).add(data);
  return ref.id;
}

export async function queryDocuments<T>(
  collection: string,
  field: string,
  value: unknown,
  orderByField?: string,
  limit?: number
): Promise<T[]> {
  let query = getDb().collection(collection).where(field, '==', value);
  if (orderByField) query = query.orderBy(orderByField);
  if (limit) query = query.limit(limit);
  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
}
