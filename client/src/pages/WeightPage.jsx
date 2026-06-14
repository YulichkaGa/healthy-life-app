import { useEffect, useState } from 'react'
import { api } from '../api'
import { dayLabel } from '../utils/dateUtils'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'

function bmiCategory(bmi) {
  if (bmi < 18.5) return { label: 'תת-משקל',  color: '#3b82f6' }
  if (bmi < 25)   return { label: 'תקין',      color: '#22c55e' }
  if (bmi < 30)   return { label: 'עודף משקל', color: '#f97316' }
  return              { label: 'השמנה',        color: '#ef4444' }
}

export default function WeightPage() {
  const [history, setHistory]   = useState([])
  const [weight, setWeight]     = useState('')
  const [notes, setNotes]       = useState('')
  const [height, setHeight]     = useState(170)
  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [hist, profile] = await Promise.all([
        api.weight.history(),
        api.weight.getProfile(),
      ])
      setHistory(hist)
      setHeight(profile.height_cm || 170)
    } catch {
      setError('שגיאה בטעינת הנתונים.')
    } finally {
      setLoading(false)
    }
  }

  async function handleLog(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const entry = await api.weight.log({ weight_kg: Number(weight), notes })
      setHistory(h => {
        const filtered = h.filter(x => x.log_date !== entry.log_date)
        return [entry, ...filtered].sort((a, b) => b.log_date.localeCompare(a.log_date))
      })
      setWeight('')
      setNotes('')
    } catch (err) {
      setError(err.message || 'שגיאה בשמירת המשקל.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    try {
      await api.weight.delete(id)
      setHistory(h => h.filter(x => x.id !== id))
    } catch {
      setError('שגיאה במחיקה.')
    }
  }

  async function handleHeightSave() {
    try {
      await api.weight.updateProfile({ height_cm: height })
    } catch {
      setError('שגיאה בשמירת הגובה.')
    }
  }

  const latest   = history[0]
  const previous = history[1]
  const bmi      = latest ? +(latest.weight_kg / ((height / 100) ** 2)).toFixed(1) : null
  const bmiCat   = bmi ? bmiCategory(bmi) : null
  const diff     = latest && previous ? +(latest.weight_kg - previous.weight_kg).toFixed(1) : null

  const chartData = [...history].reverse().slice(-30).map(h => ({
    date:   dayLabel(h.log_date),
    weight: Number(h.weight_kg),
  }))

  if (loading) return <div className="page-loading"><div className="spinner" />טוען...</div>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>⚖️ מעקב משקל</h2>
          <p className="page-subtitle">מעקב אחרי המשקל ומדד ה-BMI</p>
        </div>
        {latest && (
          <div className="totals-row">
            <span className="badge green">⚖️ {latest.weight_kg} ק״ג</span>
            {bmi && <span className="badge" style={{ background: bmiCat.color + '22', color: bmiCat.color }}>BMI {bmi}</span>}
          </div>
        )}
      </div>

      {/* BMI + diff summary */}
      {bmi && (
        <div className="weight-summary card mb16">
          <div className="weight-stat">
            <div className="weight-stat-val" style={{ color: bmiCat.color }}>{bmi}</div>
            <div className="weight-stat-label">BMI — {bmiCat.label}</div>
          </div>
          <div className="weight-stat">
            <div className="weight-stat-val">{latest.weight_kg} ק״ג</div>
            <div className="weight-stat-label">משקל נוכחי</div>
          </div>
          {diff !== null && (
            <div className="weight-stat">
              <div className="weight-stat-val" style={{ color: diff < 0 ? '#22c55e' : diff > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                {diff > 0 ? '+' : ''}{diff} ק״ג
              </div>
              <div className="weight-stat-label">מהרשומה הקודמת</div>
            </div>
          )}
        </div>
      )}

      <div className="two-col">
        <div className="card">
          <h3>➕ רשום משקל</h3>
          <form onSubmit={handleLog} className="form-grid">
            <div className="field span2">
              <label>משקל (ק״ג)</label>
              <input
                type="number" step="0.1" min="20" max="300"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                placeholder="70.5"
                required
              />
            </div>
            <div className="field span2">
              <label>הערות (אופציונלי)</label>
              <input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="בוקר לפני אכילה..."
              />
            </div>
            {error && <p className="form-error span2">{error}</p>}
            <button type="submit" className="btn-primary span2" disabled={saving}>
              {saving ? 'שומר...' : '💾 שמור משקל'}
            </button>
          </form>

          <div style={{ borderTop: '1px solid var(--border)', marginTop: 18, paddingTop: 16 }}>
            <h3 style={{ marginBottom: 12 }}>📏 גובה לחישוב BMI</h3>
            <div className="inline-form">
              <input
                type="number" min="100" max="250"
                value={height}
                onChange={e => setHeight(Number(e.target.value))}
                style={{ width: 90 }}
              />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>ס״מ</span>
              <button type="button" className="btn-primary" onClick={handleHeightSave}>
                💾 שמור
              </button>
            </div>
          </div>
        </div>

        <div>
          {chartData.length > 1 && (
            <div className="card mb16">
              <h3>📈 מגמת משקל</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12, background: 'var(--card)', color: 'var(--text)' }}
                    formatter={v => [`${v} ק״ג`, 'משקל']}
                  />
                  <Line type="monotone" dataKey="weight" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366f1' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="card">
            <h3>📅 היסטוריית משקל</h3>
            {history.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">⚖️</span>
                <span>לא נרשמו מדידות עדיין</span>
              </div>
            ) : (
              <div className="sleep-list">
                {history.map(h => (
                  <div key={h.id} className="sleep-item">
                    <div className="sleep-date">
                      {new Date(h.log_date).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                    <div className="sleep-stats">
                      <span className="item-tag indigo">{h.weight_kg} ק״ג</span>
                      {h.notes && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{h.notes}</span>}
                      <button className="btn-danger" onClick={() => handleDelete(h.id)} title="מחק">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
