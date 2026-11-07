import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { QuoteCard } from '../components/QuoteCard'
import { StatsRow } from '../components/StatsRow'
import type { Day, User } from '../types'

export function DashboardPage() {
  const [days, setDays] = useState<Day[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get<Day[]>('/days'), api.get<User[]>('/auth/users')])
      .then(([d, u]) => {
        setDays(d)
        setUsers(u)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page-loading">Loading…</div>

  return (
    <div className="page">
      <QuoteCard />
      <StatsRow users={users} />

      <h2 className="section-title">Your split</h2>
      <div className="day-grid">
        {days.map((day) => (
          <Link to={`/day/${day.id}`} key={day.id} className="day-card">
            <div className="day-card-emoji">{day.emoji}</div>
            <div>
              <h3>{day.name}</h3>
              {day.weekday && <p className="muted small">{day.weekday}</p>}
              {day.subtitle && <p className="muted">{day.subtitle}</p>}
              <p className="muted small">{day.exercises.length} exercises</p>
            </div>
          </Link>
        ))}
        {days.length === 0 && <p className="muted">No days yet — add one to get started.</p>}
      </div>
    </div>
  )
}
