import './GoogleButton.css'

function GoogleButton({ onClick }) {
  return (
    <button type="button" className="google-btn" onClick={onClick}>
      <div className="google-icon">
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
          <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a6.8 6.8 0 01-10.27-2.97h-2.6V13.01A8 8 0 008.98 17z"/>
          <path fill="#FBBC05" d="M4.41 10.05a6.8 6.8 0 010-4.1V4.01H1.81A8 8 0 000 8.98c0 1.45.35 2.82.97 4.07l2.44-2.02z"/>
          <path fill="#EA4335" d="M8.98 4.02c1.16 0 2.19.4 3.01 1.2l2.26-2.26A7.8 7.8 0 008.98.02a8 8 0 00-7.17 4.99l2.6 2.04c.64-1.93 2.4-3.03 4.57-3.03z"/>
        </svg>
      </div>
      Continue with Google
    </button>
  )
}

export default GoogleButton
