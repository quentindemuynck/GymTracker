import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Stats, User } from '../types'

export function StatsRow({ users }: { users: User[] }) {
  const [statsByUser, setStatsByUser] = useState<Record<number, Stats>>({})

  useEffect(() => {
    users.forEach((u) => {
      api
        .get<Stats>(`/sessions/stats/${u.id}`)
        .then((s) => setStatsByUser((prev) => ({ ...prev, [u.id]: s })))
        .catch(() => {})
    })
  }, [users])

  if (users.length === 0) return null

  return (
    <div className="stats-row">
      {users.map((u) => {
        const s = statsByUser[u.id]
        return (
          <div className="stats-card" key={u.id}>
            <div className="stats-user">
              <span className="dot" style={{ background: u.color }} />
              {u.displayName}
            </div>
            <div className="stats-numbers">
              <div>
                <strong>{s?.streak ?? '–'}</strong>
                <span>day streak</span>
              </div>
              <div>
                <strong>{s?.thisWeek ?? '–'}</strong>
                <span>this week</span>
              </div>
              <div>
                <strong>{s?.totalSessions ?? '–'}</strong>
                <span>total</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
