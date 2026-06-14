import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('token')
    if (t) {
      api.auth.me()
        .then(setUser)
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  async function login(email, password) {
    const { token, user } = await api.auth.login({ email, password })
    localStorage.setItem('token', token)
    setUser(user)
  }

  async function register(name, email, password) {
    const { token, user } = await api.auth.register({ name, email, password })
    localStorage.setItem('token', token)
    setUser(user)
  }

  function logout() {
    localStorage.removeItem('token')
    setUser(null)
  }

  function updateUser(data) {
    setUser(u => ({ ...u, ...data }))
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)