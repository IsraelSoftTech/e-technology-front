import './Logo.css'
import logo from '../assets/logo.png'

function Logo() {
  return (
    <div className="logo-wrap">
      <img src={logo} alt="E-TECH" className="logo-img" />
      <span className="logo-text">E-TECH</span>
    </div>
  )
}

export default Logo
