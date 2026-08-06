import {
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize,
  Bookmark, Download, Share2, CheckCircle2,
} from 'lucide-react'
import Button from '../common/Button.jsx'

export default function ReaderToolbar({
  page, totalPages, onPrev, onNext, zoom, onZoomIn, onZoomOut,
  onFullscreen, onBookmark, onDownload, onShare, onMarkComplete, isCompleted,
}) {
  return (
    <div className="flex items-center justify-between gap-2 flex-wrap px-4 py-2.5 rounded-lg border border-paper-line dark:border-ink-soft mb-4">
      <div className="flex items-center gap-1">
        <button onClick={onPrev} className="p-1.5 rounded-md hover:bg-ink/5 dark:hover:bg-paper/10" aria-label="Previous page">
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs font-mono px-2 tabular-nums">
          {page} / {totalPages}
        </span>
        <button onClick={onNext} className="p-1.5 rounded-md hover:bg-ink/5 dark:hover:bg-paper/10" aria-label="Next page">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={onZoomOut} className="p-1.5 rounded-md hover:bg-ink/5 dark:hover:bg-paper/10" aria-label="Zoom out">
          <ZoomOut size={15} />
        </button>
        <span className="text-xs font-mono w-10 text-center">{zoom}%</span>
        <button onClick={onZoomIn} className="p-1.5 rounded-md hover:bg-ink/5 dark:hover:bg-paper/10" aria-label="Zoom in">
          <ZoomIn size={15} />
        </button>
        <button onClick={onFullscreen} className="p-1.5 rounded-md hover:bg-ink/5 dark:hover:bg-paper/10" aria-label="Fullscreen">
          <Maximize size={15} />
        </button>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={onBookmark} className="p-1.5 rounded-md hover:bg-ink/5 dark:hover:bg-paper/10" aria-label="Bookmark this page">
          <Bookmark size={15} />
        </button>
        <button onClick={onDownload} className="p-1.5 rounded-md hover:bg-ink/5 dark:hover:bg-paper/10" aria-label="Download">
          <Download size={15} />
        </button>
        <button onClick={onShare} className="p-1.5 rounded-md hover:bg-ink/5 dark:hover:bg-paper/10" aria-label="Share">
          <Share2 size={15} />
        </button>
        <Button
          size="sm"
          variant={isCompleted ? 'secondary' : 'primary'}
          icon={CheckCircle2}
          onClick={onMarkComplete}
          className="ml-1"
        >
          {isCompleted ? 'Completed' : 'Mark Complete'}
        </Button>
      </div>
    </div>
  )
}
