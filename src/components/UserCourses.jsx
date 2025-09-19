import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import './UserCourses.css'
import { FiPlusCircle, FiCheckCircle } from 'react-icons/fi'
import SuccessMessage from './SuccessMessage'

function UserCourses(){
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [payStep, setPayStep] = useState('') // '' | 'method'
  const [method, setMethod] = useState('fapshi') // fapshi|mtn|orange|card
  const [form, setForm] = useState({ phone: '', card: '', expiry: '', cvc: '' })
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)

  const handlePayment = async () => {
    if (!user?.id || !selected) return;
    
    // Validate phone number for mobile money
    if (method !== 'card' && !form.phone.trim()) {
      setError('Please enter your mobile money number');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const paymentData = {
        courseId: selected.id,
        amount: selected.price_amount,
        currency: selected.price_currency,
        phone: form.phone,
        paymentMethod: method
      };

      const response = await api.createPayment(paymentData);

      if (response.success) {
        setSuccess('Approval prompt sent. Please confirm on your phone.');

        // If Fapshi returns a payment URL, some flows may open an approval page
        if (response.paymentUrl) {
          window.open(response.paymentUrl, '_blank');
        }

        // Start polling for payment status; enrollment activates on success
        pollPaymentStatus(response.reference);
      } else {
        setError(response.error || 'Payment creation failed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const pollPaymentStatus = async (reference) => {
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await api.checkPaymentStatus(reference);
        
        if (response.success && response.status === 'success') {
          setSuccess('Payment successful! Course enrolled successfully.');
          
          // Refresh enrollments
          try {
            const mine = await api.myEnrollments(user.id);
            setEnrollments(mine.enrollments || []);
          } catch (e) {
            setEnrollments(prev => [...prev, { course_id: selected.id, status: 'active' }]);
          }

          // Close modal after delay
          setTimeout(() => {
            setSelected(null);
            setPayStep('');
            setSuccess('');
          }, 3000);
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        } else {
          setError('Payment verification timeout. Please check your payment status manually.');
        }
      } catch (err) {
        console.error('Status check error:', err);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000);
        }
      }
    };

    // Start polling after 5 seconds
    setTimeout(poll, 5000);
  };

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
                        <button className="icon-btn" title="Enroll" onClick={()=> setSelected(c)}>
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

      {selected && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3 className="modal-title">{selected.title}</h3>
            <div className="row"><strong>Code:</strong> {(selected.description||'').match(/Code:\s*([^;]*)/)?.[1]||''}</div>
            <div className="row"><strong>Duration:</strong> {(selected.description||'').match(/Duration:\s*([^;]*)/)?.[1]||''}</div>
            <div className="row"><strong>Cost:</strong> {selected.price_amount} {selected.price_currency}</div>
            <div className="row"><strong>Assigned Teachers:</strong> <CourseTeachers courseId={selected.id} /></div>
            {error && (
              <div className="error-message" style={{ color: '#ef4444', marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem' }}>
                {error}
              </div>
            )}
            {payStep !== 'method' ? (
              <div className="modal-actions" style={{ marginTop: '0.75rem' }}>
                <button className="modal-btn" onClick={()=> { setSelected(null); setError(''); setSuccess(''); }}>Close</button>
                <button className="modal-btn primary" onClick={()=> setPayStep('method')}>Proceed to pay</button>
              </div>
            ) : (
              <div className="pay-wrap" style={{ marginTop: '0.75rem' }}>
                <div className="row" style={{ gap: '.5rem' }}>
                  <label className="chip"><input type="radio" name="pm" checked={method==='fapshi'} onChange={()=> setMethod('fapshi')} /> <span>Fapshi (Mobile Money)</span></label>
                  <label className="chip"><input type="radio" name="pm" checked={method==='mtn'} onChange={()=> setMethod('mtn')} /> <span>MTN MoMo</span></label>
                  <label className="chip"><input type="radio" name="pm" checked={method==='orange'} onChange={()=> setMethod('orange')} /> <span>Orange Money</span></label>
                  <label className="chip"><input type="radio" name="pm" checked={method==='card'} onChange={()=> setMethod('card')} /> <span>Card</span></label>
                </div>
                {method!=='card' ? (
                  <div className="row">
                    <label>Mobile Money Number</label>
                    <input placeholder="e.g. 670000000" value={form.phone} onChange={(e)=> setForm(prev=> ({ ...prev, phone: e.target.value }))} />
                  </div>
                ) : (
                  <>
                    <div className="row"><label>Card Number</label><input placeholder="1234 5678 9012 3456" value={form.card} onChange={(e)=> setForm(prev=> ({ ...prev, card: e.target.value }))} /></div>
                    <div className="row cols"><div><label>Expiry</label><input placeholder="MM/YY" value={form.expiry} onChange={(e)=> setForm(prev=> ({ ...prev, expiry: e.target.value }))} /></div><div><label>CVC</label><input placeholder="***" value={form.cvc} onChange={(e)=> setForm(prev=> ({ ...prev, cvc: e.target.value }))} /></div></div>
                  </>
                )}
                <div className="modal-actions" style={{ marginTop: '0.75rem' }}>
                  <button className="modal-btn" onClick={()=> { setPayStep(''); setError(''); }} disabled={processing}>Back</button>
                  <button className="modal-btn primary" onClick={handlePayment} disabled={processing}>
                    {processing ? 'Waiting for approval…' : 'Confirm & Pay'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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


