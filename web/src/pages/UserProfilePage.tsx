import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Day, Stats, User } from '../types'

export function UserProfilePage() {
  const { id } = useParams()
  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [days, setDays] = useState<Day[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get<User[]>('/auth/users').then((list) => list.find((u) => String(u.id) === id) ?? null),
      api.get<Day[]>(`/days/user/${id}`),
      api.get<Stats>(`/sessions/stats/${id}`),
    ])
      .then(([u, d, s]) => {
        setProfileUser(u)
        setDays(d)
        setStats(s)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="page-loading">Loading…</div>
  if (!profileUser) return <div className="page">User not found.</div>

  return (
    <div className="page">
      <Link to="/users" className="back-link">
        ← Back to Users
      </Link>
      <div className="day-header">
        <span className="dot" style={{ background: profileUser.color, width: 20, height: 20 }} />
        <div>
          <h1>{profileUser.displayName}</h1>
          {stats && (
            <p className="muted small">
              {stats.streak} day streak · {stats.thisWeek} this week · {stats.totalSessions} total sessions
            </p>
          )}
        </div>
      </div>

      <h2 className="section-title">{profileUser.displayName}'s split</h2>
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
        {days.length === 0 && <p className="muted">{profileUser.displayName} hasn't built a split yet.</p>}
      </div>
    </div>
  )
}
