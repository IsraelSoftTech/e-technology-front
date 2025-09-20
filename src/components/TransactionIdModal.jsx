import { useState } from 'react'
import './TransactionIdModal.css'
import { FiX, FiCheck, FiAlertCircle } from 'react-icons/fi'

function TransactionIdModal({ isOpen, onClose, course, onSubmitTransactionId }) {
  const [transactionId, setTransactionId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen || !course) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!transactionId.trim()) {
      setError('Please enter your transaction ID')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await onSubmitTransactionId(transactionId.trim())
      setTransactionId('')
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to submit transaction ID')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setTransactionId('')
    setError('')
    onClose()
  }

  return (
    <div className="transaction-modal-backdrop">
      <div className="transaction-modal-container">
        <div className="transaction-modal-header">
          <h3>Submit Transaction ID</h3>
          <button className="transaction-close-btn" onClick={handleClose}>
            <FiX />
          </button>
        </div>

        <div className="transaction-modal-content">
          <div className="transaction-course-info">
            <h4>{course.title}</h4>
            <p className="transaction-course-cost">Cost: {course.cost || course.price_amount} XAF</p>
          </div>

          <div className="transaction-info-box">
            <div className="transaction-info-icon">
              <FiAlertCircle />
            </div>
            <div className="transaction-info-content">
              <h5>Payment Submitted Successfully!</h5>
              <p>Please enter your transaction ID below to complete your enrollment. Our admin will verify your payment and approve your enrollment.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="transaction-form-group">
              <label htmlFor="transactionId">Transaction ID</label>
              <input
                id="transactionId"
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter your transaction ID from Fapshi"
                className={error ? 'error' : ''}
                disabled={isSubmitting}
              />
              {error && <div className="transaction-error-message">{error}</div>}
            </div>

            <div className="transaction-modal-actions">
              <button 
                type="button"
                className="transaction-btn secondary" 
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="transaction-btn primary" 
                disabled={isSubmitting || !transactionId.trim()}
              >
                {isSubmitting ? (
                  <>
                    <div className="transaction-spinner"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <FiCheck />
                    Submit Transaction ID
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default TransactionIdModal
