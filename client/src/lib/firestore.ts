import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  type DocumentData,
  type QueryConstraint,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase';

/** Get the current user's UID or throw */
export function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  return uid;
}

/** Convert Firestore Timestamps to ISO strings recursively */
function convertTimestamps(data: DocumentData): DocumentData {
  const result: DocumentData = {};
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Timestamp) {
      result[key] = value.toDate().toISOString();
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = convertTimestamps(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/** Query a top-level collection with user filter */
export async function queryUserDocs<T>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
): Promise<(T & { id: string })[]> {
  const uid = requireUid();
  const q = query(
    collection(db, collectionName),
    where('userId', '==', uid),
    ...constraints,
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...convertTimestamps(d.data()),
  })) as (T & { id: string })[];
}

/** Query any collection without user filter (for public/shared data) */
export async function queryDocs<T>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
): Promise<(T & { id: string })[]> {
  const q = query(collection(db, collectionName), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...convertTimestamps(d.data()),
  })) as (T & { id: string })[];
}

/** Query a subcollection under a parent doc */
export async function querySubcollection<T>(
  parentCollection: string,
  parentId: string,
  subCollection: string,
  constraints: QueryConstraint[] = [],
): Promise<(T & { id: string })[]> {
  const q = query(
    collection(db, parentCollection, parentId, subCollection),
    ...constraints,
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...convertTimestamps(d.data()),
  })) as (T & { id: string })[];
}

/** Get a single document by ID */
export async function getDocument<T>(
  collectionName: string,
  docId: string,
): Promise<(T & { id: string }) | null> {
  const ref = doc(db, collectionName, docId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...convertTimestamps(snap.data()) } as T & { id: string };
}

/** Create a new document with auto-generated ID */
export async function createDocument<T extends DocumentData>(
  collectionName: string,
  data: T,
): Promise<string> {
  const uid = requireUid();
  const ref = await addDoc(collection(db, collectionName), {
    ...data,
    userId: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Create a document in a subcollection */
export async function createSubDocument<T extends DocumentData>(
  parentCollection: string,
  parentId: string,
  subCollection: string,
  data: T,
): Promise<string> {
  const ref = await addDoc(
    collection(db, parentCollection, parentId, subCollection),
    {
      ...data,
      createdAt: serverTimestamp(),
    },
  );
  return ref.id;
}

/** Update an existing document */
export async function updateDocument(
  collectionName: string,
  docId: string,
  data: DocumentData,
): Promise<void> {
  const ref = doc(db, collectionName, docId);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/** Set a document with a specific ID (create or overwrite) */
export async function setDocument(
  collectionName: string,
  docId: string,
  data: DocumentData,
  merge = true,
): Promise<void> {
  const ref = doc(db, collectionName, docId);
  await setDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge });
}

/** Delete a document */
export async function removeDocument(
  collectionName: string,
  docId: string,
): Promise<void> {
  const ref = doc(db, collectionName, docId);
  await deleteDoc(ref);
}

/** Delete a subcollection document */
export async function removeSubDocument(
  parentCollection: string,
  parentId: string,
  subCollection: string,
  docId: string,
): Promise<void> {
  const ref = doc(db, parentCollection, parentId, subCollection, docId);
  await deleteDoc(ref);
}

// Re-export commonly used Firestore functions for hooks
export {
  collection,
  doc,
  query,
  where,
  orderBy,
  firestoreLimit as limit,
  serverTimestamp,
  Timestamp,
};
