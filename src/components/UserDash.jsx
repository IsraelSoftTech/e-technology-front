import './UserDash.css'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import './AdminDash.css'
import Analytics from './Analytics'

function UserDash() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])

  useEffect(()=>{(async()=>{
    try{
      if (user?.role === 'teacher'){
        const r = await api.listAssignedCourses(user.id)
        setCourses(r.courses||[])
      }
    }catch(err){ console.warn('Failed to load assigned courses', err) }
  })()},[user])

  const isTeacher = user?.role === 'teacher'

  return (
    <div className="admin-dash">
      <div className="dash-content">
        <div className="stat-card">
          <div className="stat-count">{isTeacher ? courses.length : 0}</div>
          <div className="stat-label">{isTeacher ? 'Assigned Courses' : 'Courses'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-count">0</div>
          <div className="stat-label">Upcoming Classes</div>
        </div>
        <div className="stat-card">
          <div className="stat-count">0</div>
          <div className="stat-label">Notifications</div>
        </div>
      </div>
      <div className="dash-analytics">
        <Analytics totals={{ Users: isTeacher ? courses.length : 0, Courses: isTeacher ? courses.length : 0, Classes: 0, Transactions: 0 }} />
      </div>
    </div>
  )
}

export default UserDash
