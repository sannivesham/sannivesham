import { createContext, useContext, useEffect, useState } from 'react'
import * as storage from '../lib/storage.js'
import { isToday, isSameDay, uid } from '../lib/utils.js'

const AppContext = createContext(null)

const BADGE_DEFS = [
  { id: 'first-upload', label: 'First Upload', check: (s) => s.files.length >= 1 },
  { id: 'ten-docs', label: '10 Documents Completed', check: (s) => s.completedCount >= 10 },
  { id: 'fifty-docs', label: '50 Documents Completed', check: (s) => s.completedCount >= 50 },
  { id: 'hundred-docs', label: '100 Documents Completed', check: (s) => s.completedCount >= 100 },
  { id: 'streak-7', label: '7 Day Streak', check: (s) => s.streak.current >= 7 },
  { id: 'streak-30', label: '30 Day Streak', check: (s) => s.streak.current >= 30 },
]

export function AppProvider({ children }) {
  const [tasks, setTasks] = useState(() => storage.getTasks())
  const [timetable, setTimetable] = useState(() => storage.getTimetable())
  const [files, setFiles] = useState(() => storage.getFileMeta())
  const [streak, setStreak] = useState(() => storage.getStreak())
  const [dailyGoal, setDailyGoal] = useState(() => storage.getDailyGoal())
  const [studyLog, setStudyLog] = useState(() => storage.getStudyLog())
  const [achievements, setAchievements] = useState(() => storage.getAchievements())
  const [pomodoroStats, setPomodoroStats] = useState(() => storage.getPomodoroStats())
  const [profile, setProfile] = useState(() => storage.getProfile())

  useEffect(() => storage.saveTasks(tasks), [tasks])
  useEffect(() => storage.saveTimetable(timetable), [timetable])
  useEffect(() => storage.saveFileMeta(files), [files])
  useEffect(() => storage.saveStreak(streak), [streak])
  useEffect(() => storage.saveDailyGoal(dailyGoal), [dailyGoal])
  useEffect(() => storage.saveStudyLog(studyLog), [studyLog])
  useEffect(() => storage.saveAchievements(achievements), [achievements])
  useEffect(() => storage.savePomodoroStats(pomodoroStats), [pomodoroStats])
  useEffect(() => storage.saveProfile(profile), [profile])

  // reset daily goal progress if the stored date isn't today
  useEffect(() => {
    if (!dailyGoal.date || !isToday(dailyGoal.date)) {
      setDailyGoal((g) => ({ ...g, progressMinutes: 0, date: new Date().toISOString() }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // reset today's pomodoro focus minutes if stale
  useEffect(() => {
    if (!pomodoroStats.lastSessionDate || !isToday(pomodoroStats.lastSessionDate)) {
      setPomodoroStats((s) => ({ ...s, todayFocusMinutes: 0 }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function recordStudyMinutes(minutes) {
    const today = new Date().toISOString().slice(0, 10)

    setStudyLog((log) => {
      const idx = log.findIndex((l) => l.date === today)
      if (idx === -1) return [...log, { date: today, minutes }]
      const copy = [...log]
      copy[idx] = { ...copy[idx], minutes: copy[idx].minutes + minutes }
      return copy
    })

    setDailyGoal((g) => ({ ...g, progressMinutes: (g.progressMinutes || 0) + minutes, date: new Date().toISOString() }))

    setStreak((prev) => {
      if (prev.lastStudyDate && isSameDay(prev.lastStudyDate, new Date())) {
        return prev
      }
      const wasYesterday =
        prev.lastStudyDate &&
        isSameDay(new Date(prev.lastStudyDate).getTime() + 86400000, new Date())
      const current = wasYesterday ? prev.current + 1 : 1
      return {
        current,
        longest: Math.max(prev.longest, current),
        lastStudyDate: new Date().toISOString(),
      }
    })
  }

  function markFileStatus(fileId, status) {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, status, lastOpened: new Date().toISOString() } : f)),
    )
  }

  function addFile(meta) {
    const file = { id: uid(), status: 'Not Started', uploadedAt: new Date().toISOString(), ...meta }
    setFiles((prev) => [file, ...prev])
    return file
  }

  function removeFile(fileId) {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  // check + unlock achievements whenever relevant state changes
  useEffect(() => {
    const completedCount = files.filter((f) => f.status === 'Completed').length
    const snapshot = { files, streak, completedCount }
    const newlyUnlocked = BADGE_DEFS.filter(
      (b) => b.check(snapshot) && !achievements.includes(b.id),
    ).map((b) => b.id)

    if (newlyUnlocked.length > 0) {
      setAchievements((prev) => [...prev, ...newlyUnlocked])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, streak])

  const value = {
    tasks, setTasks,
    timetable, setTimetable,
    files, setFiles, addFile, removeFile, markFileStatus,
    streak, setStreak,
    dailyGoal, setDailyGoal,
    studyLog, setStudyLog, recordStudyMinutes,
    achievements, BADGE_DEFS,
    pomodoroStats, setPomodoroStats,
    profile, setProfile,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
