import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AuthLayout from './AuthLayout'
import Input from './Input'
import Button from './Button'
import GoogleButton from './GoogleButton'
import Divider from './Divider'
import './Signin.css'

function Signin() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  
  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(form.username, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = () => {
    console.log('Google auth')
  }

  return (
    <AuthLayout title="Sign in">
      <GoogleButton onClick={handleGoogleAuth} />
      <Divider text="Or" />
      <form className="form" onSubmit={onSubmit}>
        {error && <div className="error-message">{error}</div>}
        <Input label="Username" name="username" type="text" value={form.username} onChange={onChange} placeholder="Enter username" required />
        <Input label="Password" name="password" type="password" value={form.password} onChange={onChange} placeholder="Enter password" required />
        <div className="forgot-password">
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
        <Button type="submit" full disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
      <div className="alt">
        Don't have an account? <Link to="/signup">Sign up</Link>
      </div>
    </AuthLayout>
  )
}

export default Signin
