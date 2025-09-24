import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import './AdminDash.css'
import { FiTrash2 } from 'react-icons/fi'

function AdminActivity() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ action: '', entityType: '' })

  const load = async () => {
    setLoading(true)
    try{
      const r = await api.listActivity({ action: filters.action || undefined, entityType: filters.entityType || undefined, limit: 200 })
      setLogs(r.logs || [])
    }catch(e){} finally{
      setLoading(false)
    }
  }

  useEffect(()=>{ load() }, [filters.action, filters.entityType])

  const actions = useMemo(()=> Array.from(new Set((logs||[]).map(l=> l.action))).sort(), [logs])
  const entities = useMemo(()=> Array.from(new Set((logs||[]).map(l=> l.entity_type))).sort(), [logs])

  return (
    <div className="admin-dash">
      <div className="dash-content">
        <div className="stat-card" style={{ padding:'1rem', display:'flex', gap:'1rem', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', gap:'1rem', alignItems:'center' }}>
            <div>
              <div className="stat-label">Action</div>
              <select value={filters.action} onChange={e=> setFilters(prev=> ({ ...prev, action: e.target.value }))}>
                <option value="">All</option>
                {actions.map(a=> <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <div className="stat-label">Entity</div>
              <select value={filters.entityType} onChange={e=> setFilters(prev=> ({ ...prev, entityType: e.target.value }))}>
                <option value="">All</option>
                {entities.map(t=> <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button className="icon-btn" onClick={load}>Refresh</button>
          </div>
          <button
            className="icon-btn danger"
            title="Clear all activity logs"
            onClick={async ()=>{ try{ await api.clearActivity(); await load() } catch(e){} }}
          >
            <FiTrash2 />
          </button>
        </div>
      </div>

      <div className="table-wrap" style={{ marginTop:'1rem' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Role</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}>Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6}>No activity</td></tr>
            ) : logs.map(l => (
              <tr key={l.id}>
                <td>{new Date(l.ts).toLocaleString()}</td>
                <td>{l.actor_role || '-'}</td>
                <td>{l.action}</td>
                <td>{l.entity_type}#{l.entity_id}</td>
                <td><pre style={{ margin:0, whiteSpace:'pre-wrap' }}>{l.details ? JSON.stringify(l.details) : '-'}</pre></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminActivity


