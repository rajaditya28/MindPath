import { getDb } from './firebase-admin';

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
  await db.collection(collectionName).doc(docId).set(data, { merge: true });
}

export async function getDocument<T>(
  collectionName: string,
  docId: string
): Promise<T | null> {
  const db = getDb();
  const snap = await db.collection(collectionName).doc(docId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as unknown as T;
}

export async function queryByUser<T extends Record<string, unknown>>(
  collectionName: string,
  userId: string,
  maxResults = 50
): Promise<T[]> {
  const db = getDb();
  const snap = await db
    .collection(collectionName)
    .where('userId', '==', userId)
    .limit(maxResults)
    .get();
  const results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as T));
  // Sort by createdAt descending in memory — avoids composite index requirement
  return results.sort((a, b) =>
    String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))
  );
}
