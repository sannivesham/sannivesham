import { useMemo } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts'
import Card from '../common/Card.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { addDays } from '../../lib/utils.js'

const COLORS = ['#E3A008', '#5C8374', '#B23A2E', '#3B6EA5', '#8B5CF6', '#F4C24B', '#7FA695']

export default function AnalyticsCharts() {
  const { studyLog, files } = useApp()

  const weeklyData = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = addDays(new Date(), -i)
      const key = d.toISOString().slice(0, 10)
      const entry = studyLog.find((l) => l.date === key)
      days.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        minutes: entry ? entry.minutes : 0,
      })
    }
    return days
  }, [studyLog])

  const categoryData = useMemo(() => {
    const counts = {}
    files.forEach((f) => {
      counts[f.category] = (counts[f.category] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [files])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <h3 className="font-display text-sm font-semibold mb-4">This Week&rsquo;s Study Minutes</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#141B2E', border: 'none', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#FAF6EE' }}
              itemStyle={{ color: '#F4C24B' }}
            />
            <Bar dataKey="minutes" fill="#E3A008" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h3 className="font-display text-sm font-semibold mb-4">Library by Category</h3>
        {categoryData.length === 0 ? (
          <p className="text-sm text-ink/50 dark:text-paper/50 py-16 text-center">Upload files to see this chart.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {categoryData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#141B2E', border: 'none', borderRadius: 8, fontSize: 12 }} itemStyle={{ color: '#FAF6EE' }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  )
}
