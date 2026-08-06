import { useEffect, useState } from 'react'
import { Bookmark, Trash2 } from 'lucide-react'
import { getBookmarksForFile, deleteBookmark } from '../../lib/db.js'
import EmptyState from '../common/EmptyState.jsx'

export default function BookmarkList({ fileId, onJump }) {
  const [bookmarks, setBookmarks] = useState([])

  useEffect(() => {
    getBookmarksForFile(fileId).then(setBookmarks)
  }, [fileId])

  async function handleDelete(id) {
    await deleteBookmark(id)
    setBookmarks((b) => b.filter((bm) => bm.id !== id))
  }

  if (bookmarks.length === 0) {
    return <EmptyState icon={Bookmark} title="No bookmarks" description="Bookmark pages to find them fast later." />
  }

  return (
    <ul className="flex flex-col gap-2">
      {bookmarks
        .sort((a, b) => a.page - b.page)
        .map((bm) => (
          <li key={bm.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-paper-line dark:border-ink-soft">
            <button onClick={() => onJump?.(bm.page)} className="flex items-center gap-2 text-sm font-medium">
              <Bookmark size={13} className="text-marigold-dark" />
              Page {bm.page}
            </button>
            <button onClick={() => handleDelete(bm.id)} aria-label="Remove bookmark">
              <Trash2 size={13} className="text-ink/40 dark:text-paper/40 hover:text-rust" />
            </button>
          </li>
        ))}
    </ul>
  )
}
