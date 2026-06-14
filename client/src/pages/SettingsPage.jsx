import { useEffect, useState } from 'react'
import { api } from '../api'

const DEFAULTS = { calories: 2000, protein: 120, carbs: 250, water: 8, steps: 10000, sleep_hours: 8 }

const FIELDS = [
  { key: 'calories',    label: 'קלוריות יומיות',    unit: 'קק״ל', icon: '🔥', min: 500,  max: 6000 },
  { key: 'protein',     label: 'חלבון יומי',         unit: 'גרם',  icon: '🥩', min: 10,   max: 500  },
  { key: 'carbs',       label: 'פחמימות יומיות',     unit: 'גרם',  icon: '🌾', min: 10,   max: 800  },
  { key: 'water',       label: 'כוסות מים יומיות',   unit: 'כוסות',icon: '💧', min: 1,    max: 20   },
  { key: 'steps',       label: 'צעדים יומיים',        unit: 'צעדים',icon: '👟', min: 1000, max: 50000},
  { key: 'sleep_hours', label: 'שעות שינה יעד',      unit: 'שעות', icon: '😴', min: 3,    max: 12   },
]

export default function SettingsPage() {
  const [goals, setGoals]   = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    api.goals.get()
      .then(g => setGoals({ ...DEFAULTS, ...g }))
      .catch(() => setError('שגיאה בטעינת היעדים.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      const updated = await api.goals.update(goals)
      setGoals({ ...DEFAULTS, ...updated })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('שגיאה בשמירת היעדים. אנא נסה שוב.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="page-loading"><div className="spinner" />טוען...</div>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>⚙️ הגדרות יעדים</h2>
          <p className="page-subtitle">התאם את היעדים היומיים שלך</p>
        </div>
      </div>

      <div className="settings-wrap">
        <form onSubmit={handleSubmit} className="card settings-form">
          <h3 className="settings-section-title">🎯 יעדים יומיים</h3>

          {FIELDS.map(({ key, label, unit, icon, min, max }) => (
            <div key={key} className="settings-row">
              <label className="settings-label">
                <span className="settings-icon">{icon}</span>
                <span>{label}</span>
              </label>
              <div className="settings-input-wrap">
                <input
                  type="number"
                  value={goals[key]}
                  min={min}
                  max={max}
                  onChange={e => setGoals(g => ({ ...g, [key]: Number(e.target.value) }))}
                  className="settings-input"
                />
                <span className="settings-unit">{unit}</span>
              </div>
            </div>
          ))}

          {error && <p className="form-error">{error}</p>}
          {saved && <p className="form-success">✅ היעדים נשמרו בהצלחה!</p>}

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'שומר...' : '💾 שמור יעדים'}
          </button>
        </form>
      </div>
    </div>
  )
}