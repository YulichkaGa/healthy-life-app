import { useState } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()

  const [name, setName]   = useState(user?.name  || '')
  const [email, setEmail] = useState(user?.email || '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg]       = useState(null)

  const [curPass, setCurPass]   = useState('')
  const [newPass, setNewPass]   = useState('')
  const [confPass, setConfPass] = useState('')
  const [passSaving, setPassSaving] = useState(false)
  const [passMsg, setPassMsg]       = useState(null)

  async function handleProfile(e) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileMsg(null)
    try {
      const updated = await api.auth.updateProfile({ name, email })
      updateUser(updated)
      setProfileMsg({ ok: true, text: '✅ הפרופיל עודכן בהצלחה!' })
    } catch (err) {
      setProfileMsg({ ok: false, text: err.message || 'שגיאה בעדכון הפרופיל.' })
    } finally {
      setProfileSaving(false)
    }
  }

  async function handlePassword(e) {
    e.preventDefault()
    setPassMsg(null)
    if (newPass !== confPass) {
      setPassMsg({ ok: false, text: 'הסיסמאות החדשות אינן תואמות.' })
      return
    }
    setPassSaving(true)
    try {
      await api.auth.updatePassword({ current_password: curPass, new_password: newPass })
      setPassMsg({ ok: true, text: '✅ הסיסמה שונתה בהצלחה!' })
      setCurPass('')
      setNewPass('')
      setConfPass('')
    } catch (err) {
      setPassMsg({ ok: false, text: err.message || 'שגיאה בשינוי הסיסמה.' })
    } finally {
      setPassSaving(false)
    }
  }

  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>👤 פרופיל</h2>
          <p className="page-subtitle">נהל את פרטי החשבון שלך</p>
        </div>
      </div>

      <div className="profile-wrap">
        {/* Avatar + summary */}
        <div className="card profile-hero">
          <div className="profile-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div className="profile-hero-info">
            <div className="profile-hero-name">{user?.name}</div>
            <div className="profile-hero-email">{user?.email}</div>
            {joinedDate && <div className="profile-hero-joined">חבר מאז {joinedDate}</div>}
          </div>
        </div>

        {/* Edit profile */}
        <div className="card settings-form">
          <h3 className="settings-section-title">✏️ עדכון פרטים</h3>
          <form onSubmit={handleProfile}>
            <div className="settings-row">
              <label className="settings-label">
                <span className="settings-icon">👤</span>
                <span>שם מלא</span>
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="settings-input"
                style={{ width: 200 }}
                required
              />
            </div>
            <div className="settings-row">
              <label className="settings-label">
                <span className="settings-icon">✉️</span>
                <span>אימייל</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="settings-input"
                style={{ width: 200 }}
                required
              />
            </div>
            {profileMsg && (
              <p className={profileMsg.ok ? 'form-success' : 'form-error'} style={{ marginTop: 8 }}>
                {profileMsg.text}
              </p>
            )}
            <button type="submit" className="btn-primary" style={{ marginTop: 16 }} disabled={profileSaving}>
              {profileSaving ? 'שומר...' : '💾 שמור פרטים'}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div className="card settings-form">
          <h3 className="settings-section-title">🔒 שינוי סיסמה</h3>
          <form onSubmit={handlePassword}>
            <div className="settings-row">
              <label className="settings-label">
                <span className="settings-icon">🔑</span>
                <span>סיסמה נוכחית</span>
              </label>
              <input
                type="password"
                value={curPass}
                onChange={e => setCurPass(e.target.value)}
                className="settings-input"
                style={{ width: 200 }}
                required
              />
            </div>
            <div className="settings-row">
              <label className="settings-label">
                <span className="settings-icon">🔒</span>
                <span>סיסמה חדשה</span>
              </label>
              <input
                type="password"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                className="settings-input"
                style={{ width: 200 }}
                minLength={6}
                required
              />
            </div>
            <div className="settings-row">
              <label className="settings-label">
                <span className="settings-icon">✅</span>
                <span>אימות סיסמה</span>
              </label>
              <input
                type="password"
                value={confPass}
                onChange={e => setConfPass(e.target.value)}
                className="settings-input"
                style={{ width: 200 }}
                required
              />
            </div>
            {passMsg && (
              <p className={passMsg.ok ? 'form-success' : 'form-error'} style={{ marginTop: 8 }}>
                {passMsg.text}
              </p>
            )}
            <button type="submit" className="btn-primary" style={{ marginTop: 16 }} disabled={passSaving}>
              {passSaving ? 'משנה...' : '🔒 שנה סיסמה'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
