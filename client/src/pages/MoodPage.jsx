import { useEffect, useState } from 'react'
import { api } from '../api'

const MOODS = [
  { val: 1, emoji: '😫', label: 'גרוע' },
  { val: 2, emoji: '😞', label: 'רע' },
  { val: 3, emoji: '😐', label: 'בסדר' },
  { val: 4, emoji: '😊', label: 'טוב' },
  { val: 5, emoji: '😄', label: 'מעולה' },
]

export default function MoodPage() {
  const [history, setHistory] = useState([])
  const [selected, setSelected] = useState(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const data = await api.mood.history()
      setHistory(data)
    } catch {}
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

  return (
    <div className="page">
      <div className="page-header">
        <h2>😊 מצב רוח</h2>
        <span className="badge pink">ממוצע: {avg}/5</span>
      </div>

      <div className="two-col">
        <div className="card">
          <h3>איך אתה מרגיש היום?</h3>
          <div className="mood-grid">
            {MOODS.map(m => (
              <button
                key={m.val}
                type="button"
                className={`mood-btn${selected === m.val ? ' selected' : ''}`}
                onClick={() => { setSelected(m.val); setSaved(false) }}
              >
                <span className="mood-emoji">{m.emoji}</span>
                <span className="mood-label">{m.label}</span>
              </button>
            ))}
          </div>
          {saved && <p className="form-success">✅ מצב הרוח נשמר!</p>}
          <button
            className="btn-primary mt"
            onClick={handleSave}
            disabled={!selected || loading}
          >
            {loading ? 'שומר...' : '💾 שמור מצב רוח'}
          </button>
        </div>

        <div className="card">
          <h3>היסטוריית מצב רוח</h3>
          {history.length === 0
            ? <p className="empty-state">אין היסטוריה</p>
            : (
              <div className="mood-history">
                {history.map((h, i) => {
                  const m = MOODS.find(x => x.val === h.mood)
                  return (
                    <div key={i} className="mood-history-item">
                      <span className="mood-history-date">
                        {new Date(h.log_date).toLocaleDateString('he-IL')}
                      </span>
                      <span className="mood-history-val">
                        {m?.emoji} {m?.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          }
        </div>
      </div>
    </div>
  )
}