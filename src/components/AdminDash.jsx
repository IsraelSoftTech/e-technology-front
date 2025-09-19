import './AdminDash.css'
import { useEffect, useMemo, useState } from 'react'
import Analytics from './Analytics'
import api from '../services/api'

function AdminDash() {
  const [userCount, setUserCount] = useState(0)
  const [teacherCount, setTeacherCount] = useState(0)
  const [studentCount, setStudentCount] = useState(0)
  const [courseCount, setCourseCount] = useState(0)
  const [classCount, setClassCount] = useState(0)
  const [txnCount, setTxnCount] = useState(0)
  const [overview, setOverview] = useState([])
  useEffect(()=>{(async()=>{
    try{const r=await api.usersCount();setUserCount(r.count||0)}catch(e){}
    try{const t=await api.teachersCount();setTeacherCount(t.count||0)}catch(e){}
    try{const s=await api.studentsCount();setStudentCount(s.count||0)}catch(e){}
    try{const c=await api.coursesCount();setCourseCount(c.count||0)}catch(e){}
    try{const cl=await api.classesCount();setClassCount(cl.count||0)}catch(e){}
    try{const tx=await api.transactionsCount();setTxnCount(tx.count||0)}catch(e){}
    try{const ov=await api.overviewMetrics();setOverview(ov.series||[])}catch(e){}
  })()},[])
  return (
    <div className="admin-dash">
      <div className="dash-content">
        {useMemo(() => ([
          { key: 'users', label: 'Users', count: userCount },
          { key: 'students', label: 'Students', count: studentCount },
          { key: 'teachers', label: 'Teachers', count: teacherCount },
          { key: 'courses', label: 'Courses', count: courseCount },
          { key: 'classes', label: 'Classes', count: classCount },
          { key: 'transactions', label: 'Transactions', count: txnCount },
        ]), [userCount, studentCount, teacherCount, courseCount, classCount, txnCount]).map(({ key, label, count }) => (
          <div key={key} className="stat-card">
            <div className="stat-count">{count}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>
      <div className="dash-analytics">
        <Analytics totals={{ Users: userCount, Courses: courseCount, Classes: classCount, Transactions: txnCount }} />
      </div>
    </div>
  )
}

export default AdminDash
