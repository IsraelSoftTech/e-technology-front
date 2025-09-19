import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './PaymentSuccess.css';

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState('checking');
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState('');

  const reference = searchParams.get('ref');

  useEffect(() => {
    if (!reference) {
      setError('No payment reference found');
      setPaymentStatus('error');
      return;
    }

    checkPaymentStatus();
  }, [reference]);

  const checkPaymentStatus = async () => {
    try {
      const response = await api.checkPaymentStatus(reference);
      
      if (response.success) {
        setPaymentData(response.payment);
        setPaymentStatus(response.status);
      } else {
        setError(response.error || 'Payment verification failed');
        setPaymentStatus('error');
      }
    } catch (err) {
      console.error('Payment status check error:', err);
      setError('Failed to verify payment status');
      setPaymentStatus('error');
    }
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleRetryPayment = () => {
    navigate('/dashboard/courses');
  };

  if (paymentStatus === 'checking') {
    return (
      <div className="payment-success-container">
        <div className="payment-success-card">
          <div className="loading-spinner"></div>
          <h2>Verifying Payment...</h2>
          <p>Please wait while we verify your payment status.</p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'error') {
    return (
      <div className="payment-success-container">
        <div className="payment-success-card error">
          <div className="error-icon">❌</div>
          <h2>Payment Verification Failed</h2>
          <p>{error}</p>
          <div className="payment-actions">
            <button className="btn-secondary" onClick={handleRetryPayment}>
              Try Again
            </button>
            <button className="btn-primary" onClick={handleGoToDashboard}>
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="payment-success-container">
        <div className="payment-success-card success">
          <div className="success-icon">✅</div>
          <h2>Payment Successful!</h2>
          <p>Your payment has been processed successfully.</p>
          
          {paymentData && (
            <div className="payment-details">
              <div className="detail-row">
                <span>Course:</span>
                <span>{paymentData.courseTitle}</span>
              </div>
              <div className="detail-row">
                <span>Amount:</span>
                <span>{paymentData.amount} {paymentData.currency}</span>
              </div>
              <div className="detail-row">
                <span>Status:</span>
                <span className="status-success">Confirmed</span>
              </div>
            </div>
          )}

          <div className="payment-actions">
            <button className="btn-primary" onClick={handleGoToDashboard}>
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-success-container">
      <div className="payment-success-card">
        <div className="pending-icon">⏳</div>
        <h2>Payment Pending</h2>
        <p>Your payment is being processed. Please wait for confirmation.</p>
        <div className="payment-actions">
          <button className="btn-secondary" onClick={checkPaymentStatus}>
            Check Status
          </button>
          <button className="btn-primary" onClick={handleGoToDashboard}>
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccess;
