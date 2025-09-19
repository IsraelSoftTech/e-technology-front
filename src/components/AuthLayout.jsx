import Header from './Header'
import './AuthLayout.css'

function AuthLayout({ title, subtitle, children, topSpacing, cardTopMargin }) {
  return (
    <div className="auth-wrap">
      <Header />
      <div className="auth-main" style={topSpacing ? { paddingTop: topSpacing } : undefined}>
        <div className="auth-card" style={cardTopMargin ? { marginTop: cardTopMargin } : undefined}>
          <div className="titles">
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
