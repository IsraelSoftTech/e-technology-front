import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        if (token) {
          api.setToken(token)
          const response = await api.getCurrentUser()
          setUser(response.user)
        }
      } catch (error) {
        console.error('Auth initialization failed:', error)
        api.logout()
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (username, password) => {
    try {
      const response = await api.login(username, password)
      setUser(response.user)
      return response
    } catch (error) {
      throw error
    }
  }

  const register = async (userData) => {
    try {
      // Do not log the user in on registration. Just perform the request
      // and return the response so the UI can show a success message
      // and redirect to the sign-in page.
      const response = await api.register(userData)
      return response
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    api.logout()
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
