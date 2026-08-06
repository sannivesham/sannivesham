import { useEffect, useMemo, useState } from 'react'
import { FileText } from 'lucide-react'
import ReaderToolbar from './ReaderToolbar.jsx'
import NotesPanel from './NotesPanel.jsx'
import BookmarkList from './BookmarkList.jsx'
import ProgressBar from '../common/ProgressBar.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { getFileBlob, addBookmark } from '../../lib/db.js'
import { uid, percent } from '../../lib/utils.js'

const MOCK_TOTAL_PAGES = 24 // used when we can't introspect real page count client-side

export default function DocumentReader({ file }) {
  const { markFileStatus, setFiles } = useApp()
  const { showToast } = useToast()
  const [blobUrl, setBlobUrl] = useState(null)
  const [page, setPage] = useState(1)
  const [zoom, setZoom] = useState(100)
  const [tab, setTab] = useState('notes')

  const totalPages = MOCK_TOTAL_PAGES
  const isImage = file.fileType?.startsWith('image/')
  const isPdf = file.fileType === 'application/pdf'

  useEffect(() => {
    let currentUrl
    getFileBlob(file.id).then((blob) => {
      if (blob) {
        currentUrl = URL.createObjectURL(blob)
        setBlobUrl(currentUrl)
      }
    })
    return () => currentUrl && URL.revokeObjectURL(currentUrl)
  }, [file.id])

  useEffect(() => {
    if (file.status === 'Not Started') markFileStatus(file.id, 'Reading')
  }, [file.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const progress = percent(page, totalPages)
    setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, readProgress: progress, lastPage: page } : f)))
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  function goToPage(p) {
    setPage(Math.min(Math.max(p, 1), totalPages))
  }

  async function handleBookmark() {
    await addBookmark({ id: uid(), fileId: file.id, page, createdAt: new Date().toISOString() })
    showToast(`Bookmarked page ${page}`, 'success')
  }

  function handleMarkComplete() {
    markFileStatus(file.id, file.status === 'Completed' ? 'Reading' : 'Completed')
    showToast(file.status === 'Completed' ? 'Marked as reading' : 'Marked as completed', 'success')
  }

  function handleDownload() {
    if (!blobUrl) return
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = file.fileName || file.title
    a.click()
  }

  function handleShare() {
    navigator.clipboard?.writeText(window.location.href)
    showToast('Link copied to clipboard', 'success')
  }

  function handleFullscreen() {
    document.getElementById('reader-viewport')?.requestFullscreen?.()
  }

  const viewerContent = useMemo(() => {
    if (!blobUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-ink/40 dark:text-paper/40">
          <FileText size={32} strokeWidth={1.5} />
          <p className="text-sm mt-2">Preparing preview…</p>
        </div>
      )
    }
    if (isImage) {
      return <img src={blobUrl} alt={file.title} className="max-w-full max-h-full object-contain" style={{ transform: `scale(${zoom / 100})` }} />
    }
    if (isPdf) {
      return <iframe title={file.title} src={`${blobUrl}#page=${page}`} className="w-full h-full border-0" />
    }
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 text-ink/50 dark:text-paper/50">
        <FileText size={32} strokeWidth={1.5} className="mb-2" />
        <p className="text-sm">Preview isn&rsquo;t available for this file type in-browser.</p>
        <p className="text-xs mt-1">Use Download to open it in the right app.</p>
      </div>
    )
  }, [blobUrl, isImage, isPdf, page, zoom, file.title])

  return (
    <div>
      <ReaderToolbar
        page={page}
        totalPages={totalPages}
        onPrev={() => goToPage(page - 1)}
        onNext={() => goToPage(page + 1)}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(z + 10, 200))}
        onZoomOut={() => setZoom((z) => Math.max(z - 10, 50))}
        onFullscreen={handleFullscreen}
        onBookmark={handleBookmark}
        onDownload={handleDownload}
        onShare={handleShare}
        onMarkComplete={handleMarkComplete}
        isCompleted={file.status === 'Completed'}
      />

      <ProgressBar value={percent(page, totalPages)} className="mb-4" />

      <div
        id="reader-viewport"
        className="bg-white dark:bg-ink-light border border-paper-line dark:border-ink-soft rounded-card h-[55vh] md:h-[65vh] flex items-center justify-center overflow-auto mb-6"
      >
        {viewerContent}
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('notes')}
          className={`text-xs font-medium px-3 py-1.5 rounded-full border ${tab === 'notes' ? 'bg-ink text-paper dark:bg-paper dark:text-ink border-ink dark:border-paper' : 'border-paper-line dark:border-ink-soft text-ink/60 dark:text-paper/60'}`}
        >
          Notes
        </button>
        <button
          onClick={() => setTab('bookmarks')}
          className={`text-xs font-medium px-3 py-1.5 rounded-full border ${tab === 'bookmarks' ? 'bg-ink text-paper dark:bg-paper dark:text-ink border-ink dark:border-paper' : 'border-paper-line dark:border-ink-soft text-ink/60 dark:text-paper/60'}`}
        >
          Bookmarks
        </button>
      </div>

      {tab === 'notes' ? (
        <NotesPanel fileId={file.id} />
      ) : (
        <BookmarkList fileId={file.id} onJump={goToPage} />
      )}
    </div>
  )
}
