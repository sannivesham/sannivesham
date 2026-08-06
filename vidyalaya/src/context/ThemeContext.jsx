import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

const THEMES = ['light', 'dark']
const ACCENTS = ['marigold', 'sage', 'rust']

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('vidyalaya-theme') || 'light',
  )
  const [accent, setAccent] = useState(
    () => localStorage.getItem('vidyalaya-accent') || 'marigold',
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('vidyalaya-theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent)
    localStorage.setItem('vidyalaya-accent', accent)
  }, [accent])

  function toggleTheme() {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, toggleTheme, accent, setAccent, THEMES, ACCENTS }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
