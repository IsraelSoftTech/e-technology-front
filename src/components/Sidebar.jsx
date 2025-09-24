import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { FiMenu, FiGrid, FiBookOpen, FiCalendar, FiUsers, FiUserCheck, FiShield, FiCheckSquare, FiCreditCard, FiSettings, FiX, FiActivity } from 'react-icons/fi'
import './Sidebar.css'

const ALL_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: FiGrid, roles: ['admin','teacher','student'] },
  { key: 'courses', label: 'Courses', icon: FiBookOpen, roles: ['admin','teacher','student'] },
  { key: 'classes', label: 'Classes', icon: FiCalendar, roles: ['admin','teacher','student'] },
  { key: 'students', label: 'Students', icon: FiUsers, roles: ['admin','teacher'] },
  { key: 'teachers', label: 'Teachers', icon: FiUserCheck, roles: ['admin'] },
  { key: 'users', label: 'Users', icon: FiUsers, roles: ['admin'] },
  { key: 'verification', label: 'Verification', icon: FiShield, roles: ['admin'] },
  { key: 'attendance', label: 'Attendance', icon: FiCheckSquare, roles: ['admin','teacher'] },
  { key: 'transactions', label: 'Transactions', icon: FiCreditCard, roles: ['admin'] },
  { key: 'activity', label: 'Activity Logs', icon: FiActivity, roles: ['admin'] },
  { key: 'settings', label: 'Settings', icon: FiSettings, roles: ['admin','teacher','student'] },
]

function Sidebar({ role = 'admin' }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { logout, user } = useAuth()
  const items = ALL_ITEMS.filter(i => i.roles.includes(role))

  return (
    <>
      <button className="sidebar-toggle" aria-label="Open menu" onClick={() => setOpen(true)}>
        <FiMenu size={22} />
      </button>

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-title">
            <span className="avatar-mini">{(user?.username || '').slice(0,2).toUpperCase()}</span>
            Menu
          </span>
          <button className="sidebar-close" aria-label="Close menu" onClick={() => setOpen(false)}>
            <FiX size={20} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {items.map(({ key, label, icon: Icon }) => {
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
            {items.map(({ key, label, icon: Icon }) => {
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

export default Sidebar
