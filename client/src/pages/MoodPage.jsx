import { useEffect, useState } from 'react'
import { api } from '../api'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'

const MOODS = [
  { val: 1, emoji: '😫', label: 'גרוע' },
  { val: 2, emoji: '😞', label: 'רע' },
  { val: 3, emoji: '😐', label: 'בסדר' },
  { val: 4, emoji: '😊', label: 'טוב' },
  { val: 5, emoji: '😄', label: 'מעולה' },
]

function dayLabel(dateStr) {
  return new Date(dateStr).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })
}

function MoodTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const m = MOODS.find(x => x.val === payload[0].value)
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 12px', fontSize: 12 }}>
      {payload[0].payload.date} — {m?.emoji} {m?.label}
    </div>
  )
}

export default function MoodPage() {
  const [history, setHistory] = useState([])
  const [selected, setSelected] = useState(null)
  const [saved, setSaved]       = useState(false)
  const [loading, setLoading]   = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try { setHistory(await api.mood.history()) } catch {}
  }

  async function handleSave() {
    if (!selected) return
    setLoading(true)
    setSaved(false)
    try {
      await api.mood.log(selected)
      setSaved(true)
      load()
    } catch {}
    setLoading(false)
  }

  const avg = history.length
    ? (history.reduce((s, h) => s + (h.mood || 0), 0) / history.length).toFixed(1)
    : 0

  const chartData = [...history].reverse().slice(-14).map(h => ({
    date: dayLabel(h.log_date),
    מצב: h.mood,
  }))

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>😊 מצב רוח</h2>
          <p className="page-subtitle">עקוב אחרי הרגשות שלך</p>
        </div>
        {history.length > 0 && <span className="badge pink">ממוצע: {avg}/5</span>}
      </div>

      <div className="two-col">
        <div className="card">
          <h3>איך אתה מרגיש היום?</h3>
          <div className="mood-grid">
            {MOODS.map(m => (
              <button
                key={m.val} type="button"
                className={`mood-btn${selected === m.val ? ' selected' : ''}`}
                onClick={() => { setSelected(m.val); setSaved(false) }}
              >
                <span className="mood-emoji">{m.emoji}</span>
                <span className="mood-label">{m.label}</span>
              </button>
            ))}
          </div>
          {saved && <p className="form-success">✅ מצב הרוח נשמר!</p>}
          <button className="btn-primary mt" onClick={handleSave} disabled={!selected || loading}>
            {loading ? 'שומר...' : '💾 שמור מצב רוח'}
          </button>
        </div>

        <div>
          {chartData.length > 1 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h3>📈 מגמת מצב רוח — 14 ימים</h3>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
                  <Tooltip content={<MoodTooltip />} />
                  <ReferenceLine y={3} stroke="#e2e8f0" strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="מצב" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 4, fill: '#ec4899' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="card">
            <h3>📅 היסטוריית מצב רוח</h3>
            {history.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">💭</span>
                <span>אין היסטוריית מצב רוח</span>
              </div>
            ) : (
              <div className="mood-history">
                {history.map((h, i) => {
                  const m = MOODS.find(x => x.val === h.mood)
                  return (
                    <div key={i} className="mood-history-item">
                      <span className="mood-history-date">{new Date(h.log_date).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                      <span className="mood-history-val">{m?.emoji} {m?.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}