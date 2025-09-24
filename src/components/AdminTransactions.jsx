import { useEffect, useState } from 'react'
import './AdminTransactions.css'
import { FiCheck, FiX, FiRefreshCw } from 'react-icons/fi'
import api from '../services/api'
import SuccessMessage from './SuccessMessage'

function AdminTransactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState({})
  const [confirmedTotal, setConfirmedTotal] = useState(0)

  const loadTransactions = async () => {
    try {
      setLoading(true)
      const [response, totalRes] = await Promise.all([
        api.getPendingTransactions(),
        api.confirmedTransactionsAmount(),
      ])
      if (response.success) {
        setTransactions(response.transactions || [])
      } else {
        setError('Failed to load transactions')
      }
      setConfirmedTotal(Number(totalRes.amount || 0))
    } catch (err) {
      setError(err.message || 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTransactions()
  }, [])

  const handleApprove = async (enrollmentId) => {
    try {
      setProcessing(prev => ({ ...prev, [enrollmentId]: 'approving' }))
      const response = await api.approveTransaction(enrollmentId)
      
      if (response.success) {
        setSuccess('Transaction approved successfully!')
        await loadTransactions() // keep all transactions visible
      } else {
        setError(response.error || 'Failed to approve transaction')
      }
    } catch (err) {
      setError(err.message || 'Failed to approve transaction')
    } finally {
      setProcessing(prev => ({ ...prev, [enrollmentId]: null }))
    }
  }

  const handleReject = async (enrollmentId) => {
    try {
      setProcessing(prev => ({ ...prev, [enrollmentId]: 'rejecting' }))
      const response = await api.rejectTransaction(enrollmentId)
      
      if (response.success) {
        setSuccess('Transaction rejected successfully!')
        await loadTransactions() // keep all transactions visible
      } else {
        setError(response.error || 'Failed to reject transaction')
      }
    } catch (err) {
      setError(err.message || 'Failed to reject transaction')
    } finally {
      setProcessing(prev => ({ ...prev, [enrollmentId]: null }))
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="admin-transactions">
      <div className="admin-transactions-header">
        <h2>Transaction Management</h2>
        <button 
          className="admin-transactions-btn refresh" 
          onClick={loadTransactions}
          disabled={loading}
        >
          <FiRefreshCw className={loading ? 'spinning' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="admin-transactions-error-message">
          {error}
        </div>
      )}

      <div className="admin-transactions-table-wrap">
        <div className="dash-content" style={{ marginBottom: '1rem', display:'flex', gap:'1rem', flexWrap:'wrap' }}>
          <div className="stat-card">
            <div className="stat-count">{confirmedTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} XAF</div>
            <div className="stat-label">Total Confirmed Amount</div>
          </div>
          <div className="stat-card">
            <div className="stat-count">{transactions.filter(t => t.status === 'active').reduce((sum, t) => sum + Number(t.amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} XAF</div>
            <div className="stat-label">Sum of Active Transactions</div>
          </div>
        </div>
        <table className="admin-transactions-table">
          <thead>
            <tr>
              <th>User Name</th>
              <th>Course / Type</th>
              <th>Amount</th>
              <th>Transaction ID</th>
              <th>Phone Number</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="admin-transactions-loading">
                  <div className="admin-transactions-spinner"></div>
                  Loading transactions...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan="7" className="admin-transactions-empty">
                  No pending transactions
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.enrollment_id}>
                  <td>
                    <div className="admin-transactions-user-info">
                      <div className="name">{tx.student_name}</div>
                      <div className="email">{tx.student_email}</div>
                    </div>
                  </td>
                  <td>
                    {tx.type === 'teacher_fee' ? (
                      <div className="admin-transactions-course-info">
                        <div className="title">Teacher Application Fee</div>
                      </div>
                    ) : (
                      <div className="admin-transactions-course-info">
                        <div className="title">{tx.course_title}</div>
                        <div className="cost">Cost: {tx.course_cost} XAF</div>
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="admin-transactions-amount">
                      {tx.amount} {tx.currency}
                    </div>
                  </td>
                  <td>
                    <div className="admin-transactions-transaction-id">
                      <code>{tx.payment_reference}</code>
                    </div>
                  </td>
                  <td>
                    <div className="admin-transactions-phone">
                      {tx.student_phone || 'N/A'}
                    </div>
                  </td>
                  <td>
                    <div className="admin-transactions-date">
                      {formatDate(tx.created_at)}
                    </div>
                  </td>
                  <td>
                    <div className={`admin-transactions-status status-${tx.status}`}>
                      {tx.status}
                    </div>
                  </td>
                  <td>
                    <div className="admin-transactions-actions">
                      <button
                        className="admin-transactions-btn approve"
                        onClick={() => tx.type === 'teacher_fee' ? api.approveTeacherFee(tx.fee_id).then(loadTransactions) : handleApprove(tx.enrollment_id)}
                        disabled={processing[tx.enrollment_id]}
                        title="Approve Transaction"
                      >
                        {processing[tx.enrollment_id] === 'approving' ? (
                          <div className="admin-transactions-spinner small"></div>
                        ) : (
                          <FiCheck />
                        )}
                      </button>
                      <button
                        className="admin-transactions-btn reject"
                        onClick={() => tx.type === 'teacher_fee' ? api.rejectTeacherFee(tx.fee_id).then(loadTransactions) : handleReject(tx.enrollment_id)}
                        disabled={processing[tx.enrollment_id]}
                        title="Reject Transaction"
                      >
                        {processing[tx.enrollment_id] === 'rejecting' ? (
                          <div className="admin-transactions-spinner small"></div>
                        ) : (
                          <FiX />
                        )}
                      </button>
                    </div>
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

export default AdminTransactions
