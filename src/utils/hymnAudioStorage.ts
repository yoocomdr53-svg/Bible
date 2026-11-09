// IndexedDB를 활용한 찬송가 사용자 MP3 음원 저장 및 관리 유틸리티

const DB_NAME = 'superbible_hymn_db';
const STORE_NAME = 'hymn_audio_files';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'hymnNumber' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface StoredHymnAudio {
  hymnNumber: number;
  fileName: string;
  blob: Blob;
  addedAt: number;
}

// 찬송가 번호에 해당하는 사용자 MP3 가져오기
export async function getHymnAudioBlob(hymnNumber: number): Promise<StoredHymnAudio | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(hymnNumber);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    console.warn('Error reading from IndexedDB:', err);
    return null;
  }
}

// 찬송가 번호에 사용자 MP3 파일 저장
export async function saveHymnAudioFile(hymnNumber: number, file: File): Promise<StoredHymnAudio> {
  const db = await openDB();
  const stored: StoredHymnAudio = {
    hymnNumber,
    fileName: file.name,
    blob: file,
    addedAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(stored);

    request.onsuccess = () => resolve(stored);
    request.onerror = () => reject(request.error);
  });
}

// 찬송가 번호의 사용자 MP3 삭제
export async function deleteHymnAudioFile(hymnNumber: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(hymnNumber);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
