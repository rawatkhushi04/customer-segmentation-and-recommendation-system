import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    const token  = localStorage.getItem('token')
    if (stored && token) setUser(JSON.parse(stored))
    setLoading(false)
  }, [])

  const register = async (username, email, password) => {
    const { data } = await api.post('/auth/register', { username, email, password })
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('user', JSON.stringify({
      customer_id: data.customer_id,
      username:    data.username,
      role:        data.role || 'user',
      is_admin:    !!data.is_admin,
    }))
    setUser({
      customer_id: data.customer_id,
      username: data.username,
      role: data.role || 'user',
      is_admin: !!data.is_admin,
    })
    return data
  }

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('user', JSON.stringify({
      customer_id: data.customer_id,
      username:    data.username,
      role:        data.role || 'user',
      is_admin:    !!data.is_admin,
    }))
    setUser({
      customer_id: data.customer_id,
      username: data.username,
      role: data.role || 'user',
      is_admin: !!data.is_admin,
    })
    return data
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
