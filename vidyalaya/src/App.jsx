import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar.jsx'
import Topbar from './components/layout/Topbar.jsx'
import MobileNav from './components/layout/MobileNav.jsx'

import Dashboard from './pages/Dashboard.jsx'
import Library from './pages/Library.jsx'
import Reader from './pages/Reader.jsx'
import Timetable from './pages/Timetable.jsx'
import CalendarPage from './pages/Calendar.jsx'
import Tasks from './pages/Tasks.jsx'
import Pomodoro from './pages/Pomodoro.jsx'
import Analytics from './pages/Analytics.jsx'
import Achievements from './pages/Achievements.jsx'
import Profile from './pages/Profile.jsx'
import Settings from './pages/Settings.jsx'

export default function App() {
  return (
    <div className="min-h-screen flex bg-paper dark:bg-ink transition-colors">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />

        <main className="flex-1 px-4 md:px-8 py-6 pb-24 md:pb-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/library" element={<Library />} />
            <Route path="/reader/:fileId" element={<Reader />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/pomodoro" element={<Pomodoro />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>

      <MobileNav />
    </div>
  )
}
