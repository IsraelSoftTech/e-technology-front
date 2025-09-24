import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import { FiExternalLink, FiXCircle } from 'react-icons/fi'
import SuccessMessage from './SuccessMessage'
import './AdminDash.css'

function AdminClass() {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({ total: 0, ongoing: 0 })
  const [processing, setProcessing] = useState({})
  const [success, setSuccess] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const allRes = await api.listAllClasses()
      const list = allRes.classes || []
      setClasses(list)
      const ongoing = list.filter(c => {
        const now = Date.now()
        const start = c.start_time ? new Date(c.start_time).getTime() : 0
        const end = c.end_time ? new Date(c.end_time).getTime() : Infinity
        return c.status !== 'cancelled' && start <= now && end > now
      }).length
      setCounts({ total: list.length, ongoing })
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const isOngoing = (cls) => {
    const now = Date.now()
    const start = cls.start_time ? new Date(cls.start_time).getTime() : 0
    const end = cls.end_time ? new Date(cls.end_time).getTime() : Infinity
    return cls.status !== 'cancelled' && start <= now && end > now
  }

  return (
    <div className="admin-dash">
      <div className="dash-content">
        {useMemo(() => ([
          { key: 'classes', label: 'Total Classes', count: counts.total },
          { key: 'ongoing', label: 'Ongoing Now', count: counts.ongoing },
        ]), [counts]).map(({ key, label, count }) => (
          <div key={key} className="stat-card">
            <div className="stat-count">{count}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="table-wrap" style={{ marginTop: '1rem' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Teacher</th>
              <th>Start</th>
              <th>End</th>
              <th>Status</th>
              <th>Objective</th>
              <th>Join</th>
              <th>Cancel</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8}>Loading...</td></tr>
            ) : classes.length === 0 ? (
              <tr><td colSpan={8}>No classes</td></tr>
            ) : (
              classes.map(cls => (
                <tr key={cls.id} className={isOngoing(cls) ? '' : 'muted'}>
                  <td>{cls.course_title || cls.course_id}</td>
                  <td>{cls.teacher_name || cls.teacher_id}</td>
                  <td>{cls.start_time ? new Date(cls.start_time).toLocaleString() : '-'}</td>
                  <td>{cls.end_time ? new Date(cls.end_time).toLocaleString() : '-'}</td>
                  <td>{cls.status}</td>
                  <td>{cls.objective || '-'}</td>
                  <td>
                    {cls.meet_link && !String(cls.meet_link).startsWith('custom:') ? (
                      <a href={cls.meet_link} target="_blank" rel="noreferrer" className="icon-btn" title="Join">
                        <FiExternalLink />
                      </a>
                    ) : (
                      <button className="icon-btn" title="Join" onClick={()=> window.open(`/dashboard/classes/${encodeURIComponent(cls.course_id)}`, '_self')}>
                        <FiExternalLink />
                      </button>
                    )}
                  </td>
                  <td>
                    <button
                      className="icon-btn danger"
                      title="Cancel class"
                      disabled={!!processing[cls.id]}
                      onClick={async ()=>{
                        try{
                          setProcessing(prev=> ({ ...prev, [cls.id]: true }))
                          await api.cancelCourseClass(cls.course_id, cls.id)
                          setSuccess('Class cancelled')
                          await load()
                        }catch(e){} finally{
                          setProcessing(prev=> ({ ...prev, [cls.id]: false }))
                        }
                      }}
                    >
                      <FiXCircle />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {success && (
        <SuccessMessage
          message={success}
          onClose={() => setSuccess('')}
        />
      )}
    </div>
  )
}

export default AdminClass


