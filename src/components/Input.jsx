import { useState } from 'react'
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai'
import './Input.css'

function Input({ label, type = 'text', name, value, onChange, placeholder, error, required, autoComplete }) {
  const isPassword = type === 'password'
  const [show, setShow] = useState(false)
  const actualType = isPassword ? (show ? 'text' : 'password') : type

  return (
    <div className="input-field">
      {label && <label htmlFor={name}>{label}{required ? ' *' : ''}</label>}
      <div className={`control ${isPassword ? 'with-eye' : ''}`}>
        <input
          id={name}
          name={name}
          type={actualType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
        />
        {isPassword && (
          <button type="button" className="eye" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>
            {show ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
          </button>
        )}
      </div>
      {error && <div className="error">{error}</div>}
    </div>
  )
}

export default Input
