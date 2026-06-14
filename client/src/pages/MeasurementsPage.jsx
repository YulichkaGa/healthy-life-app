import { useEffect, useState } from 'react'
import { api } from '../api'

const FIELDS = [
  { key: 'waist',     label: 'מותניים', icon: '📏' },
  { key: 'chest',     label: 'חזה',     icon: '💪' },
  { key: 'hips',      label: 'ירכיים',  icon: '📐' },
  { key: 'left_arm',  label: 'זרוע שמאל', icon: '💪' },
  { key: 'right_arm', label: 'זרוע ימין', icon: '💪' },
  { key: 'thighs',    label: 'ירך',     icon: '🦵' },
]

function diff(a, b) {
  if (a == null || b == null) return null
  const d = (Number(a) - Number(b)).toFixed(1)
  return d > 0 ? `+${d}` : d
}

function DiffBadge({ value }) {
  if (value === null || value === '0.0') return null
  const positive = value.startsWith('+')
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: positive ? '#ef4444' : '#16a34a', marginRight: 4 }}>
      {value} ס"מ
    </span>
  )
}

export default function MeasurementsPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ waist: '', chest: '', hips: '', left_arm: '', right_arm: '', thighs: '', notes: '', log_date: new Date().toISOString().slice(0, 10) })
  const [error, setError] = useState('')

  useEffect(() => {
    api.measurements.history()
      .then(setHistory)
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    const hasValue = FIELDS.some(f => form[f.key] !== '')
    if (!hasValue) return setError('יש למלא לפחות מדידה אחת')
    setSaving(true)
    setError('')
    try {
      const entry = await api.measurements.log(form)
      setHistory(prev => {
        const filtered = prev.filter(h => h.log_date !== entry.log_date)
        return [entry, ...filtered].sort((a, b) => b.log_date.localeCompare(a.log_date))
      })
      setForm({ waist: '', chest: '', hips: '', left_arm: '', right_arm: '', thighs: '', notes: '', log_date: new Date().toISOString().slice(0, 10) })
      setShowForm(false)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('למחוק מדידה זו?')) return
    await api.measurements.delete(id)
    setHistory(prev => prev.filter(h => h.id !== id))
  }

  const latest = history[0]
  const prev   = history[1]

  if (loading) return <div className="page-loading"><div className="spinner" />טוען...</div>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>📏 מדידות גוף</h2>
          <p className="page-subtitle">עקוב אחר מדידות הגוף לאורך זמן</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(v => !v)}>
          {showForm ? '✕ סגור' : '+ מדידה חדשה'}
        </button>
      </div>

      {latest && (
        <div className="card mb16">
          <h3>📊 מדידות אחרונות {prev && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>מול {new Date(prev.log_date).toLocaleDateString('he-IL')}</span>}</h3>
          <div className="measure-grid">
            {FIELDS.map(({ key, label, icon }) => latest[key] != null && (
              <div key={key} className="measure-stat">
                <div className="measure-icon">{icon}</div>
                <div className="measure-val">{latest[key]} <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>ס"מ</span></div>
                <div className="measure-label">{label}</div>
                {prev && <DiffBadge value={diff(latest[key], prev[key])} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="card mb16">
          <h3>📏 מדידה חדשה</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="field">
                <label>תאריך</label>
                <input type="date" value={form.log_date} onChange={e => setForm(f => ({ ...f, log_date: e.target.value }))} />
              </div>
              {FIELDS.map(({ key, label }) => (
                <div key={key} className="field">
                  <label>{label} (ס"מ)</label>
                  <input
                    type="number" step="0.1" min="0" max="300"
                    placeholder="0.0"
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="field span2">
                <label>הערות</label>
                <input
                  placeholder="הערות אופציונליות..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
              {error && <div className="form-error span2">{error}</div>}
              <button className="btn-primary span2" disabled={saving}>{saving ? 'שומר...' : 'שמור מדידה'}</button>
            </div>
          </form>
        </div>
      )}

      {history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📏</div>
          <div>עוד אין מדידות</div>
          <div style={{ fontSize: 12 }}>הוסף את המדידה הראשונה שלך</div>
        </div>
      ) : (
        <div className="card">
          <h3>📅 היסטוריה</h3>
          <div className="measure-history">
            {history.map((entry, i) => (
              <div key={entry.id} className="measure-entry">
                <div className="measure-entry-date">
                  {new Date(entry.log_date).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' })}
                  {i === 0 && <span className="badge green" style={{ marginRight: 8 }}>אחרון</span>}
                </div>
                <div className="measure-entry-values">
                  {FIELDS.map(({ key, label }) => entry[key] != null && (
                    <span key={key} className="item-tag blue">{label}: {entry[key]}</span>
                  ))}
                </div>
                {entry.notes && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{entry.notes}</div>}
                <button className="btn-danger" style={{ marginTop: 4 }} onClick={() => handleDelete(entry.id)}>🗑</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
