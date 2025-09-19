import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import { FiEdit2, FiTrash2, FiPauseCircle, FiPlayCircle } from 'react-icons/fi'
import ConfirmModal from './ConfirmModal'
import SuccessMessage from './SuccessMessage'
import './AdminDash.css'

function AdminStudent() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({ total: 0, suspended: 0 })
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmSuspend, setConfirmSuspend] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', email: '' })
  const [success, setSuccess] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [listRes] = await Promise.all([
        api.listUsers(),
      ])
      const all = listRes.users || []
      const students = all.filter(u => u.role !== 'teacher' && u.role !== 'admin')
      const suspended = students.filter(u => u.status === 'disabled').length
      setUsers(students)
      setCounts({ total: students.length, suspended })
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const onDelete = (id) => setConfirmDelete(id)
  const confirmDeleteUser = async () => {
    const id = confirmDelete
    try { await api.deleteUser(id); setConfirmDelete(null); await load(); setSuccess('User deleted') } catch (e) { setConfirmDelete(null) }
  }

  const onSuspend = (id, suspended, name) => setConfirmSuspend({ id, suspended, name })
  const confirmSuspendUser = async () => {
    if (!confirmSuspend) return
    try {
      if (confirmSuspend.suspended) { await api.activateUser(confirmSuspend.id) } else { await api.suspendUser(confirmSuspend.id) }
      setConfirmSuspend(null)
      await load()
      setSuccess(confirmSuspend.suspended ? 'User activated' : 'User suspended')
    } catch (e) { setConfirmSuspend(null) }
  }

  const onEdit = (u) => { setEditTarget(u); setEditForm({ name: u.name || '', email: u.email || '' }) }
  const submitEdit = async (e) => {
    e.preventDefault()
    if (!editTarget) return
    try {
      await api.updateUser(editTarget.id, { name: editForm.name, email: editForm.email })
      setEditTarget(null)
      await load()
      setSuccess('User updated')
    } catch (e) {}
  }

  return (
    <div className="admin-dash">
      <div className="dash-content" style={{ marginTop: '1rem' }}>
        {useMemo(() => ([
          { key: 'all', label: 'Total Students', count: counts.total },
          { key: 'suspended', label: 'Suspended Students', count: counts.suspended },
        ]), [counts]).map(({ key, label, count }) => (
          <div key={key} className="stat-card">
            <div className="stat-count">{count}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="table-wrap" style={{ marginTop: '1rem', overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>S/N</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}>Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6}>No students found</td></tr>
            ) : users.map((u, idx) => {
              const isSuspended = u.status === 'disabled'
              return (
                <tr key={u.id} className={isSuspended ? 'muted' : ''}>
                  <td>{idx + 1}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.status}</td>
                  <td>
                    {u.role === 'admin' ? (
                      <span>-</span>
                    ) : (
                      <>
                        <button className="icon-btn" title="Edit" onClick={() => onEdit(u)}><FiEdit2 /></button>
                        <button className="icon-btn" title="Delete" onClick={() => onDelete(u.id)}><FiTrash2 /></button>
                        <button className="icon-btn" title={isSuspended ? 'Activate' : 'Suspend'} onClick={() => onSuspend(u.id, isSuspended, u.name)}>
                          {isSuspended ? <FiPlayCircle /> : <FiPauseCircle />}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {confirmDelete != null && (
        <ConfirmModal
          title="Delete user?"
          message="This action cannot be undone. The user and related data may be removed."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDeleteUser}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {confirmSuspend && (
        <ConfirmModal
          title={confirmSuspend.suspended ? 'Activate user?' : 'Suspend user?'}
          message={confirmSuspend.suspended ? 'Re-activate this account so the user can log in.' : 'Suspended users cannot log in until re-activated.'}
          confirmText={confirmSuspend.suspended ? 'Activate' : 'Suspend'}
          cancelText="Cancel"
          onConfirm={confirmSuspendUser}
          onCancel={() => setConfirmSuspend(null)}
        />
      )}

      {editTarget && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3 className="modal-title">Edit Student</h3>
            <form onSubmit={submitEdit}>
              <div className="row">
                <label>Name</label>
                <input value={editForm.name} onChange={(e)=> setEditForm(prev=>({ ...prev, name: e.target.value }))} required />
              </div>
              <div className="row">
                <label>Email</label>
                <input type="email" value={editForm.email} onChange={(e)=> setEditForm(prev=>({ ...prev, email: e.target.value }))} required />
              </div>
              <div className="modal-actions" style={{ marginTop: '0.75rem' }}>
                <button type="button" className="modal-btn" onClick={() => setEditTarget(null)}>Cancel</button>
                <button type="submit" className="modal-btn primary">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {success && <SuccessMessage message={success} onClose={() => setSuccess('')} />}
    </div>
  )
}

export default AdminStudent


