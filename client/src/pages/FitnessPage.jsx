import { useEffect, useState } from 'react'
import { api } from '../api'

const EMPTY = { name: '', duration: '', calories: '', notes: '' }
const MAX_WATER = 8

export default function FitnessPage() {
  const [workouts, setWorkouts]     = useState([])
  const [form, setForm]             = useState(EMPTY)
  const [steps, setSteps]           = useState('')
  const [savedSteps, setSavedSteps] = useState(0)
  const [water, setWater]           = useState(0)
  const [loading, setLoading]       = useState(false)
  const [stepsLoading, setStepsLoading] = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    try {
      const [workoutsData, todayData] = await Promise.all([api.fitness.getWorkouts(), api.dashboard.today()])
      setWorkouts(workoutsData)
      const savedStepsValue = todayData.steps || 0
      setSavedSteps(savedStepsValue)
      setSteps(savedStepsValue ? String(savedStepsValue) : '')
      setWater(todayData.water || 0)
    } catch (err) {
      console.error('Failed to load fitness data:', err)
      setError('שגיאה בטעינת נתונים. אנא רענן את הדף.')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.fitness.addWorkout({
        ...form,
        duration: Number(form.duration),
        calories: Number(form.calories) || 0,
      })
      setForm(EMPTY)
      setWorkouts(await api.fitness.getWorkouts())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    try {
      await api.fitness.deleteWorkout(id)
      setWorkouts(workouts => workouts.filter(workout => workout.id !== id))
    } catch (err) {
      console.error('Failed to delete workout:', err)
      setError('שגיאה בהסרת האימון. אנא נסה שוב.')
    }
  }

  async function handleSteps(e) {
    e.preventDefault()
    setStepsLoading(true)
    setError('')
    try {
      const { steps: savedStepsValue } = await api.fitness.updateSteps(Number(steps))
      setSavedSteps(savedStepsValue)
    } catch (err) {
      console.error('Failed to update steps:', err)
      setError('שגיאה בשמירת הצעדים. אנא נסה שוב.')
    } finally {
      setStepsLoading(false)
    }
  }

  async function handleWater(amount) {
    const newWaterValue = water === amount ? amount - 1 : amount
    const finalWaterValue = Math.max(0, newWaterValue)
    setWater(finalWaterValue)
    try {
      await api.fitness.updateWater(finalWaterValue)
    } catch (err) {
      console.error('Failed to update water:', err)
      setError('שגיאה בעדכון מעקב המים. אנא נסה שוב.')
    }
  }

  const totalCalories = workouts.reduce((sum, workout) => sum + (Number(workout.calories) || 0), 0)
  const totalMinutes = workouts.reduce((sum, workout) => sum + (Number(workout.duration) || 0), 0)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>💪 כושר ופעילות</h2>
          <p className="page-subtitle">עקוב אחרי הפעילות היומית שלך</p>
        </div>
        <div className="totals-row">
          {totalMinutes > 0 && <span className="badge green">⏱ {totalMinutes} דקות</span>}
          {totalCalories > 0 && <span className="badge orange">🔥 {totalCalories} קק״ל</span>}
        </div>
      </div>

      <div className="two-col mb16">
        <div className="card">
          <h3>💧 מעקב מים</h3>
          <div className="water-glasses">
            {Array.from({ length: MAX_WATER }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                className={`water-glass${water >= n ? ' filled' : ''}`}
                onClick={() => handleWater(n)}
                title={`${n} כוסות`}
              >
                💧
              </button>
            ))}
          </div>
          <p className="water-label">{water} / {MAX_WATER} כוסות שתית היום</p>
        </div>

        <div className="card">
          <h3>👟 צעדים</h3>
          {savedSteps > 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
              נרשמו היום: <strong style={{ color: 'var(--text)', fontSize: 15 }}>{savedSteps.toLocaleString()}</strong> צעדים
            </p>
          )}
          <form onSubmit={handleSteps} className="inline-form">
            <input
              type="number" value={steps}
              onChange={e => setSteps(e.target.value)}
              placeholder="הזן מספר צעדים" min="0" required
            />
            <button type="submit" className="btn-primary" disabled={stepsLoading}>
              {stepsLoading ? '...' : '💾 שמור'}
            </button>
          </form>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <h3>➕ הוסף אימון</h3>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="field span2">
              <label>שם האימון</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="ריצה בוקר" />
            </div>
            <div className="field">
              <label>משך (דקות)</label>
              <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} required min="1" placeholder="45" />
            </div>
            <div className="field">
              <label>קלוריות שנשרפו</label>
              <input type="number" value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} min="0" placeholder="300" />
            </div>
            <div className="field span2">
              <label>הערות</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="אופציונלי" />
            </div>
            {error && <p className="form-error span2">{error}</p>}
            <button type="submit" className="btn-primary span2" disabled={loading}>
              {loading ? 'שומר...' : '+ הוסף אימון'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3>🏋️ אימונים היום</h3>
          {workouts.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🏃</span>
              <span>לא נרשמו אימונים היום</span>
            </div>
          ) : (
            <div className="meal-list">
              {workouts.map(w => (
                <div key={w.id} className="meal-item">
                  <div className="meal-top">
                    <div className="meal-info">
                      <strong>{w.name}</strong>
                      <span className="item-tag green">{w.duration} דק׳</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="item-tag orange">{w.calories} קק״ל</span>
                      <button className="btn-danger" onClick={() => handleDelete(w.id)} title="מחק">✕</button>
                    </div>
                  </div>
                  {w.notes && <div className="meal-macros"><span>📝 {w.notes}</span></div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}