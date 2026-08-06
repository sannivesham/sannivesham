import WelcomeBanner from '../components/dashboard/WelcomeBanner.jsx'
import QuickActions from '../components/dashboard/QuickActions.jsx'
import StreakCard from '../components/dashboard/StreakCard.jsx'
import TodayGoal from '../components/dashboard/TodayGoal.jsx'
import ContinueReading from '../components/dashboard/ContinueReading.jsx'
import UpcomingPanel from '../components/dashboard/UpcomingPanel.jsx'

export default function Dashboard() {
  return (
    <div className="max-w-6xl mx-auto">
      <WelcomeBanner />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="flex flex-col gap-6">
          <StreakCard />
          <TodayGoal />
        </div>
        <ContinueReading />
        <QuickActions />
      </div>

      <UpcomingPanel />
    </div>
  )
}
