import { useEffect, useState } from 'react'
import { Trash2, Plus } from 'lucide-react'
import { addNote, getNotesForFile, deleteNote } from '../../lib/db.js'
import { uid, formatDate } from '../../lib/utils.js'
import Button from '../common/Button.jsx'
import EmptyState from '../common/EmptyState.jsx'
import { NotebookPen } from 'lucide-react'

export default function NotesPanel({ fileId }) {
  const [notes, setNotes] = useState([])
  const [draft, setDraft] = useState('')

  useEffect(() => {
    getNotesForFile(fileId).then(setNotes)
  }, [fileId])

  async function handleAdd() {
    if (!draft.trim()) return
    const note = { id: uid(), fileId, text: draft.trim(), createdAt: new Date().toISOString() }
    await addNote(note)
    setNotes((n) => [note, ...n])
    setDraft('')
  }

  async function handleDelete(id) {
    await deleteNote(id)
    setNotes((n) => n.filter((note) => note.id !== id))
  }

  return (
    <div className="notebook-rule">
      <div className="flex items-center gap-2 mb-3">
        <NotebookPen size={16} className="text-marigold-dark" />
        <h3 className="font-display text-sm font-semibold">Notes</h3>
      </div>

      <div className="flex gap-2 mb-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a note about this page…"
          rows={2}
          className="flex-1 px-3 py-2 rounded-lg border border-paper-line dark:border-ink-soft bg-transparent text-sm outline-none focus:border-marigold resize-none"
        />
        <Button size="sm" icon={Plus} onClick={handleAdd} className="self-end">Add</Button>
      </div>

      {notes.length === 0 ? (
        <EmptyState title="No notes yet" description="Jot down what matters as you read." />
      ) : (
        <ul className="flex flex-col gap-2">
          {notes.map((note) => (
            <li
              key={note.id}
              className="flex items-start justify-between gap-2 p-3 rounded-lg bg-paper-dim/60 dark:bg-ink-soft/40"
            >
              <div>
                <p className="text-sm">{note.text}</p>
                <p className="text-[10px] text-ink/40 dark:text-paper/40 mt-1 font-mono">
                  {formatDate(note.createdAt, { weekday: undefined })}
                </p>
              </div>
              <button onClick={() => handleDelete(note.id)} aria-label="Delete note">
                <Trash2 size={14} className="text-ink/40 dark:text-paper/40 hover:text-rust" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
