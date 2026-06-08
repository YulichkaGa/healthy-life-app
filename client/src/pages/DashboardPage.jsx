import { useEffect, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

function Ring({ pct = 0, color = '#16a34a', size = 76 }) {
  const r = 27
  const c = 2 * Math.PI * r
  const p = Math.min(100, Math.max(0, pct))
  const offset = c - (p / 100) * c
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8f5e9" strokeWidth="7" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth="7" strokeLinecap="round"
        strokeDasharray={`${c} ${c}`} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset .6s ease' }}
      />
    </svg>
  )
}

function StatCard({ icon, label, value, unit, max, color, goal }) {
  const pct = max && value ? Math.min(100, Math.round((Number(value) / max) * 100)) : 0
  return (
    <div className="stat-card">
      <div className="stat-ring-wrap">
        <Ring pct={pct} color={color} />
        <span className="stat-ring-icon">{icon}</span>
      </div>
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">
          <span className="stat-num" style={{ color }}>{value ?? 0}</span>
          {unit && <span className="stat-unit">{unit}</span>}
        </div>
        {goal && <div className="stat-goal">יעד {goal} {unit}</div>}
      </div>
    </div>
  )
}

function dayLabel(dateStr) {
  return new Date(dateStr).toLocaleDateString('he-IL', { weekday: 'short' })
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [streak, setStreak] = useState(0)
  const [insight, setInsight] = useState('')
  const [weekly, setWeekly] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      api.dashboard.today(),
      api.dashboard.streak(),
      api.ai.insight(),
      api.dashboard.weekly(),
    ]).then(([tod, s, ins, w]) => {
      if (tod.status === 'fulfilled') setData(tod.value)
      if (s.status === 'fulfilled')   setStreak(s.value.streak)
      if (ins.status === 'fulfilled') setInsight(ins.value.insight)
      if (w.status === 'fulfilled')
        setWeekly(w.value.map(r => ({
          day: dayLabel(r.log_date),
          קלוריות: Number(r.calories) || 0,
          חלבון:   Number(r.protein)  || 0,
          צעדים:   Number(r.steps)    || 0,
          מים:     Number(r.water)    || 0,
        })))
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page-loading"><div className="spinner" />טוען נתונים...</div>

  const todayStr = new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>שלום, {user?.name?.split(' ')[0] || user?.name} 👋</h2>
          <p className="page-subtitle">{todayStr}</p>
        </div>
        {streak > 0 && <div className="streak-badge">🔥 {streak} ימי רצף</div>}
      </div>

      <div className="stats-grid">
        <StatCard icon="🔥" label="קלוריות"  value={data?.calories}    unit="קק״ל"   max={2000}  goal={2000}  color="#f97316" />
        <StatCard icon="🥩" label="חלבון"    value={data?.protein}     unit="גרם"    max={120}   goal={120}   color="#a855f7" />
        <StatCard icon="💧" label="מים"      value={data?.water}       unit="כוסות"  max={8}     goal={8}     color="#3b82f6" />
        <StatCard icon="👟" label="צעדים"    value={data?.steps}       unit=""       max={10000} goal={10000} color="#22c55e" />
        <StatCard icon="😴" label="שינה"     value={data?.sleep_hours} unit="שעות"   max={8}     goal={8}     color="#6366f1" />
        <StatCard icon="😊" label="מצב רוח"  value={data?.mood}        unit="/5"     max={5}                  color="#ec4899" />
      </div>

      {weekly.length > 1 && (
        <div className="card chart-card">
          <h3>📈 קלוריות וחלבון — 7 ימים אחרונים</h3>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={weekly} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gCal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gProt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="קלוריות" stroke="#f97316" fill="url(#gCal)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="חלבון"   stroke="#a855f7" fill="url(#gProt)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {weekly.length > 1 && (
        <div className="card chart-card">
          <h3>🏃 צעדים ומים — 7 ימים אחרונים</h3>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={weekly} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="steps" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="water" orientation="left" tick={{ fontSize: 11 }} hide />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="steps" dataKey="צעדים" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="water" dataKey="מים"   fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {insight && (
        <div className="insight-card">
          <div className="insight-header">
            <span>🤖</span>
            <strong>תובנה יומית מה-AI Coach שלך</strong>
          </div>
          <p>{insight}</p>
        </div>
      )}

      {(data?.meals?.length > 0 || data?.workouts?.length > 0) && (
        <div className="two-col">
          {data.meals?.length > 0 && (
            <div className="card">
              <h3>🍽 ארוחות היום</h3>
              <div className="item-list">
                {data.meals.map(m => (
                  <div key={m.id} className="item-row">
                    <div>
                      <div className="item-name">{m.name}</div>
                      <div className="item-meta">{m.meal_type}</div>
                    </div>
                    <span className="item-tag orange">{m.calories} קק״ל</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.workouts?.length > 0 && (
            <div className="card">
              <h3>💪 אימונים היום</h3>
              <div className="item-list">
                {data.workouts.map(w => (
                  <div key={w.id} className="item-row">
                    <div>
                      <div className="item-name">{w.name}</div>
                      <div className="item-meta">{w.duration} דקות</div>
                    </div>
                    <span className="item-tag green">{w.calories} קק״ל</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}