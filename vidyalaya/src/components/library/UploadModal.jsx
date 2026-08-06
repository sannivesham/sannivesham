import { useState } from 'react'
import Modal from '../common/Modal.jsx'
import Button from '../common/Button.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { saveFileBlob } from '../../lib/db.js'
import { CATEGORIES } from '../../lib/utils.js'

const EMPTY_FORM = {
  title: '',
  category: CATEGORIES[0],
  subject: '',
  semester: '',
  description: '',
  tags: '',
}

export default function UploadModal({ open, onClose }) {
  const { addFile } = useApp()
  const { showToast } = useToast()
  const [form, setForm] = useState(EMPTY_FORM)
  const [selectedFile, setSelectedFile] = useState(null)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleFileSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    setSelectedFile(file)
    if (!form.title) update('title', file.name.replace(/\.[^/.]+$/, ''))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedFile || !form.title) {
      showToast('Please choose a file and give it a title', 'error')
      return
    }

    const meta = addFile({
      title: form.title,
      category: form.category,
      subject: form.subject,
      semester: form.semester,
      description: form.description,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      fileType: selectedFile.type,
      fileName: selectedFile.name,
      favorite: false,
      readProgress: 0,
    })

    await saveFileBlob(meta.id, selectedFile)

    showToast('File uploaded to your library', 'success')
    setForm(EMPTY_FORM)
    setSelectedFile(null)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Upload a file">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium mb-1.5">File (PDF, PPT, PPTX, DOCX, Image)</label>
          <input
            type="file"
            accept=".pdf,.ppt,.pptx,.doc,.docx,image/*"
            onChange={handleFileSelect}
            className="w-full text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-marigold file:text-ink file:text-xs file:font-semibold"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5">Title</label>
          <input
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-paper-line dark:border-ink-soft bg-transparent text-sm outline-none focus:border-marigold"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1.5">Category</label>
            <select
              value={form.category}
              onChange={(e) => update('category', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-paper-line dark:border-ink-soft bg-transparent text-sm outline-none focus:border-marigold"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Semester</label>
            <input
              value={form.semester}
              onChange={(e) => update('semester', e.target.value)}
              placeholder="e.g. Sem 5"
              className="w-full px-3 py-2 rounded-lg border border-paper-line dark:border-ink-soft bg-transparent text-sm outline-none focus:border-marigold"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5">Subject</label>
          <input
            value={form.subject}
            onChange={(e) => update('subject', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-paper-line dark:border-ink-soft bg-transparent text-sm outline-none focus:border-marigold"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5">Tags (comma separated)</label>
          <input
            value={form.tags}
            onChange={(e) => update('tags', e.target.value)}
            placeholder="laplace, unit-2, important"
            className="w-full px-3 py-2 rounded-lg border border-paper-line dark:border-ink-soft bg-transparent text-sm outline-none focus:border-marigold"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-paper-line dark:border-ink-soft bg-transparent text-sm outline-none focus:border-marigold resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Upload</Button>
        </div>
      </form>
    </Modal>
  )
}
