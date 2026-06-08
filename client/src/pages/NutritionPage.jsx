import { useEffect, useState, useRef } from 'react'
import { api } from '../api'

const MEAL_TYPES = ['ארוחת בוקר', 'ארוחת צהריים', 'ארוחת ערב', 'חטיף']
const EMPTY = { name: '', calories: '', protein: '', carbs: '', fat: '', meal_type: 'ארוחת צהריים' }

function ProgressBar({ label, value, max, unit, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="progress-row">
      <div className="progress-labels">
        <span className="prog-name">{label}</span>
        <span className="prog-val">{Math.round(value)} / {max} {unit}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export default function NutritionPage() {
  const [meals, setMeals] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const fileRef = useRef()

  useEffect(() => { load() }, [])

  async function load() {
    try { setMeals(await api.nutrition.getMeals()) } catch {}
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.nutrition.addMeal({
        ...form,
        calories: Number(form.calories),
        protein: Number(form.protein) || 0,
        carbs: Number(form.carbs) || 0,
        fat: Number(form.fat) || 0,
      })
      setForm(EMPTY)
      if (fileRef.current) fileRef.current.value = ''
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    try {
      await api.nutrition.deleteMeal(id)
      setMeals(ms => ms.filter(m => m.id !== id))
    } catch {}
  }

  async function handleAnalyze(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setAnalyzing(true)
    setError('')
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const base64 = reader.result.split(',')[1]
          const result = await api.nutrition.analyze(base64)
          setForm(f => ({
            ...f,
            name: result.name,
            calories: String(result.calories),
            protein: String(result.protein),
            carbs: String(result.carbs),
            fat: String(result.fat),
          }))
        } catch {
          setError('שגיאה בניתוח התמונה')
        } finally {
          setAnalyzing(false)
        }
      }
      reader.readAsDataURL(file)
    } catch {
      setError('שגיאה בניתוח התמונה')
      setAnalyzing(false)
    }
  }

  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + Number(m.calories || 0),
      protein:  acc.protein  + Number(m.protein  || 0),
      carbs:    acc.carbs    + Number(m.carbs    || 0),
    }),
    { calories: 0, protein: 0, carbs: 0 }
  )

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>🥗 תזונה</h2>
          <p className="page-subtitle">מעקב ארוחות יומי</p>
        </div>
        <div className="totals-row">
          <span className="badge orange">🔥 {Math.round(totals.calories)} קק״ל</span>
          <span className="badge purple">🥩 {Math.round(totals.protein)}g</span>
        </div>
      </div>

      {meals.length > 0 && (
        <div className="card mb16">
          <ProgressBar label="קלוריות" value={totals.calories} max={2000} unit="קק״ל" color="#f97316" />
          <ProgressBar label="חלבון"   value={totals.protein}  max={120}  unit="גרם"  color="#a855f7" />
          <ProgressBar label="פחמימות" value={totals.carbs}    max={250}  unit="גרם"  color="#22c55e" />
        </div>
      )}

      <div className="two-col">
        <div className="card">
          <h3>➕ הוסף ארוחה</h3>
          <button
            type="button" className="btn-secondary mb"
            onClick={() => fileRef.current?.click()} disabled={analyzing}
          >
            {analyzing ? '🔍 מנתח תמונה...' : '📷 נתח תמונה עם AI'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleAnalyze} style={{ display: 'none' }} />

          <form onSubmit={handleSubmit} className="form-grid">
            <div className="field span2">
              <label>שם המאכל</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="עוף בגריל" />
            </div>
            <div className="field">
              <label>קלוריות</label>
              <input type="number" value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} required min="0" placeholder="350" />
            </div>
            <div className="field">
              <label>חלבון (גרם)</label>
              <input type="number" value={form.protein} onChange={e => setForm(f => ({ ...f, protein: e.target.value }))} min="0" placeholder="30" />
            </div>
            <div className="field">
              <label>פחמימות (גרם)</label>
              <input type="number" value={form.carbs} onChange={e => setForm(f => ({ ...f, carbs: e.target.value }))} min="0" placeholder="20" />
            </div>
            <div className="field">
              <label>שומן (גרם)</label>
              <input type="number" value={form.fat} onChange={e => setForm(f => ({ ...f, fat: e.target.value }))} min="0" placeholder="10" />
            </div>
            <div className="field span2">
              <label>סוג ארוחה</label>
              <select value={form.meal_type} onChange={e => setForm(f => ({ ...f, meal_type: e.target.value }))}>
                {MEAL_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            {error && <p className="form-error span2">{error}</p>}
            <button type="submit" className="btn-primary span2" disabled={loading}>
              {loading ? 'שומר...' : '+ הוסף ארוחה'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3>🍽 ארוחות היום</h3>
          {meals.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🥗</span>
              <span>לא נרשמו ארוחות היום</span>
            </div>
          ) : (
            <div className="meal-list">
              {meals.map(m => (
                <div key={m.id} className="meal-item">
                  <div className="meal-top">
                    <div className="meal-info">
                      <strong>{m.name}</strong>
                      <span className="meal-type-tag">{m.meal_type}</span>
                    </div>
                    <button className="btn-danger" onClick={() => handleDelete(m.id)} title="מחק">✕</button>
                  </div>
                  <div className="meal-macros">
                    <span>🔥 {m.calories}</span>
                    <span>🥩 {m.protein}g</span>
                    <span>🌾 {m.carbs}g</span>
                    <span>🧈 {m.fat}g</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}