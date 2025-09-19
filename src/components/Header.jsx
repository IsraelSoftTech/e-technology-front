import { Link, useLocation } from 'react-router-dom'
import Logo from './Logo'
import './Header.css'

function Header() {
  const location = useLocation()
  const isSignin = location.pathname === '/signin'
  const isSignup = location.pathname === '/signup'

  return (
    <header className="header">
      <div className="header-content">
        <Logo />
        <nav className="nav">
          <Link to="/signup" className={`nav-link ${isSignup ? 'active' : ''}`}>Sign up</Link>
          <Link to="/signin" className={`nav-link ${isSignin ? 'active' : ''}`}>Sign in</Link>
        </nav>
      </div>
    </header>
  )
}

export default Header
