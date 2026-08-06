import { useApp } from '../context/AppContext.jsx'

// Thin convenience wrapper around the streak data + recording function
// already provided by AppContext, kept as its own hook so components
// don't need to know it lives on the shared app context.
export function useStreak() {
  const { streak, recordStudyMinutes } = useApp()
  return { streak, recordStudyMinutes }
}
