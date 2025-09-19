import './Button.css'

function Button({ children, type = 'button', onClick, disabled, full }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`btn ${full ? 'full' : ''}`}>
      {children}
    </button>
  )
}

export default Button
