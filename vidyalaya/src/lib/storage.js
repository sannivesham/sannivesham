const KEYS = {
  tasks: 'vidyalaya-tasks',
  timetable: 'vidyalaya-timetable',
  fileMeta: 'vidyalaya-file-meta',
  streak: 'vidyalaya-streak',
  dailyGoal: 'vidyalaya-daily-goal',
  studyLog: 'vidyalaya-study-log',
  achievements: 'vidyalaya-achievements',
  pomodoroStats: 'vidyalaya-pomodoro-stats',
  profile: 'vidyalaya-profile',
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export const getTasks = () => read(KEYS.tasks, [])
export const saveTasks = (v) => write(KEYS.tasks, v)

export const getTimetable = () => read(KEYS.timetable, [])
export const saveTimetable = (v) => write(KEYS.timetable, v)

export const getFileMeta = () => read(KEYS.fileMeta, [])
export const saveFileMeta = (v) => write(KEYS.fileMeta, v)

export const getStreak = () =>
  read(KEYS.streak, { current: 0, longest: 0, lastStudyDate: null })
export const saveStreak = (v) => write(KEYS.streak, v)

export const getDailyGoal = () =>
  read(KEYS.dailyGoal, { type: 'hours', target: 3, progressMinutes: 0, date: null })
export const saveDailyGoal = (v) => write(KEYS.dailyGoal, v)

// studyLog: array of { date: 'YYYY-MM-DD', minutes: number }
export const getStudyLog = () => read(KEYS.studyLog, [])
export const saveStudyLog = (v) => write(KEYS.studyLog, v)

export const getAchievements = () => read(KEYS.achievements, [])
export const saveAchievements = (v) => write(KEYS.achievements, v)

export const getPomodoroStats = () =>
  read(KEYS.pomodoroStats, { totalSessions: 0, totalFocusMinutes: 0, todayFocusMinutes: 0, lastSessionDate: null })
export const savePomodoroStats = (v) => write(KEYS.pomodoroStats, v)

export const getProfile = () =>
  read(KEYS.profile, { name: 'Student', email: '', joined: new Date().toISOString() })
export const saveProfile = (v) => write(KEYS.profile, v)
