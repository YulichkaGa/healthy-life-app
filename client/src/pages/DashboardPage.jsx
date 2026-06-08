import { useEffect, useState } from 'react'
import { api } from '../api'

function StatCard({ icon, label, value, unit, max, color }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : null
  return (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-icon">{icon}</span>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value">
        <span className="stat-num">{value ?? '—'}</span>
        {unit && <span className="stat-unit">{unit}</span>}
        {max && <span className="stat-max">/ {max}</span>}
      </div>
      {pct !== null && (
        <div className="stat-bar">
          <div className="stat-fill" style={{ width: `${pct}%`, background: color }} />
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [streak, setStreak] = useState(0)
  const [insight, setInsight] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      api.dashboard.today(),
      api.dashboard.streak(),
      api.ai.insight(),
    ]).then(([today, s, ins]) => {
      if (today.status === 'fulfilled') setData(today.value)
      if (s.status === 'fulfilled') setStreak(s.value.streak)
      if (ins.status === 'fulfilled') setInsight(ins.value.insight)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page-loading">טוען נתונים...</div>

  return (
    <div className="page">
      <div className="page-header">
        <h2>לוח הבקרה שלי</h2>
        <span className="streak-badge">🔥 {streak} ימי רצף</span>
      </div>

      <div className="stats-grid">
        <StatCard icon="🔥" label="קלוריות" value={data?.calories ?? 0} unit="קק״ל" max={2000} color="#f97316" />
        <StatCard icon="🥩" label="חלבון" value={data?.protein ?? 0} unit="גרם" max={120} color="#a855f7" />
        <StatCard icon="💧" label="מים" value={data?.water ?? 0} unit="כוסות" max={8} color="#3b82f6" />
        <StatCard icon="👟" label="צעדים" value={data?.steps ?? 0} unit="" max={10000} color="#22c55e" />
        <StatCard icon="😴" label="שינה" value={data?.sleep_hours ?? 0} unit="שעות" max={8} color="#6366f1" />
        <StatCard icon="😊" label="מצב רוח" value={data?.mood ?? '—'} unit="/5" color="#ec4899" />
      </div>

      {insight && (
        <div className="insight-card">
          <div className="insight-header">
            <span>🤖</span>
            <strong>תובנה יומית מה-AI Coach שלך</strong>
          </div>
          <p>{insight}</p>
        </div>
      )}

      {data?.meals?.length > 0 && (
        <div className="section">
          <h3>ארוחות היום</h3>
          <div className="list">
            {data.meals.map(m => (
              <div key={m.id} className="list-item">
                <span className="list-item-name">{m.name}</span>
                <span className="list-item-meta">{m.calories} קק״ל · {m.meal_type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data?.workouts?.length > 0 && (
        <div className="section">
          <h3>אימונים היום</h3>
          <div className="list">
            {data.workouts.map(w => (
              <div key={w.id} className="list-item">
                <span className="list-item-name">{w.name}</span>
                <span className="list-item-meta">{w.duration} דק׳ · {w.calories} קק״ל</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}