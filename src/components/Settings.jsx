import { useEffect, useState } from 'react'
import api from '../services/api'

function Settings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ teacher_application_fee_amount: '', fapshi_payment_link: '' })

  useEffect(()=>{(async()=>{
    try{
      setLoading(true)
      const r = await api.getSettings()
      const s = r.settings || {}
      setForm({
        teacher_application_fee_amount: s.teacher_application_fee_amount || '',
        fapshi_payment_link: s.fapshi_payment_link || ''
      })
    }catch(e){}
    finally{ setLoading(false) }
  })()},[])

  const save = async () => {
    try{
      setSaving(true)
      await api.saveSettings({
        teacher_application_fee_amount: form.teacher_application_fee_amount,
        fapshi_payment_link: form.fapshi_payment_link
      })
      setSuccess('Settings saved')
    }catch(e){ alert(e.message) }
    finally{ setSaving(false) }
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Settings</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="card" style={{ maxWidth: 560 }}>
          <div className="row">
            <label>Teacher Application Fee Amount (XAF)</label>
            <input type="number" value={form.teacher_application_fee_amount} onChange={(e)=> setForm(prev=> ({ ...prev, teacher_application_fee_amount: e.target.value }))} placeholder="e.g. 5000" />
          </div>
          <div className="row">
            <label>Fapshi Payment Link</label>
            <input value={form.fapshi_payment_link} onChange={(e)=> setForm(prev=> ({ ...prev, fapshi_payment_link: e.target.value }))} placeholder="https://pay.fapshi.com/..." />
          </div>
          <div className="row" style={{ marginTop: '.5rem' }}>
            <button className="btn primary" onClick={save} disabled={saving}>Save</button>
          </div>
          {success && (
            <div style={{ color:'#10b981', marginTop: '.5rem' }}>{success}</div>
          )}
        </div>
      )}
    </div>
  )
}

export default Settings


