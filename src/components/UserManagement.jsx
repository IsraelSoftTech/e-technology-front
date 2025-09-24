import { useEffect, useState } from 'react'
import './UserManagement.css'
import api from '../services/api'
import SuccessMessage from './SuccessMessage'
import TransactionIdModal from './TransactionIdModal'
import DocumentViewer from './DocumentViewer'
import { FiEye } from 'react-icons/fi'

function UserManagement({ user }) {
  const [showForm, setShowForm] = useState(false)
  const [courses, setCourses] = useState([])
  const [status, setStatus] = useState(null)
  const [list, setList] = useState([])
  const [docSrc, setDocSrc] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ fullName: '', courseIds: [], certificate: null })
  const [sendingFee, setSendingFee] = useState(false)
  const [showFeeModal, setShowFeeModal] = useState(false)
  const [feeCourse, setFeeCourse] = useState(null) // reuse modal UI: { title, price_amount }

  useEffect(()=>{(async()=>{try{const r=await api.listCourses();setCourses(r.courses||[])}catch(e){}})()},[])
  useEffect(()=>{(async()=>{try{if(user?.id){const r=await api.myTeacherApplication(user.id);setStatus(r.application||null); const l=await api.myTeacherApplications(user.id); setList(l.applications||[])}}catch(e){}})()},[user])

  const isTeacher = (user?.role === 'teacher')

  const toggleCourse = (id) => {
    setForm(prev=>({ ...prev, courseIds: prev.courseIds.includes(id) ? prev.courseIds.filter(x=>x!==id) : [...prev.courseIds, id] }))
  }

  const onFile = (e) => {
    const f = e.target.files?.[0]
    if(!f) return
    const reader = new FileReader()
    reader.onload = ()=> setForm(prev=>({ ...prev, certificate: { name: f.name, dataUrl: reader.result } }))
    reader.readAsDataURL(f)
  }

  const submit = async (e) => {
    e.preventDefault()
    if(!form.fullName || !form.certificate) return
    try{
      const r = await api.applyTeacher({ userId: user.id, fullName: form.fullName, courseIds: form.courseIds, certificate: form.certificate })
      setSuccess(r.message || 'Application sent')
      setStatus(r.application)
      setShowForm(false)
      // Open Fapshi link configured in settings for teacher application fee and show modal to submit transaction ID
      try {
        const s = await api.getSettings()
        const link = s?.settings?.fapshi_payment_link
        const amount = Number(s?.settings?.teacher_application_fee_amount || 0)
        setFeeCourse({ title: 'Teacher Application Fee', price_amount: amount, cost: amount, payment_link: link })
        if (link) { window.open(link, '_blank') }
        setShowFeeModal(true)
      } catch {}
    }catch(err){ alert(err.message) }
  }

  const onSubmitTeacherFeeTxn = async (transactionId) => {
    setSendingFee(true)
    try{
      const amount = Number(feeCourse?.price_amount || 0)
      await api.submitTeacherFee({ userId: user.id, transactionId, amount: amount || 0, currency: 'XAF' })
      setSuccess('Transaction ID sent. Admin will review it.')
      setShowFeeModal(false)
      setFeeCourse(null)
    }catch(e){ throw e }
    finally{ setSendingFee(false) }
  }

  return (
    <div className="user-mgmt">
      <div className="section">
        <h2>{isTeacher ? "You're a teacher" : 'Become a Teacher'}</h2>
        {isTeacher ? (
          <p>Your account is verified as a teacher.</p>
        ) : (
          <p>If you are a teacher, apply below to be verified. After submission, pay the application fee and send your transaction ID to admin.</p>
        )}
        {!isTeacher && !status && <button className="btn" onClick={()=> setShowForm(s=>!s)}>{showForm ? 'Close' : 'Apply'}</button>}
        {!isTeacher && status && (
          <div className="status-card">
            <div className="row"><span>Status:</span><strong>{status.review_status}</strong></div>
            <div className="row"><span>Submitted:</span><strong>{new Date(status.uploaded_at).toLocaleString()}</strong></div>
            <div className="row"><button className="btn" onClick={()=> setShowFeeModal(true)} disabled={sendingFee}>Send Transaction ID</button></div>
          </div>
        )}
      </div>

      {!isTeacher && showForm && (
        <form className="apply-form" onSubmit={submit}>
          <div className="row">
            <label>Full Name</label>
            <input value={form.fullName} onChange={(e)=> setForm(prev=>({ ...prev, fullName: e.target.value }))} placeholder="Your full name" required />
          </div>
          <div className="row">
            <label>Course of Mastery</label>
            <div className="options">
              {courses.map(c => (
                <label key={c.id} className="chip">
                  <input type="checkbox" checked={form.courseIds.includes(c.id)} onChange={()=> toggleCourse(c.id)} />
                  <span>{c.title}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="row">
            <label>Upload Highest Certificate (PDF or Image)</label>
            <input type="file" accept="application/pdf,image/*" onChange={onFile} />
          </div>
          <div className="row">
            <button className="btn primary" type="submit">Submit Application</button>
          </div>
        </form>
      )}

      {!isTeacher && list.length>0 && (
        <div className="table-wrap" style={{ marginTop: '1rem' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Submitted</th>
                <th>Status</th>
                <th>Document</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map(a => (
                <tr key={a.id}>
                  <td>{new Date(a.uploaded_at).toLocaleString()}</td>
                  <td className={`status ${a.review_status}`}>{a.review_status}</td>
                  <td>{a.file_path ? <button className="icon-btn" onClick={()=> setDocSrc(a.file_path)} title="View"><FiEye /></button> : '-'}</td>
                  <td>
                    {a.review_status !== 'approved' && (
                      <button className="btn" onClick={async()=>{ try{ await api.deleteMyTeacherApplication(a.id, user.id); setList(prev=> prev.filter(x=> x.id !== a.id)); if(status && status.id === a.id) setStatus(null) }catch(e){ alert(e.message) } }}>Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {success && <SuccessMessage message={success} onClose={()=> setSuccess('')} />}
      {showFeeModal && (
        <TransactionIdModal
          isOpen={showFeeModal}
          onClose={()=> { setShowFeeModal(false); setFeeCourse(null) }}
          course={feeCourse || { title: 'Teacher Application Fee', price_amount: 0 }}
          onSubmitTransactionId={onSubmitTeacherFeeTxn}
        />
      )}
      {docSrc && <DocumentViewer src={docSrc} onClose={()=> setDocSrc('')} />}
    </div>
  )
}

export default UserManagement


