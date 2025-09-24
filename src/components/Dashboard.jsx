import { useAuth } from '../contexts/AuthContext'
import Logo from './Logo'
import AdminDash from './AdminDash'
import UserDash from './UserDash'
import UserCourses from './UserCourses'
import UserClass from './UserClass'
import AdminCourse from './AdminCourse'
import AdminClass from './AdminClass'
import UserManagement from './UserManagement'
import Verification from './Verification'
import Teachers from './Teachers'
import Users from './Users'
import AdminStudent from './AdminStudent'
import AdminTransactions from './AdminTransactions'
import Settings from './Settings'
import AdminActivity from './AdminActivity'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import UserSide from './UserSide'
import './Dashboard.css'

function Dashboard() {
  const { user } = useAuth()

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <Logo />
          <div className="user-info">
            <div className="avatar" title={user.username}>
              {(user?.username || '').slice(0,2).toUpperCase()}
            </div>
          </div>
        </div>
      </header>
      
      {user.role === 'admin' ? <Sidebar role="admin" /> : <UserSide />}
      <main className="dashboard-main">
        {user.role === 'admin' ? (
          <Routes>
            <Route path="/" element={<AdminDash />} />
            <Route path="/courses" element={<AdminCourse />} />
            <Route path="/classes" element={<AdminClass />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/students" element={<AdminStudent />} />
            <Route path="/transactions" element={<AdminTransactions />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/activity" element={<AdminActivity />} />
            <Route path="/users" element={<Users />} />
            <Route path="/verification" element={<Verification />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/" element={<UserDash />} />
            <Route path="/account" element={<UserManagement user={user} />} />
            <Route path="/courses" element={<UserCourses />} />
            <Route path="/classes" element={<UserClass />} />
            <Route path="/classes/:courseId" element={<UserClass />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>
    </div>
  )
}

export default Dashboard
