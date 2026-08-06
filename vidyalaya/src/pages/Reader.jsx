import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import DocumentReader from '../components/reader/DocumentReader.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import { useApp } from '../context/AppContext.jsx'

export default function Reader() {
  const { fileId } = useParams()
  const navigate = useNavigate()
  const { files } = useApp()
  const file = files.find((f) => f.id === fileId)

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/library')}
        className="flex items-center gap-1.5 text-sm text-ink/60 dark:text-paper/60 hover:text-marigold-dark mb-4"
      >
        <ArrowLeft size={15} />
        Back to Library
      </button>

      {!file ? (
        <EmptyState title="File not found" description="It may have been removed from your library." />
      ) : (
        <>
          <h1 className="font-display text-xl font-semibold mb-1">{file.title}</h1>
          <p className="text-sm text-ink/50 dark:text-paper/50 mb-5">
            {file.category}{file.subject ? ` · ${file.subject}` : ''}
          </p>
          <DocumentReader file={file} />
        </>
      )}
    </div>
  )
}
