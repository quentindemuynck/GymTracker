import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function NavBar() {
  const { user, logout } = useAuth()
  if (!user) return null

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-emoji">🏋️</span> GymSplit
      </div>
      <div className="navbar-links">
        <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')} end>
          Home
        </NavLink>
        <NavLink to="/tracker" className={({ isActive }) => (isActive ? 'active' : '')}>
          Tracker
        </NavLink>
      </div>
      <div className="navbar-user">
        <span className="dot" style={{ background: user.color }} />
        {user.displayName}
        <button className="link-btn" onClick={() => logout()}>
          Log out
        </button>
      </div>
    </nav>
  )
}
