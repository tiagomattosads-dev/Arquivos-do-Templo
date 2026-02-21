import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'arquivos_templo_db';
const STORE_NAME = 'books';
const DB_VERSION = 1;

export interface StoredBook {
  id: string;
  name: string;
  type: 'epub' | 'pdf';
  data: Blob;
  cover?: string;
  addedAt: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function storeBook(book: StoredBook) {
  const db = await getDB();
  await db.put(STORE_NAME, book);
}

export async function getBook(id: string): Promise<StoredBook | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, id);
}

export async function getAllBooks(): Promise<StoredBook[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function deleteBook(id: string) {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}
