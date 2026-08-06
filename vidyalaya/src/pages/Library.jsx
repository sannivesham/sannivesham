import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Upload } from 'lucide-react'
import CategoryFilter from '../components/library/CategoryFilter.jsx'
import SearchBar from '../components/library/SearchBar.jsx'
import LibraryGrid from '../components/library/LibraryGrid.jsx'
import UploadModal from '../components/library/UploadModal.jsx'
import Button from '../components/common/Button.jsx'
import { useApp } from '../context/AppContext.jsx'

export default function Library() {
  const { files } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const [category, setCategory] = useState(searchParams.get('filter') === 'favorites' ? 'Favorites' : 'All')
  const [query, setQuery] = useState('')
  const [uploadOpen, setUploadOpen] = useState(searchParams.get('upload') === '1')

  useEffect(() => {
    if (searchParams.get('upload') || searchParams.get('filter')) {
      setSearchParams({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    return files.filter((f) => {
      const matchesCategory =
        category === 'All' || (category === 'Favorites' ? f.favorite : f.category === category)
      const q = query.toLowerCase()
      const matchesQuery =
        !q ||
        f.title.toLowerCase().includes(q) ||
        f.subject?.toLowerCase().includes(q) ||
        f.tags?.some((t) => t.toLowerCase().includes(q))
      return matchesCategory && matchesQuery
    })
  }, [files, category, query])

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-2xl font-semibold">Study Library</h1>
        <Button icon={Upload} onClick={() => setUploadOpen(true)}>Upload File</Button>
      </div>

      <SearchBar value={query} onChange={setQuery} />
      <CategoryFilter active={category} onChange={setCategory} />
      <LibraryGrid files={filtered} onUploadClick={() => setUploadOpen(true)} />

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  )
}
