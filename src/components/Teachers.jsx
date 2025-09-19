import { useEffect, useMemo, useState } from 'react'
import './Teachers.css'
import api from '../services/api'

function Teachers() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{(async()=>{try{setLoading(true);const r=await api.listApprovedTeachers();setRows(r.teachers||[])}catch(e){console.error(e)}finally{setLoading(false)}})()},[])

  const counts = useMemo(()=>{
    const total = rows.length
    const unassigned = rows.filter(r => (r.assigned_count||0) === 0).length
    return { total, unassigned }
  }, [rows])

  return (
    <div className="teachers">
      <div className="grid">
        <div className="info-card"><h3>Total Teachers</h3><div className="num">{counts.total}</div></div>
        <div className="info-card"><h3>Unassigned Teachers</h3><div className="num">{counts.unassigned}</div></div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Course(s)</th>
              <th>Assign status</th>
              <th>Payment status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" className="empty">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan="4" className="empty">No teachers yet</td></tr>
            ) : (
              rows.map(t => (
                <tr key={t.user_id}>
                  <td>{t.name}</td>
                  <td>{t.admin_comment?.replace('Courses:','').trim() || '-'}</td>
                  <td>{(t.assigned_count||0) > 0 ? 'Assigned' : 'Unassigned'}</td>
                  <td>-</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Teachers


