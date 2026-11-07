import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Stats, User } from '../types'

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [statsByUser, setStatsByUser] = useState<Record<number, Stats>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<User[]>('/auth/users')
      .then((list) => {
        setUsers(list)
        list.forEach((u) => {
          api
            .get<Stats>(`/sessions/stats/${u.id}`)
            .then((s) => setStatsByUser((prev) => ({ ...prev, [u.id]: s })))
            .catch(() => {})
        })
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page-loading">Loading…</div>

  return (
    <div className="page">
      <h1>Users</h1>
      <p className="muted">See everyone's splits and progress. You can copy any of their days or exercises.</p>

      <div className="day-grid">
        {users.map((u) => {
          const s = statsByUser[u.id]
          return (
            <Link to={`/users/${u.id}`} key={u.id} className="day-card user-card">
              <span className="dot user-card-dot" style={{ background: u.color }} />
              <div>
                <h3>{u.displayName}</h3>
                <p className="muted small">
                  {s ? `${s.streak} day streak · ${s.totalSessions} sessions logged` : 'Loading stats…'}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
