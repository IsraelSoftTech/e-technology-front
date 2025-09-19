import './ConfirmModal.css'

function ConfirmModal({ title = 'Are you sure?', message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card">
        <h3 className="modal-title">{title}</h3>
        {message && <p className="modal-message">{message}</p>}
        <div className="modal-actions">
          <button className="modal-btn" onClick={onCancel}>{cancelText}</button>
          <button className="modal-btn danger" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal


