import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Header from './components/Header'
import Landing from './components/Landing'
import Signin from './components/Signin'
import Signup from './components/Signup'
import Dashboard from './components/Dashboard'
import PaymentSuccess from './components/PaymentSuccess'
import './App.css'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <Routes>
      <Route path="/" element={!user ? <Landing /> : <Navigate to="/dashboard" replace />} />
      <Route path="/signin" element={!user ? <Signin /> : <Navigate to="/dashboard" replace />} />
      <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/dashboard" replace />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/dashboard/*" element={user ? <Dashboard /> : <Navigate to="/signin" replace />} />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
