import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import './UserCourses.css'
import { FiCalendar, FiXCircle, FiPaperclip, FiExternalLink, FiTrash2 } from 'react-icons/fi'
import ConfirmModal from './ConfirmModal'
import SuccessMessage from './SuccessMessage'
import DocumentViewer from './DocumentViewer'
import VideoRoom from './VideoRoom'

function UserClass(){
  const { courseId } = useParams()
  const { user } = useAuth()
  const [course, setCourse] = useState(null)
  const [classes, setClasses] = useState([])
  const [materialsByClass, setMaterialsByClass] = useState({})
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ date: '', time: '', endTime: '', objective: '', meetLink: '', roomType: 'google' })
  const [joinRoom, setJoinRoom] = useState(null)
  const [confirmCancel, setConfirmCancel] = useState(null) // {courseId, classId}
  const [success, setSuccess] = useState('')
  const [attachFor, setAttachFor] = useState(null) // classId
  const [matForm, setMatForm] = useState({ title: '', link: '', fileData: '', filename: '' })
  const [previewSrc, setPreviewSrc] = useState('')
  const isTeacher = user?.role === 'teacher'

  const loadMaterials = async (classIds) => {
    try{
      const results = await Promise.all(classIds.map(async id => {
        try { const r = await api.listClassMaterials(id); return [id, r.materials||[]] } catch { return [id, []] }
      }))
      const map = {}
      for (const [id, arr] of results) map[id] = arr
      setMaterialsByClass(map)
    }catch(e){ /* ignore */ }
  }

  useEffect(()=>{(async()=>{
    try{
      setLoading(true)
      if (courseId){
        const [all, cls] = await Promise.all([
          api.listCourses(),
          api.listCourseClasses(courseId)
        ])
        const c = (all.courses||[]).find(x=> String(x.id) === String(courseId))
        setCourse(c||null)
        const list = (cls.classes||[]).map(k=> ({ ...k, _courseId: courseId, _courseTitle: c?.title || 'Course' }))
        const visible = list.filter(c=> c.status !== 'cancelled')
        setClasses(visible)
        await loadMaterials(visible.map(v=> v.id))
      } else {
        // No courseId: aggregate classes across relevant courses
        if (isTeacher){
          const r = await api.listAssignedCourses(user.id)
          const assigned = r.courses||[]
          const entries = await Promise.all(assigned.map(async c=>{
            try{ const cc = await api.listCourseClasses(c.id); return cc.classes.map(k=> ({ ...k, _courseId: c.id, _courseTitle: c.title })) }catch{ return [] }
          }))
          const list = entries.flat().filter(c=> c.status !== 'cancelled')
          setClasses(list)
          await loadMaterials(list.map(v=> v.id))
        } else {
          const mine = await api.myEnrollments(user.id)
          const enrolled = mine.enrollments||[]
          const entries = await Promise.all(enrolled.map(async e=>{
            try{ const cc = await api.listCourseClasses(e.course_id); return cc.classes.map(k=> ({ ...k, _courseId: e.course_id, _courseTitle: e.title || e.course_title || e.title })) }catch{ return [] }
          }))
          const list = entries.flat().filter(c=> c.status !== 'cancelled')
          setClasses(list)
          await loadMaterials(list.map(v=> v.id))
        }
      }
    }catch(e){} finally { setLoading(false) }
  })()},[courseId, isTeacher, user])

  const schedule = async () => {
    if (!isTeacher || !form.date || !form.time || !form.objective) return
    if (!courseId) return
    try{
      const start = new Date(`${form.date}T${form.time}:00`)
      const end = form.endTime ? new Date(`${form.date}T${form.endTime}:00`) : null
      // Force Google Meet only
      const meet_link = form.meetLink || null
      await api.createCourseClass(courseId, { teacherId: user.id, start_time: start.toISOString(), end_time: end ? end.toISOString() : null, objective: form.objective, meet_link, room_type: 'google' })
      const cls = await api.listCourseClasses(courseId)
      const list = (cls.classes||[]).filter(c=> c.status !== 'cancelled')
      setClasses(list)
      await loadMaterials(list.map(v=> v.id))
      setOpen(false)
      setForm({ date: '', time: '', endTime: '', objective: '', meetLink: '', roomType: 'google' })
    }catch(e){}
  }

  const doCancel = async () => {
    if (!confirmCancel) return
    try{
      await api.cancelCourseClass(confirmCancel.courseId, confirmCancel.classId)
      setClasses(prev => prev.filter(c => c.id !== confirmCancel.classId))
      setSuccess('Class cancelled')
    }catch(e){}
    setConfirmCancel(null)
  }

  const handleFilePick = async (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setMatForm(prev => ({ ...prev, fileData: reader.result, filename: file.name }))
    }
    reader.readAsDataURL(file)
  }

  const submitMaterial = async () => {
    if (!attachFor) return
    try{
      const payload = {
        uploaderId: user.id,
        title: matForm.title || null,
      }
      if (matForm.link) {
        payload.file_url = matForm.link
      } else if (matForm.fileData && matForm.filename) {
        payload.file_data = matForm.fileData
        payload.filename = matForm.filename
      } else {
        return
      }
      await api.addClassMaterial(attachFor, payload)
      const r = await api.listClassMaterials(attachFor)
      setMaterialsByClass(prev => ({ ...prev, [attachFor]: r.materials||[] }))
      setAttachFor(null)
      setMatForm({ title: '', link: '', fileData: '', filename: '' })
      setSuccess('Material added')
    }catch(e){}
  }

  const visibleClasses = classes

  return (
    <div className="user-courses" style={{ paddingTop: '1rem' }}>
      <div className="table-wrap" style={{ marginBottom: '1rem' }}>
        <div style={{ padding: '1rem' }}>
          <h3 style={{ margin: 0 }}>{course?.title || 'Course'}</h3>
          <div style={{ color:'#6b7280' }}>{(course?.description||'').split(';')[0]}</div>
        </div>
      </div>

      {isTeacher && (
        <div style={{ marginBottom: '1rem' }}>
          <button
            className="icon-btn"
            title="Schedule class"
            onClick={()=> {
              if (courseId) { setOpen(true) }
              else { setSuccess('Select a course from the Courses page to schedule classes.') }
            }}
          >
            <FiCalendar /> Schedule
          </button>
        </div>
      )}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {!courseId && <th>Course</th>}
              <th>Start</th>
              <th>End</th>
              <th>Status</th>
              <th>Objective</th>
              <th>Meet Link</th>
              <th>Materials</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={courseId ? 6 : 7}>Loading...</td></tr>
            ) : visibleClasses.length === 0 ? (
              <tr><td colSpan={courseId ? 6 : 7} className="empty">No classes scheduled</td></tr>
            ) : visibleClasses.map(cls => {
              const mats = materialsByClass[cls.id] || []
              return (
                <tr key={cls.id}>
                  {!courseId && <td>{cls._courseTitle || 'Course'}</td>}
                  <td>{cls.start_time ? new Date(cls.start_time).toLocaleString() : '-'}</td>
                  <td>{cls.end_time ? new Date(cls.end_time).toLocaleString() : '-'}</td>
                  <td>{cls.status}</td>
                  <td>{cls.objective || '-'}</td>
                  <td>
                    {cls.meet_link && !String(cls.meet_link).startsWith('custom:') && (
                      <a href={cls.meet_link} target="_blank" rel="noreferrer">Join</a>
                    )}
                    {(!cls.meet_link || String(cls.meet_link).startsWith('custom:')) && (
                      <button className="icon-btn" title="Join class" onClick={()=> setJoinRoom({ roomId: `course-${cls._courseId||courseId}-class-${cls.id}`, classId: cls.id })}>
                        <FiExternalLink /> Join
                      </button>
                    )}
                    {isTeacher && (
                      <button className="icon-btn danger" title="Cancel" onClick={()=> setConfirmCancel({ courseId: cls.course_id || courseId, classId: cls.id })} style={{ marginLeft: '.5rem' }}>
                        <FiXCircle />
                      </button>
                    )}
                  </td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap: '.5rem', flexWrap:'wrap' }}>
                      {mats.length === 0 && <span style={{ color:'#9ca3af' }}>None</span>}
                      {mats.slice(0,3).map(m => (
                        <div key={m.id} style={{ display:'inline-flex', gap: '.25rem', alignItems:'center' }}>
                          <button className="icon-btn" title={m.title || 'Open'} onClick={()=> setPreviewSrc(m.file_url)}>
                            <FiExternalLink />
                          </button>
                          {isTeacher && (
                            <button className="icon-btn danger" title="Remove" onClick={async()=>{ try{ await api.deleteClassMaterial(m.id); setMaterialsByClass(prev=> ({ ...prev, [cls.id]: (prev[cls.id]||[]).filter(x=> x.id !== m.id) })); }catch{} }}>
                              <FiTrash2 />
                            </button>
                          )}
                        </div>
                      ))}
                      {mats.length > 3 && <span style={{ color:'#6b7280' }}>+{mats.length - 3}</span>}
                      {isTeacher && (
                        <button className="icon-btn" title="Attach material" onClick={()=> { setAttachFor(cls.id); setMatForm({ title: '', link: '', fileData: '', filename: '' }) }}>
                          <FiPaperclip />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {open && courseId && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3 className="modal-title">Schedule Class</h3>
            <div className="row cols">
              <div>
                <label>Date</label>
                <input type="date" value={form.date} onChange={(e)=> setForm(prev=> ({ ...prev, date: e.target.value }))} />
              </div>
              <div>
                <label>Time</label>
                <input type="time" value={form.time} onChange={(e)=> setForm(prev=> ({ ...prev, time: e.target.value }))} />
              </div>
              <div>
                <label>End Time</label>
                <input type="time" value={form.endTime} onChange={(e)=> setForm(prev=> ({ ...prev, endTime: e.target.value }))} />
              </div>
            </div>
            <div className="row">
              <label>Objective</label>
              <input value={form.objective} onChange={(e)=> setForm(prev=> ({ ...prev, objective: e.target.value }))} placeholder="Learning objective" />
            </div>
            <div className="row">
              <label>Google Meet Link</label>
              <input value={form.meetLink} onChange={(e)=> setForm(prev=> ({ ...prev, meetLink: e.target.value }))} placeholder="https://meet.google.com/..." />
            </div>
            <div className="modal-actions" style={{ marginTop: '0.75rem' }}>
              <button className="modal-btn" onClick={()=> setOpen(false)}>Cancel</button>
              <button className="modal-btn primary" onClick={schedule}>Save</button>
            </div>
          </div>
        </div>
      )}

      {attachFor && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3 className="modal-title">Attach Material</h3>
            <div className="row">
              <label>Title (optional)</label>
              <input value={matForm.title} onChange={(e)=> setMatForm(prev=> ({ ...prev, title: e.target.value }))} placeholder="e.g. Week 1 Slides" />
            </div>
            <div className="row">
              <label>Link (paste URL)</label>
              <input value={matForm.link} onChange={(e)=> setMatForm(prev=> ({ ...prev, link: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="row">
              <label>Or Upload File</label>
              <input type="file" onChange={handleFilePick} />
              {matForm.filename && <div style={{ color:'#6b7280', marginTop: '.25rem' }}>{matForm.filename}</div>}
            </div>
            <div className="modal-actions" style={{ marginTop: '0.75rem' }}>
              <button className="modal-btn" onClick={()=> { setAttachFor(null); setMatForm({ title: '', link: '', fileData: '', filename: '' }) }}>Cancel</button>
              <button className="modal-btn primary" onClick={submitMaterial}>Add</button>
            </div>
          </div>
        </div>
      )}

      {confirmCancel && (
        <ConfirmModal
          title="Cancel class?"
          message="This will cancel the session for everyone."
          confirmText="Cancel Class"
          cancelText="Keep"
          onConfirm={doCancel}
          onCancel={()=> setConfirmCancel(null)}
        />
      )}

      {success && <SuccessMessage message={success} onClose={()=> setSuccess('')} />}
      {joinRoom && (
        <VideoRoom roomId={joinRoom.roomId} user={user} role={isTeacher ? 'teacher' : 'student'} onClose={()=> setJoinRoom(null)} />
      )}
      {previewSrc && <DocumentViewer src={previewSrc} onClose={()=> setPreviewSrc('')} />}
    </div>
  )
}

export default UserClass



