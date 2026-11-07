import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Logo } from './Logo'

export function NavBar() {
  const { user, logout } = useAuth()
  if (!user) return null

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Logo size={24} /> Gym Tracker
      </div>
      <div className="navbar-links">
        <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')} end>
          Home
        </NavLink>
        <NavLink to="/tracker" className={({ isActive }) => (isActive ? 'active' : '')}>
          Tracker
        </NavLink>
        <NavLink to="/users" className={({ isActive }) => (isActive ? 'active' : '')}>
          Users
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
