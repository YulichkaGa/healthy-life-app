import { useEffect, useState } from 'react'
import { api } from '../api'

const ICONS = ['✅', '🏃', '💧', '📚', '🧘', '🥗', '💊', '🛌', '🎯', '💪', '🌿', '☀️', '🧘‍♀️', '🚴', '🎨', '✍️']
const COLORS = ['#16a34a', '#3b82f6', '#f97316', '#a855f7', '#ec4899', '#6366f1', '#14b8a6', '#ef4444']

function HabitCard({ habit, onToggle, onDelete }) {
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    await onToggle(habit.id)
    setLoading(false)
  }

  return (
    <div className={`habit-card${habit.done_today ? ' done' : ''}`} style={{ '--hcolor': habit.color }}>
      <button
        className="habit-check"
        onClick={handleToggle}
        disabled={loading}
        style={{ borderColor: habit.color, background: habit.done_today ? habit.color : 'transparent' }}
      >
        {habit.done_today ? '✓' : ''}
      </button>
      <span className="habit-icon">{habit.icon}</span>
      <div className="habit-info">
        <div className="habit-name">{habit.name}</div>
        <div className="habit-count">{habit.total_done} ✓ ביצועים</div>
      </div>
      <button className="btn-danger" onClick={() => onDelete(habit.id)} title="מחק הרגל">🗑</button>
    </div>
  )
}

export default function HabitsPage() {
  const [habits, setHabits]   = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', icon: '✅', color: '#16a34a' })

  useEffect(() => {
    api.habits.get()
      .then(setHabits)
      .finally(() => setLoading(false))
  }, [])

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const h = await api.habits.create(form)
      setHabits(prev => [...prev, h])
      setForm({ name: '', icon: '✅', color: '#16a34a' })
      setShowForm(false)
    } finally { setSaving(false) }
  }

  async function handleToggle(id) {
    const res = await api.habits.toggle(id)
    setHabits(prev => prev.map(h =>
      h.id === id
        ? { ...h, done_today: res.done_today ? 1 : 0, total_done: res.done_today ? h.total_done + 1 : h.total_done - 1 }
        : h
    ))
  }

  async function handleDelete(id) {
    if (!confirm('למחוק את ההרגל?')) return
    await api.habits.delete(id)
    setHabits(prev => prev.filter(h => h.id !== id))
  }

  const doneCount  = habits.filter(h => h.done_today).length
  const totalCount = habits.length

  if (loading) return <div className="page-loading"><div className="spinner" />טוען...</div>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>🎯 הרגלים יומיים</h2>
          <p className="page-subtitle">עקוב אחר ההרגלים שלך כל יום</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(v => !v)}>
          {showForm ? '✕ סגור' : '+ הרגל חדש'}
        </button>
      </div>

      {totalCount > 0 && (
        <div className="habits-progress-bar card mb16">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>התקדמות היום</span>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#16a34a' }}>{doneCount}/{totalCount}</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${totalCount ? (doneCount / totalCount) * 100 : 0}%`, background: '#16a34a' }}
            />
          </div>
        </div>
      )}

      {showForm && (
        <div className="card mb16">
          <h3>✨ הרגל חדש</h3>
          <form onSubmit={handleAdd}>
            <div className="field mb16">
              <label>שם ההרגל</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="לדוגמה: לשתות מים בבוקר"
                required
                autoFocus
              />
            </div>
            <div className="field mb16">
              <label>אייקון</label>
              <div className="habit-icon-picker">
                {ICONS.map(ic => (
                  <button
                    key={ic} type="button"
                    className={`habit-icon-btn${form.icon === ic ? ' selected' : ''}`}
                    onClick={() => setForm(f => ({ ...f, icon: ic }))}
                  >{ic}</button>
                ))}
              </div>
            </div>
            <div className="field mb16">
              <label>צבע</label>
              <div className="habit-color-picker">
                {COLORS.map(c => (
                  <button
                    key={c} type="button"
                    className={`habit-color-btn${form.color === c ? ' selected' : ''}`}
                    style={{ background: c, outline: form.color === c ? `3px solid ${c}` : 'none', outlineOffset: 2 }}
                    onClick={() => setForm(f => ({ ...f, color: c }))}
                  />
                ))}
              </div>
            </div>
            <button className="btn-primary full" disabled={saving || !form.name.trim()}>
              {saving ? 'שומר...' : 'הוסף הרגל'}
            </button>
          </form>
        </div>
      )}

      {habits.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <div>עוד אין הרגלים</div>
          <div style={{ fontSize: 12 }}>הוסף הרגל ראשון כדי להתחיל</div>
        </div>
      ) : (
        <div className="habits-list">
          {habits.map(h => (
            <HabitCard key={h.id} habit={h} onToggle={handleToggle} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
