import { openDB } from 'idb'

const DB_NAME = 'vidyalaya-db'
const DB_VERSION = 1

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('fileBlobs')) {
        db.createObjectStore('fileBlobs') // key: fileId, value: Blob
      }
      if (!db.objectStoreNames.contains('notes')) {
        const store = db.createObjectStore('notes', { keyPath: 'id' })
        store.createIndex('fileId', 'fileId')
      }
      if (!db.objectStoreNames.contains('bookmarks')) {
        const store = db.createObjectStore('bookmarks', { keyPath: 'id' })
        store.createIndex('fileId', 'fileId')
      }
    },
  })
}

export async function saveFileBlob(fileId, blob) {
  const db = await getDB()
  await db.put('fileBlobs', blob, fileId)
}

export async function getFileBlob(fileId) {
  const db = await getDB()
  return db.get('fileBlobs', fileId)
}

export async function deleteFileBlob(fileId) {
  const db = await getDB()
  await db.delete('fileBlobs', fileId)
}

export async function addNote(note) {
  const db = await getDB()
  await db.put('notes', note)
}

export async function getNotesForFile(fileId) {
  const db = await getDB()
  return db.getAllFromIndex('notes', 'fileId', fileId)
}

export async function deleteNote(id) {
  const db = await getDB()
  await db.delete('notes', id)
}

export async function addBookmark(bookmark) {
  const db = await getDB()
  await db.put('bookmarks', bookmark)
}

export async function getBookmarksForFile(fileId) {
  const db = await getDB()
  return db.getAllFromIndex('bookmarks', 'fileId', fileId)
}

export async function deleteBookmark(id) {
  const db = await getDB()
  await db.delete('bookmarks', id)
}
