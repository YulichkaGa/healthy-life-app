import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo-box">🌿</div>
        <h1 className="auth-title">HealthyLife</h1>
        <p className="auth-subtitle">ברוך הבא! התחבר לחשבונך</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>אימייל</label>
            <input
              type="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com" required
            />
          </div>
          <div className="field">
            <label>סיסמה</label>
            <input
              type="password" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••" required
            />
          </div>
          {error && <p style={{ color: '#dc2626', fontSize: 13 }}>{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'מתחבר...' : 'התחברות'}
          </button>
        </form>
        <p className="auth-switch">
          אין לך חשבון? <Link to="/register">הרשמה</Link>
        </p>
      </div>
    </div>
  )
}