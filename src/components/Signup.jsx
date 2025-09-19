import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AuthLayout from './AuthLayout'
import Input from './Input'
import Button from './Button'
import GoogleButton from './GoogleButton'
import Divider from './Divider'
import './Signup.css'

function Signup() {
  const [form, setForm] = useState({ fullName: '', username: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const { register } = useAuth()
  const navigate = useNavigate()

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const validate = () => {
    const next = {}
    if (!form.fullName.trim()) next.fullName = 'Full name is required'
    if (!form.username.trim()) next.username = 'Username is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Valid email is required'
    if (form.password.length < 6) next.password = 'Min 6 characters'
    if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    
    setError('')
    setLoading(true)

    try {
      await register({
        name: form.fullName,
        username: form.username,
        email: form.email,
        password: form.password,
        role: 'student'
      })
      
      // Show success message
      setSuccess(true)
      setLoading(false)
      
      // Start countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            navigate('/signin')
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleGoogleAuth = () => {
    console.log('Google auth')
  }

  if (success) {
    return (
      <AuthLayout title="Account Created!" topSpacing="16rem" cardTopMargin="calc(2rem + 40px)">
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h2 className="success-title">Welcome to E-TECH</h2>
          <p className="success-message">
            Your account was created successfully. Please sign in to continue.
          </p>
          <div className="redirect-timer">
            Redirecting in <span className="countdown">{countdown}</span> seconds...
          </div>
          <div style={{ marginTop: '1.25rem' }}>
            <Button onClick={() => navigate('/signin')} full>Sign in now</Button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Sign up" topSpacing="16rem" cardTopMargin="calc(2rem + 40px)">
      <GoogleButton onClick={handleGoogleAuth} />
      <Divider text="Or" />
      <form className="form" onSubmit={onSubmit}>
        {error && <div className="error-message">{error}</div>}
        <Input label="Full name" name="fullName" value={form.fullName} onChange={onChange} placeholder="Enter your full name" required error={errors.fullName} />
        <Input label="Username" name="username" type="text" value={form.username} onChange={onChange} placeholder="Enter your username" required error={errors.username} />
        <Input label="Email" name="email" type="email" value={form.email} onChange={onChange} placeholder="Enter your email" required error={errors.email} />
        <Input label="Password" name="password" type="password" value={form.password} onChange={onChange} placeholder="Create a password" required error={errors.password} />
        <Input label="Confirm password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={onChange} placeholder="Confirm your password" required error={errors.confirmPassword} />
        <Button type="submit" full disabled={loading}>
          {loading ? 'Creating account...' : 'Sign up'}
        </Button>
      </form>
      <div className="alt">
        Already have an account? <Link to="/signin">Sign in</Link>
      </div>
    </AuthLayout>
  )
}

export default Signup
