import { useEffect, useState } from 'react'
import { api } from '../api'

const EMPTY = { name: '', duration: '', calories: '', notes: '' }

export default function FitnessPage() {
  const [workouts, setWorkouts] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [steps, setSteps] = useState('')
  const [loading, setLoading] = useState(false)
  const [stepsLoading, setStepsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const data = await api.fitness.getWorkouts()
      setWorkouts(data)
    } catch {}
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
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSteps(e) {
    e.preventDefault()
    setStepsLoading(true)
    try {
      await api.fitness.updateSteps(Number(steps))
    } catch {}
    setStepsLoading(false)
  }

  const totalCal = workouts.reduce((s, w) => s + (w.calories || 0), 0)
  const totalMin = workouts.reduce((s, w) => s + (w.duration || 0), 0)

  return (
    <div className="page">
      <div className="page-header">
        <h2>💪 כושר</h2>
        <div className="totals-row">
          <span className="badge green">⏱ {totalMin} דקות</span>
          <span className="badge orange">🔥 {totalCal} קק״ל</span>
        </div>
      </div>

      <div className="two-col">
        <div>
          <div className="card mb">
            <h3>עדכן צעדים</h3>
            <form onSubmit={handleSteps} className="inline-form">
              <input
                type="number"
                value={steps}
                onChange={e => setSteps(e.target.value)}
                placeholder="מספר צעדים"
                min="0"
                required
              />
              <button type="submit" className="btn-primary" disabled={stepsLoading}>
                {stepsLoading ? 'שומר...' : '👟 שמור'}
              </button>
            </form>
          </div>

          <div className="card">
            <h3>הוסף אימון</h3>
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
        </div>

        <div className="card">
          <h3>אימונים היום</h3>
          {workouts.length === 0
            ? <p className="empty-state">לא נרשמו אימונים היום</p>
            : (
              <div className="meal-list">
                {workouts.map(w => (
                  <div key={w.id} className="meal-item">
                    <div className="meal-info">
                      <strong>{w.name}</strong>
                    </div>
                    <div className="meal-macros">
                      <span>⏱ {w.duration} דק׳</span>
                      <span>🔥 {w.calories} קק״ל</span>
                    </div>
                    {w.notes && <p className="workout-notes">{w.notes}</p>}
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </div>
    </div>
  )
}