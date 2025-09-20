import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import './UserCourses.css'
import { FiPlusCircle, FiCheckCircle } from 'react-icons/fi'
import SuccessMessage from './SuccessMessage'
import PaymentModal from './PaymentModal'
import TransactionIdModal from './TransactionIdModal'

function UserCourses(){
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleEnroll = (course) => {
    if (!course.payment_link) {
      setError('Payment link not available for this course')
      return
    }
    setSelected(course)
    setShowPaymentModal(true)
    setError('')
  }

  const handlePaymentComplete = () => {
    setShowPaymentModal(false)
    setShowTransactionModal(true)
  }

  const handleTransactionIdSubmit = async (transactionId) => {
    try {
      // Submit transaction ID for verification
      const response = await api.submitTransactionId({
        courseId: selected.id,
        userId: user.id,
        transactionId: transactionId,
        amount: selected.price_amount,
        currency: selected.price_currency
      })

      if (response.success) {
        setSuccess('Transaction ID submitted successfully! Please wait for admin approval.')
        setShowTransactionModal(false)
        setSelected(null)
      } else {
        throw new Error(response.error || 'Failed to submit transaction ID')
      }
    } catch (err) {
      throw new Error(err.message || 'Failed to submit transaction ID')
    }
  }

  useEffect(()=>{(async()=>{
    try{
      if (user?.role === 'teacher'){
        const r = await api.listAssignedCourses(user.id)
        setCourses(r.courses||[])
      } else {
        const results = await Promise.allSettled([
          api.listCourses(),
          user?.id ? api.myEnrollments(user.id) : Promise.resolve({ enrollments: [] })
        ])
        const coursesRes = results[0].status === 'fulfilled' ? results[0].value : { courses: [] }
        const mineRes = results[1].status === 'fulfilled' ? results[1].value : { enrollments: [] }
        setCourses(coursesRes.courses||[])
        setEnrollments(mineRes.enrollments||[])
      }
    }catch(e){} finally { setLoading(false) }
  })()},[user])

  return (
    <div className="user-courses">
      {user?.role !== 'teacher' && (
        <div className="dash-content" style={{ marginBottom: '1rem' }}>
          {useMemo(() => {
            const enrolledIds = new Set(enrollments.map(e=> e.course_id))
            const total = courses.length
            const enrolled = [...enrolledIds].length
            const unenrolled = Math.max(total - enrolled, 0)
            return [
              { key: 'enrolled', label: 'Total Enrolled', count: enrolled },
              { key: 'unenrolled', label: 'Total Unenrolled', count: unenrolled },
            ]
          }, [courses, enrollments]).map(({ key, label, count }) => (
            <div key={key} className="stat-card">
              <div className="stat-count">{count}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      )}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Course name</th>
              <th>Code</th>
              <th>Duration</th>
              {user?.role !== 'teacher' && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={user?.role !== 'teacher' ? 4 : 3}>Loading...</td></tr>
            ) : courses.length === 0 ? (
              <tr><td colSpan={user?.role !== 'teacher' ? 4 : 3} className="empty">No courses</td></tr>
            ) : courses.map(c => {
              const m = (c.description||'')
              const code = (m.match(/Code:\s*([^;]*)/)||[])[1]||''
              const duration = (m.match(/Duration:\s*([^;]*)/)||[])[1]||''
              const enrolled = enrollments.some(e=> e.course_id === c.id)
              return (
                <tr key={c.id} className={(user?.role==='teacher' || enrolled) ? 'clickable' : ''} onClick={()=>{
                  if (user?.role==='teacher' || enrolled){
                    window.location.href = `/dashboard/classes/${encodeURIComponent(c.id)}`
                  }
                }}>
                  <td>{c.title}</td>
                  <td>{code}</td>
                  <td>{duration}</td>
                  {user?.role !== 'teacher' && (
                    <td>
                      {enrolled ? (
                        <span title="Enrolled" style={{ color: '#10b981' }}><FiCheckCircle /></span>
                      ) : (
                        <button className="icon-btn" title="Enroll" onClick={()=> handleEnroll(c)}>
                          <FiPlusCircle />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {error && (
        <div className="error-message" style={{ color: '#ef4444', marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem' }}>
          {error}
        </div>
      )}

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false)
          setSelected(null)
          setError('')
        }}
        course={selected}
        onPaymentComplete={handlePaymentComplete}
      />

      <TransactionIdModal
        isOpen={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false)
          setSelected(null)
          setError('')
        }}
        course={selected}
        onSubmitTransactionId={handleTransactionIdSubmit}
      />

      {success && <SuccessMessage message={success} onClose={()=> setSuccess('')} />}
    </div>
  )
}

function CourseTeachers({ courseId }){
  const [names, setNames] = useState('...')
  useEffect(()=>{(async()=>{
    try{ const r = await api.listCourseTeachers(courseId); setNames((r.teachers||[]).map(t=>t.name).join(', ') || '-') }catch(e){ setNames('-') }
  })()},[courseId])
  return <span>{names}</span>
}

export default UserCourses


