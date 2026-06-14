import { useEffect, useState } from 'react'
import { api } from '../api'

const DEFAULTS = { calories: 2000, protein: 120, carbs: 250, water: 8, steps: 10000, sleep_hours: 8 }

const FIELDS = [
  { key: 'calories',    label: 'קלוריות יומיות',   unit: 'קק״ל', icon: '🔥', min: 500,  max: 6000  },
  { key: 'protein',     label: 'חלבון יומי',         unit: 'גרם',  icon: '🥩', min: 10,   max: 500   },
  { key: 'carbs',       label: 'פחמימות יומיות',    unit: 'גרם',  icon: '🌾', min: 10,   max: 800   },
  { key: 'water',       label: 'כוסות מים יומיות',  unit: 'כוסות',icon: '💧', min: 1,    max: 20    },
  { key: 'steps',       label: 'צעדים יומיים',       unit: 'צעדים',icon: '👟', min: 1000, max: 50000 },
  { key: 'sleep_hours', label: 'שעות שינה יעד',     unit: 'שעות', icon: '😴', min: 3,    max: 12    },
]

const EXPORTS = [
  { key: 'meals',    icon: '🥗', label: 'ארוחות',         filename: 'meals.csv'    },
  { key: 'workouts', icon: '💪', label: 'אימונים',        filename: 'workouts.csv' },
  { key: 'sleep',    icon: '😴', label: 'שינה',           filename: 'sleep.csv'    },
  { key: 'daily',    icon: '📊', label: 'סיכום יומי',     filename: 'daily.csv'    },
]

function toCSV(rows) {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const escape  = val => {
    if (val === null || val === undefined) return ''
    const s = String(val)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  return [
    headers.join(','),
    ...rows.map(row => headers.map(h => escape(row[h])).join(',')),
  ].join('\n')
}

function downloadCSV(filename, csv) {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function SettingsPage() {
  const [goals, setGoals]     = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState('')
  const [exporting, setExporting] = useState(false)
  const [exportCounts, setExportCounts] = useState(null)

  useEffect(() => {
    api.goals.get()
      .then(g => setGoals({ ...DEFAULTS, ...g }))
      .catch(() => setError('שגיאה בטעינת היעדים.'))
      .finally(() => setLoading(false))

    api.export.get()
      .then(data => setExportCounts({
        meals:    data.meals.length,
        workouts: data.workouts.length,
        sleep:    data.sleep.length,
        daily:    data.daily.length,
      }))
      .catch(() => {})
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

  async function handleExport(key, filename) {
    setExporting(true)
    try {
      const data = await api.export.get()
      downloadCSV(filename, toCSV(data[key]))
    } catch {
      setError('שגיאה בייצוא הנתונים.')
    } finally {
      setExporting(false)
    }
  }

  async function handleExportAll() {
    setExporting(true)
    try {
      const data = await api.export.get()
      const date = new Date().toISOString().split('T')[0]
      EXPORTS.forEach(({ key, filename }) => {
        if (data[key].length > 0) {
          downloadCSV(`${date}-${filename}`, toCSV(data[key]))
        }
      })
    } catch {
      setError('שגיאה בייצוא הנתונים.')
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <div className="page-loading"><div className="spinner" />טוען...</div>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>⚙️ הגדרות</h2>
          <p className="page-subtitle">יעדים יומיים וייצוא נתונים</p>
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

        <div className="card settings-form" style={{ marginTop: 20 }}>
          <h3 className="settings-section-title">📤 ייצוא נתונים</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            הורד את כל נתוני הבריאות שלך כקובצי CSV הניתנים לפתיחה ב-Excel.
          </p>

          <div className="export-grid">
            {EXPORTS.map(({ key, icon, label, filename }) => (
              <button
                key={key}
                type="button"
                className="export-btn"
                onClick={() => handleExport(key, filename)}
                disabled={exporting}
              >
                <span className="export-icon">{icon}</span>
                <span className="export-label">{label}</span>
                {exportCounts && (
                  <span className="export-count">{exportCounts[key]} רשומות</span>
                )}
                <span className="export-arrow">↓</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn-primary"
            style={{ marginTop: 14, width: '100%' }}
            onClick={handleExportAll}
            disabled={exporting}
          >
            {exporting ? 'מייצא...' : '📦 ייצא הכל'}
          </button>
        </div>
      </div>
    </div>
  )
}
