import { Library as LibraryIcon } from 'lucide-react'
import FileCard from './FileCard.jsx'
import EmptyState from '../common/EmptyState.jsx'
import Button from '../common/Button.jsx'
import { Upload } from 'lucide-react'

export default function LibraryGrid({ files, onUploadClick }) {
  if (files.length === 0) {
    return (
      <EmptyState
        icon={LibraryIcon}
        title="Your library is empty"
        description="Upload your first study material to get started."
        action={
          <Button icon={Upload} onClick={onUploadClick}>
            Upload File
          </Button>
        }
      />
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {files.map((file) => (
        <FileCard key={file.id} file={file} />
      ))}
    </div>
  )
}
