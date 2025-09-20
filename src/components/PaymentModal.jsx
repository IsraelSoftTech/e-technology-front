import { useState } from 'react'
import './PaymentModal.css'
import { FiX, FiExternalLink } from 'react-icons/fi'

function PaymentModal({ isOpen, onClose, course, onPaymentComplete }) {
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen || !course) return null

  const handlePayment = () => {
    if (!course.payment_link) {
      alert('Payment link not available for this course')
      return
    }

    setIsProcessing(true)
    
    // Open payment link in a new window/tab
    const paymentWindow = window.open(
      course.payment_link,
      'fapshi_payment',
      'width=800,height=600,scrollbars=yes,resizable=yes'
    )

    // Check if window was closed (payment completed)
    const checkClosed = setInterval(() => {
      if (paymentWindow.closed) {
        clearInterval(checkClosed)
        setIsProcessing(false)
        onPaymentComplete()
      }
    }, 1000)

    // Auto-close check after 5 minutes
    setTimeout(() => {
      if (!paymentWindow.closed) {
        paymentWindow.close()
        clearInterval(checkClosed)
        setIsProcessing(false)
      }
    }, 300000) // 5 minutes
  }

  return (
    <div className="payment-modal-backdrop">
      <div className="payment-modal-container">
        <div className="payment-modal-header">
          <h3>Complete Payment</h3>
          <button className="payment-close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="payment-modal-content">
          <div className="payment-course-info">
            <h4>{course.title}</h4>
            <p className="payment-course-cost">Cost: {course.cost || course.price_amount} XAF</p>
            <p className="payment-course-description">
              Complete your payment to enroll in this course
            </p>
          </div>

          <div className="payment-info">
            <div className="payment-info-box">
              <h5>Payment Instructions:</h5>
              <ol>
                <li>Click "Proceed to Payment" below</li>
                <li>Complete payment on Fapshi</li>
                <li>Copy your transaction ID</li>
                <li>Return here and submit your transaction ID</li>
              </ol>
            </div>
          </div>

          <div className="payment-modal-actions">
            <button 
              className="payment-btn secondary" 
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button 
              className="payment-btn primary" 
              onClick={handlePayment}
              disabled={isProcessing || !course.payment_link}
            >
              {isProcessing ? (
                <>
                  <div className="payment-spinner"></div>
                  Processing...
                </>
              ) : (
                <>
                  <FiExternalLink />
                  Proceed to Payment
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentModal
