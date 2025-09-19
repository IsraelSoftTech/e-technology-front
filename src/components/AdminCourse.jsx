import { useEffect, useMemo, useState } from 'react'
import './AdminCourse.css'
import { FiEdit2, FiTrash2, FiUserPlus, FiX, FiCheck } from 'react-icons/fi'
import ConfirmModal from './ConfirmModal'
import api from '../services/api'
import SuccessMessage from './SuccessMessage'

function AdminCourse() {
  const [showForm, setShowForm] = useState(false)
  const [courses, setCourses] = useState([])
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    name: '',
    code: '',
    duration: '',
    cost: '',
    levels: [],
    imageUrl: '',
  })
  const [editing, setEditing] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [assignCourse, setAssignCourse] = useState(null)
  const [approvedTeachers, setApprovedTeachers] = useState([])
  const [selectedTeachers, setSelectedTeachers] = useState([])
  const [assignedByCourse, setAssignedByCourse] = useState({}) // { [courseId]: [{id,name,email}] }

  const toggleLevel = (level) => {
    setForm((prev) => {
      const levels = prev.levels.includes(level)
        ? prev.levels.filter((l) => l !== level)
        : [...prev.levels, level]
      return { ...prev, levels }
    })
  }

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!form.name) return
    try {
      const autoCode = `CRS-${form.name.trim().slice(0,3).toUpperCase()}-${Date.now().toString().slice(-4)}`
      if (editing) {
        const desc = `Code: ${form.code || autoCode}; Duration: ${form.duration || ''}; Levels: ${(form.levels||[]).join(', ')}; Image: ${form.imageUrl || ''}`
        const res = await api.updateCourse(editing.id, { title: form.name, description: desc })
        setSuccess(res.message || 'Course updated')
        setCourses((prev) => prev.map(c => c.id === editing.id ? res.course : c))
      } else {
        const payload = { title: form.name, code: autoCode, duration: form.duration, cost: form.cost, levels: form.levels, imageUrl: form.imageUrl }
        const res = await api.createCourse(payload)
        setSuccess(res.message || 'Course created successfully')
        setCourses((prev) => [res.course, ...prev])
      }
      setForm({ name: '', code: '', duration: '', cost: '', levels: [], imageUrl: '' })
      setShowForm(false)
      setEditing(null)
    } catch (err) {
      alert(err.message)
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.listCourses()
        const list = res.courses || []
        setCourses(list)
        // Fetch assignments for each course
        const entries = await Promise.all(list.map(async (c)=>{
          try{ const r = await api.listCourseTeachers(c.id); return [c.id, r.teachers||[]] }catch{ return [c.id, []] }
        }))
        setAssignedByCourse(Object.fromEntries(entries))
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [])

  const loadCourseAssignments = async (courseId) => {
    try{
      const r = await api.listCourseTeachers(courseId)
      setAssignedByCourse(prev=> ({ ...prev, [courseId]: r.teachers||[] }))
    }catch(e){ /* ignore */ }
  }

  const parseMeta = (desc = '') => {
    const get = (label) => {
      const m = desc.match(new RegExp(label + ':\\s*([^;]*)'))
      return m ? m[1].trim() : ''
    }
    return {
      code: get('Code'),
      duration: get('Duration'),
      levels: get('Levels'),
    }
  }

  const counts = useMemo(() => {
    const total = courses.length
    let assigned = 0
    courses.forEach(c=>{ if ((assignedByCourse[c.id]||[]).length > 0) assigned += 1 })
    return { total, assigned, unassigned: Math.max(total - assigned, 0) }
  }, [courses, assignedByCourse])

  const openAssign = async (course) => {
    try{
      const t = await api.listApprovedTeachers()
      setApprovedTeachers(t.teachers||[])
      const current = await api.listCourseTeachers(course.id)
      const currentIds = new Set((current.teachers||[]).map(x=>x.id))
      setSelectedTeachers((t.teachers||[]).filter(x=> currentIds.has(x.user_id || x.id)).map(x=> x.user_id || x.id))
      setAssignCourse(course)
    }catch(err){ alert(err.message) }
  }

  const toggleTeacher = (id) => {
    setSelectedTeachers(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  }

  const saveAssignment = async () => {
    if (!assignCourse) return
    try{
      await api.assignCourseTeachers(assignCourse.id, selectedTeachers)
      await loadCourseAssignments(assignCourse.id)
      setSuccess('Teachers assigned')
      setAssignCourse(null)
      setSelectedTeachers([])
    }catch(err){ alert(err.message) }
  }

  return (
    <div className="admin-course">
      <div className="grid">
        <div className="info-card">
          <h3>Total Courses</h3>
          <div className="num">{counts.total}</div>
        </div>
        <div className="info-card">
          <h3>Unassigned Courses</h3>
          <div className="num">{counts.unassigned}</div>
        </div>
        <div className="info-card">
          <h3>Assigned Courses</h3>
          <div className="num">{counts.assigned}</div>
        </div>
      </div>

      <div className="actions">
        <button className="btn" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Close' : 'Create Course'}
        </button>
      </div>

      {showForm && (
        <form className="course-form" onSubmit={onSubmit}>
          <div className="row">
            <label>Course name</label>
            <input name="name" value={form.name} onChange={onChange} placeholder="e.g. Fullstack Web Development" required />
          </div>
          <div className="row">
            <label>Course Code</label>
            <input name="code" value={form.code} onChange={onChange} placeholder="Auto-generated" readOnly />
          </div>
          <div className="row cols">
            <div>
              <label>Course Duration</label>
              <input name="duration" value={form.duration} onChange={onChange} placeholder="e.g. 12 weeks" />
            </div>
            <div>
              <label>Course Cost</label>
              <input name="cost" value={form.cost} onChange={onChange} placeholder="e.g. $200" />
            </div>
          </div>
          <div className="row cols">
            <div>
              <label>Course Level</label>
              <div className="levels">
                {['Beginner','Intermediate','Expert'].map((lvl) => (
                  <label key={lvl} className="chip">
                    <input type="checkbox" checked={form.levels.includes(lvl)} onChange={() => toggleLevel(lvl)} />
                    <span>{lvl}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label>Course Image URL</label>
              <input name="imageUrl" value={form.imageUrl} onChange={onChange} placeholder="https://..." />
            </div>
          </div>
          <div className="row">
            <button className="btn primary" type="submit">Save Course</button>
          </div>
        </form>
      )}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Course name</th>
              <th>Course Code</th>
              <th>Course Duration</th>
              <th>Course Cost</th>
              <th>Course Level</th>
              <th>Assigned Tutors</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty">No courses yet</td>
              </tr>
            ) : (
              courses.map((c) => {
                const meta = parseMeta(c.description || '')
                const levelsText = Array.isArray(c.levels) ? c.levels.join(', ') : meta.levels
                const imageMeta = c.image_url || (c.description||'').match(/Image:\s*([^;]*)/)?.[1] || ''
                const assigned = assignedByCourse[c.id] || []
                return (
                <tr key={c.id}>
                  <td>{imageMeta ? <img className="thumb" src={imageMeta} alt="course" /> : null}</td>
                  <td>{c.name || c.title}</td>
                  <td>{c.code || meta.code}</td>
                  <td>{c.duration || meta.duration}</td>
                  <td>{c.cost || c.price_amount}</td>
                  <td>{levelsText}</td>
                  <td>{assigned.length ? assigned.map(t=>t.name).join(', ') : '-'}</td>
                  <td>
                    <button className="icon-btn" title="Edit" onClick={()=>{
                      const meta = parseMeta(c.description||'')
                      setForm({ name: c.title || '', code: meta.code || '', duration: meta.duration || '', cost: c.price_amount || '', levels: (meta.levels||'').split(',').filter(Boolean), imageUrl: (c.image_url || (c.description||'').match(/Image:\s*([^;]*)/)?.[1] || '') })
                      setEditing(c)
                      setShowForm(true)
                    }}><FiEdit2 /></button>
                    <button className="icon-btn danger" title="Delete" onClick={()=> setConfirmId(c.id)}><FiTrash2 /></button>
                    <button className="icon-btn" title="Assign" onClick={()=> openAssign(c)}><FiUserPlus /></button>
                  </td>
                </tr>
              )})
            )}
          </tbody>
        </table>
      </div>

      {assignCourse && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Assign teachers to {assignCourse.title}</h3>
            <div className="list">
              {approvedTeachers.length === 0 ? (
                <div className="empty">No approved teachers</div>
              ) : (
                approvedTeachers.map(t => (
                  <label key={t.user_id || t.id} className="chip">
                    <input type="checkbox" checked={selectedTeachers.includes(t.user_id || t.id)} onChange={()=> toggleTeacher(t.user_id || t.id)} />
                    <span>{t.name}</span>
                  </label>
                ))
              )}
            </div>
            <div className="actions">
              <button className="icon-btn" title="Cancel" onClick={()=>{ setAssignCourse(null); setSelectedTeachers([]) }}><FiX /></button>
              <button className="icon-btn" title="Assign" onClick={saveAssignment}><FiCheck /></button>
            </div>
          </div>
        </div>
      )}

      {success && <SuccessMessage message={success} onClose={() => setSuccess('')} />}
      {confirmId && (
        <ConfirmModal
          title="Delete Course"
          message="This action cannot be undone."
          confirmText="Delete"
          onCancel={()=> setConfirmId(null)}
          onConfirm={async()=>{
            try{
              await api.deleteCourse(confirmId)
              setCourses(prev=> prev.filter(c=> c.id!==confirmId))
              setSuccess('Course deleted')
            }catch(err){ alert(err.message) }
            setConfirmId(null)
          }}
        />
      )}
    </div>
  )
}

export default AdminCourse
