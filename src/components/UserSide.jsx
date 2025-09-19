import { Link, useLocation } from 'react-router-dom'
import { FiMenu, FiGrid, FiBookOpen, FiCalendar, FiUser, FiCreditCard, FiX } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'
import './Sidebar.css'

const USER_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: FiGrid },
  { key: 'courses', label: 'Courses', icon: FiBookOpen },
  { key: 'classes', label: 'Classes', icon: FiCalendar },
  { key: 'account', label: 'Account', icon: FiUser },
  { key: 'payments', label: 'Payments', icon: FiCreditCard },
]

function UserSide() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { logout } = useAuth()

  return (
    <>
      <button className="sidebar-toggle" aria-label="Open menu" onClick={() => setOpen(true)}>
        <FiMenu size={22} />
      </button>

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-title">Menu</span>
          <button className="sidebar-close" aria-label="Close menu" onClick={() => setOpen(false)}>
            <FiX size={20} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {USER_ITEMS.map(({ key, label, icon: Icon }) => {
            const to = key === 'dashboard' ? '/dashboard/' : `/dashboard/${key}`
            const active = key === 'dashboard' ? (location.pathname === '/dashboard' || location.pathname === '/dashboard/') : location.pathname.startsWith(`/dashboard/${key}`)
            return (
              <Link key={key} to={to} className={`sidebar-link ${active ? 'active' : ''}`} onClick={() => setOpen(false)}>
                <Icon className="icon" />
                <span>{label}</span>
              </Link>
            )
          })}
          <button className="sidebar-link logout" onClick={() => { logout(); setOpen(false) }}>
            <FiX className="icon" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      <div className={`sidebar-desktop`}>
        <div className="sidebar-inner">
          <nav className="sidebar-nav">
            {USER_ITEMS.map(({ key, label, icon: Icon }) => {
              const to = key === 'dashboard' ? '/dashboard/' : `/dashboard/${key}`
              const active = key === 'dashboard' ? (location.pathname === '/dashboard' || location.pathname === '/dashboard/') : location.pathname.startsWith(`/dashboard/${key}`)
              return (
                <Link key={key} to={to} className={`sidebar-link ${active ? 'active' : ''}`}>
                  <Icon className="icon" />
                  <span>{label}</span>
                </Link>
              )
            })}
            <button className="sidebar-link logout" onClick={logout}>
              <FiX className="icon" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </div>
    </>
  )
}

export default UserSide


