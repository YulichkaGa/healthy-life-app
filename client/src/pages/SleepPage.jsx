import { useEffect, useState } from 'react'
import { api } from '../api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'

const QUALITY = [1, 2, 3, 4, 5]
const QUALITY_LABELS = { 1: '😫', 2: '😪', 3: '😐', 4: '😊', 5: '😄' }

function calcDuration(bed, wake) {
  const [bh, bm] = bed.split(':').map(Number)
  const [wh, wm] = wake.split(':').map(Number)
  let mins = (wh * 60 + wm) - (bh * 60 + bm)
  if (mins < 0) mins += 24 * 60
  return +(mins / 60).toFixed(1)
}

const EMPTY = { bedtime: '23:00', wake_time: '07:00', duration: 8, quality: 4, notes: '' }

function dayLabel(dateStr) {
  return new Date(dateStr).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })
}

export default function SleepPage() {
  const [history, setHistory] = useState([])
  const [form, setForm]       = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    try { setHistory(await api.sleep.history()) } catch {}
  }

  function setTime(field, val) {
    setForm(f => {
      const next = { ...f, [field]: val }
      next.duration = calcDuration(
        field === 'bedtime'    ? val : f.bedtime,
        field === 'wake_time'  ? val : f.wake_time
      )
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.sleep.log(form)
      setForm(EMPTY)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const avg = history.length
    ? (history.reduce((s, h) => s + (Number(h.duration) || 0), 0) / history.length).toFixed(1)
    : 0

  const chartData = [...history].reverse().slice(-7).map(h => ({
    date: dayLabel(h.sleep_date),
    שינה: Number(h.duration) || 0,
  }))

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>😴 שינה</h2>
          <p className="page-subtitle">מעקב איכות השינה שלך</p>
        </div>
        <span className="badge indigo">ממוצע: {avg} שעות</span>
      </div>

      <div className="two-col">
        <div className="card">
          <h3>📝 רשום שינה</h3>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="field">
              <label>שעת שינה</label>
              <input type="time" value={form.bedtime} onChange={e => setTime('bedtime', e.target.value)} />
            </div>
            <div className="field">
              <label>שעת קימה</label>
              <input type="time" value={form.wake_time} onChange={e => setTime('wake_time', e.target.value)} />
            </div>
            <div className="field span2">
              <label>משך שינה: <strong>{form.duration} שעות</strong></label>
              <input
                type="range" min="0" max="12" step="0.5"
                value={form.duration || 0}
                onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
              />
            </div>
            <div className="field span2">
              <label>איכות שינה</label>
              <div className="quality-picker">
                {QUALITY.map(q => (
                  <button
                    key={q} type="button"
                    className={`quality-btn${form.quality === q ? ' selected' : ''}`}
                    onClick={() => setForm(f => ({ ...f, quality: q }))}
                  >
                    <span className="q-emoji">{QUALITY_LABELS[q]}</span>
                    <span className="q-num">{q}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="field span2">
              <label>הערות</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="חלמתי על..." />
            </div>
            {error && <p className="form-error span2">{error}</p>}
            <button type="submit" className="btn-primary span2" disabled={loading}>
              {loading ? 'שומר...' : '💾 שמור שינה'}
            </button>
          </form>
        </div>

        <div>
          {chartData.length > 1 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h3>📊 שינה — 7 לילות אחרונים</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <ReferenceLine y={8} stroke="#6366f1" strokeDasharray="4 2" strokeWidth={1.5} label={{ value: 'יעד 8ש', position: 'right', fontSize: 10, fill: '#6366f1' }} />
                  <Bar dataKey="שינה" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="card">
            <h3>📅 היסטוריית שינה</h3>
            {history.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">😴</span>
                <span>אין היסטוריית שינה</span>
              </div>
            ) : (
              <div className="sleep-list">
                {history.map(h => (
                  <div key={h.id} className="sleep-item">
                    <div className="sleep-date">{new Date(h.sleep_date).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                    <div className="sleep-stats">
                      <span>{h.bedtime?.slice(0, 5)} – {h.wake_time?.slice(0, 5)}</span>
                      <span className="item-tag indigo">{h.duration} שעות</span>
                      <span>{QUALITY_LABELS[h.quality]}</span>
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