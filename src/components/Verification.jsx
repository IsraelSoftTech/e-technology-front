import { useEffect, useState } from 'react'
import './Verification.css'
import api from '../services/api'
import SuccessMessage from './SuccessMessage'
import { FiEye, FiCheckCircle, FiXCircle } from 'react-icons/fi'
import DocumentViewer from './DocumentViewer'

function Verification() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState('')
  const [docSrc, setDocSrc] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      const res = await api.listTeacherApplications()
      setRows(res.applications || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const approve = async (id) => {
    try {
      await api.approveTeacher(id)
      setSuccess('Application approved')
      await load()
    } catch (e) { alert(e.message) }
  }
  const reject = async (id) => {
    const comment = prompt('Rejection reason (optional)') || undefined
    try {
      await api.rejectTeacher(id, comment)
      setSuccess('Application rejected')
      await load()
    } catch (e) { alert(e.message) }
  }

  return (
    <div className="verify">
      <h2>Teacher Verification</h2>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Email</th>
              <th>Submitted</th>
              <th>Status</th>
              <th>Document</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="empty">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan="6" className="empty">No applications yet</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.user_name || r.user_id}</td>
                  <td>{r.user_email || ''}</td>
                  <td>{new Date(r.uploaded_at).toLocaleString()}</td>
                  <td className={`status ${r.review_status}`}>{r.review_status}</td>
                  <td>{r.file_path ? <button className="icon-btn" onClick={()=> setDocSrc(r.file_path)} title="View"><FiEye /></button> : '-'}</td>
                  <td>
                    <button className="icon-btn" title="Approve" onClick={()=> approve(r.id)}><FiCheckCircle /></button>
                    <button className="icon-btn danger" title="Reject" onClick={()=> reject(r.id)}><FiXCircle /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {success && <SuccessMessage message={success} onClose={()=> setSuccess('')} />}
      {docSrc && <DocumentViewer src={docSrc} onClose={()=> setDocSrc('')} />}
    </div>
  )
}

export default Verification


