import { useEffect } from 'react'
import './SuccessMessage.css'

function SuccessMessage({ message, onClose, duration = 5000 }) {
  useEffect(() => {
    const t = setTimeout(() => onClose && onClose(), duration)
    return () => clearTimeout(t)
  }, [message, duration, onClose])

  return (
    <div className="success-msg" role="status" aria-live="polite">
      <div className="success-msg-content">
        <span className="text">{message}</span>
        <button className="close" onClick={onClose} aria-label="Close">
          <span className="dot">✕</span>
        </button>
      </div>
    </div>
  )
}

export default SuccessMessage


