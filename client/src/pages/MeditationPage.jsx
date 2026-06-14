import { useEffect, useState, useRef } from 'react'
import { api } from '../api'

const TYPES = [
  { key: 'mindfulness',  label: 'מיינדפולנס', icon: '🧘', desc: 'מודעות לרגע הנוכחי' },
  { key: 'breathing',    label: 'נשימות',      icon: '🌬️', desc: 'תרגול נשימה מודעת' },
  { key: 'body-scan',    label: 'סריקת גוף',   icon: '🫁', desc: 'רלקסציה של כל הגוף' },
  { key: 'visualization',label: 'ויזואליזציה', icon: '🌈', desc: 'דמיון מודרך' },
]

const MOODS = [
  { v: 1, emoji: '😞', label: 'קשה' },
  { v: 2, emoji: '😐', label: 'בסדר' },
  { v: 3, emoji: '🙂', label: 'טוב' },
  { v: 4, emoji: '😊', label: 'מצוין' },
  { v: 5, emoji: '🤩', label: 'נהדר' },
]

const PRESET_DURATIONS = [5, 10, 15, 20, 30]

function StatTile({ icon, value, label, color }) {
  return (
    <div className="stat-card" style={{ '--stat-accent': color }}>
      <div style={{ fontSize: 32, marginBottom: 4 }}>{icon}</div>
      <div className="stat-num" style={{ color, fontSize: 24 }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function MoodPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {MOODS.map(m => (
        <button
          key={m.v} type="button"
          onClick={() => onChange(m.v)}
          style={{
            flex: 1, padding: '8px 4px', border: `1.5px solid ${value === m.v ? '#16a34a' : 'var(--border)'}`,
            borderRadius: 8, background: value === m.v ? 'var(--green-light)' : 'var(--bg)',
            cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, transition: 'all .15s',
          }}
        >
          <span style={{ fontSize: 22 }}>{m.emoji}</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{m.label}</span>
        </button>
      ))}
    </div>
  )
}

export default function MeditationPage() {
  const [history, setHistory] = useState([])
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ duration: 10, type: 'mindfulness', mood_before: null, mood_after: null, notes: '' })
  const [error, setError]   = useState('')
  const [timer, setTimer]   = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    Promise.allSettled([api.meditation.history(), api.meditation.stats()]).then(([h, s]) => {
      if (h.status === 'fulfilled') setHistory(h.value)
      if (s.status === 'fulfilled') setStats(s.value)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (timer === 'running') {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [timer])

  function startTimer() { setElapsed(0); setTimer('running') }
  function stopTimer()  { setTimer('done'); setForm(f => ({ ...f, duration: Math.max(1, Math.round(elapsed / 60)) })) }
  function resetTimer() { setTimer(null); setElapsed(0) }

  function fmt(s) { return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const entry = await api.meditation.log(form)
      setHistory(prev => [entry, ...prev])
      setStats(prev => prev ? {
        sessions:      Number(prev.sessions) + 1,
        total_minutes: Number(prev.total_minutes) + entry.duration,
        avg_duration:  ((Number(prev.total_minutes) + entry.duration) / (Number(prev.sessions) + 1)).toFixed(1),
        best_session:  Math.max(Number(prev.best_session || 0), entry.duration),
      } : null)
      setForm({ duration: 10, type: 'mindfulness', mood_before: null, mood_after: null, notes: '' })
      resetTimer()
      setShowForm(false)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('למחוק מדיטציה זו?')) return
    await api.meditation.delete(id)
    setHistory(prev => prev.filter(h => h.id !== id))
  }

  const typeLabels = Object.fromEntries(TYPES.map(t => [t.key, `${t.icon} ${t.label}`]))

  if (loading) return <div className="page-loading"><div className="spinner" />טוען...</div>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>🧘 מדיטציה ומיינדפולנס</h2>
          <p className="page-subtitle">פנה זמן לעצמך ולנפשך</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowForm(v => !v); resetTimer() }}>
          {showForm ? '✕ סגור' : '+ תיעוד מדיטציה'}
        </button>
      </div>

      {stats && (
        <div className="stats-grid" style={{ marginBottom: 22 }}>
          <StatTile icon="🧘" value={stats.sessions}      label="סשנים"         color="#6366f1" />
          <StatTile icon="⏱️" value={stats.total_minutes} label="דקות סה״כ"     color="#a855f7" />
          <StatTile icon="📊" value={stats.avg_duration}  label="ממוצע לסשן"    color="#3b82f6" />
          <StatTile icon="🏆" value={stats.best_session}  label="הסשן הטוב ביותר (דקות)" color="#f97316" />
        </div>
      )}

      {showForm && (
        <div className="card mb16">
          <h3>✨ תיעוד מדיטציה</h3>

          <div className="meditation-timer">
            <div className="timer-display">{fmt(elapsed)}</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 10 }}>
              {timer !== 'running' && <button className="btn-primary" type="button" onClick={startTimer}>▶ התחל טיימר</button>}
              {timer === 'running' && <button className="btn-secondary" type="button" onClick={stopTimer}>⏹ עצור ורשום</button>}
              {timer && <button className="btn-secondary" type="button" onClick={resetTimer}>↺ איפוס</button>}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
            <div className="field mb16">
              <label>משך (דקות)</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                {PRESET_DURATIONS.map(d => (
                  <button
                    key={d} type="button"
                    className={form.duration === d ? 'btn-primary' : 'btn-secondary'}
                    style={{ padding: '6px 14px', fontSize: 13 }}
                    onClick={() => setForm(f => ({ ...f, duration: d }))}
                  >{d} דק׳</button>
                ))}
              </div>
              <input
                type="number" min="1" max="300"
                value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                placeholder="מספר דקות"
              />
            </div>

            <div className="field mb16">
              <label>סוג מדיטציה</label>
              <div className="meditation-types">
                {TYPES.map(t => (
                  <button
                    key={t.key} type="button"
                    className={`meditation-type-btn${form.type === t.key ? ' selected' : ''}`}
                    onClick={() => setForm(f => ({ ...f, type: t.key }))}
                  >
                    <span style={{ fontSize: 24 }}>{t.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{t.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="field mb16">
              <label>מצב לפני</label>
              <MoodPicker value={form.mood_before} onChange={v => setForm(f => ({ ...f, mood_before: v }))} />
            </div>
            <div className="field mb16">
              <label>מצב אחרי</label>
              <MoodPicker value={form.mood_after} onChange={v => setForm(f => ({ ...f, mood_after: v }))} />
            </div>
            <div className="field mb16">
              <label>הערות</label>
              <input
                placeholder="תחושות, תובנות..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>

            {error && <div className="form-error">{error}</div>}
            <button className="btn-primary full mt" disabled={saving}>{saving ? 'שומר...' : '💾 שמור מדיטציה'}</button>
          </form>
        </div>
      )}

      {history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🧘</div>
          <div>עוד אין סשנים מתועדים</div>
          <div style={{ fontSize: 12 }}>תעד את מדיטציה הראשונה שלך</div>
        </div>
      ) : (
        <div className="card">
          <h3>📅 היסטוריה</h3>
          <div className="item-list">
            {history.map(entry => {
              const moodBefore = MOODS.find(m => m.v === entry.mood_before)
              const moodAfter  = MOODS.find(m => m.v === entry.mood_after)
              return (
                <div key={entry.id} className="item-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div>
                      <div className="item-name">{typeLabels[entry.type] || entry.type}</div>
                      <div className="item-meta">
                        {new Date(entry.log_date).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' })}
                        {moodBefore && moodAfter && ` · ${moodBefore.emoji}→${moodAfter.emoji}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="item-tag purple">{entry.duration} דקות</span>
                      <button className="btn-danger" onClick={() => handleDelete(entry.id)}>🗑</button>
                    </div>
                  </div>
                  {entry.notes && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{entry.notes}</div>}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
