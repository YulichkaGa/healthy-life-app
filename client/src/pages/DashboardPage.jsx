import { useEffect, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { dayLabel } from '../utils/dateUtils'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const MOODS = {
  night: {
    emoji: '🌙', label: 'לילה', greeting: 'לילה טוב',
    sub: 'זמן מנוחה ושיקום הגוף',
    bg: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #1e1b4b 100%)',
    fg: '#e0e7ff', subFg: '#a5b4fc',
    badgeBg: 'rgba(129,140,248,.18)', badgeBorder: '#4f46e5', badgeFg: '#c7d2fe',
  },
  dawn: {
    emoji: '🌅', label: 'אור', greeting: 'בוקר אור',
    sub: 'ההתחלה הטובה ביותר ליום',
    bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 35%, #fed7aa 100%)',
    fg: '#78350f', subFg: '#92400e',
    badgeBg: 'rgba(251,146,60,.22)', badgeBorder: '#f59e0b', badgeFg: '#78350f',
  },
  morning: {
    emoji: '☀️', label: 'בוקר', greeting: 'בוקר טוב',
    sub: 'יום פורה לפנינו',
    bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 55%, #6ee7b7 100%)',
    fg: '#064e3b', subFg: '#065f46',
    badgeBg: 'rgba(16,185,129,.18)', badgeBorder: '#10b981', badgeFg: '#064e3b',
  },
}

function getTimeMood() {
  const h = new Date().getHours()
  if (h >= 22 || h < 5) return MOODS.night
  if (h < 9) return MOODS.dawn
  return MOODS.morning
}

function MoodBanner({ mood, userName, streak, achievements, todayStr }) {
  return (
    <div className="mood-banner" style={{ background: mood.bg }}>
      <div className="mood-banner-content">
        <span
          className="mood-badge"
          style={{ background: mood.badgeBg, border: `1px solid ${mood.badgeBorder}`, color: mood.badgeFg }}
        >
          {mood.emoji} {mood.label}
        </span>
        <h2 className="mood-greeting" style={{ color: mood.fg }}>
          {mood.greeting}, {userName} 👋
        </h2>
        <p className="mood-sub" style={{ color: mood.subFg }}>{todayStr}</p>
        {(streak > 0 || achievements) && (
          <div className="mood-badges-row">
            {streak > 0 && <div className="streak-badge">🔥 {streak} ימי רצף</div>}
            {achievements && (
              <div className="streak-badge" style={{ background: '#fef9c3', color: '#854d0e' }}>
                🏆 {achievements.earnedCount}/{achievements.total}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="mood-banner-icon">{mood.emoji}</div>
    </div>
  )
}

function Ring({ pct = 0, color = '#16a34a', size = 76 }) {
  const r = 27
  const c = 2 * Math.PI * r
  const p = Math.min(100, Math.max(0, pct))
  const offset = c - (p / 100) * c
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth="7" />
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
    <div className="stat-card" style={{ '--stat-accent': color }}>
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

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [streak, setStreak] = useState(0)
  const [insight, setInsight] = useState('')
  const [weekly, setWeekly] = useState([])
  const [goals, setGoals] = useState({ calories: 2000, protein: 120, water: 8, steps: 10000, sleep_hours: 8 })
  const [achievements, setAchievements] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      api.dashboard.today(),
      api.dashboard.streak(),
      api.ai.insight(),
      api.dashboard.weekly(),
      api.goals.get(),
      api.achievements.get(),
    ]).then(([tod, s, ins, w, g, ach]) => {
      if (tod.status === 'fulfilled') setData(tod.value)
      if (s.status === 'fulfilled')   setStreak(s.value.streak)
      if (ins.status === 'fulfilled') setInsight(ins.value.insight)
      if (g.status === 'fulfilled')   setGoals(prev => ({ ...prev, ...g.value }))
      if (ach.status === 'fulfilled') setAchievements(ach.value)
      if (w.status === 'fulfilled')
        setWeekly(w.value.map(record => ({
          day: dayLabel(record.log_date),
          calories: Number(record.calories) || 0,
          protein:  Number(record.protein)  || 0,
          steps:    Number(record.steps)    || 0,
          water:    Number(record.water)    || 0,
        })))
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page-loading"><div className="spinner" />טוען נתונים...</div>

  const todayStr = new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
  const mood = getTimeMood()

  return (
    <div className="page">
      <MoodBanner
        mood={mood}
        userName={user?.name?.split(' ')[0] || user?.name}
        streak={streak}
        achievements={achievements}
        todayStr={todayStr}
      />

      <div className="stats-grid">
        <StatCard icon="🔥" label="קלוריות"  value={data?.calories}    unit="קק״ל"   max={goals.calories}    goal={goals.calories}    color="#f97316" />
        <StatCard icon="🥩" label="חלבון"    value={data?.protein}     unit="גרם"    max={goals.protein}     goal={goals.protein}     color="#a855f7" />
        <StatCard icon="💧" label="מים"      value={data?.water}       unit="כוסות"  max={goals.water}       goal={goals.water}       color="#3b82f6" />
        <StatCard icon="👟" label="צעדים"    value={data?.steps}       unit=""       max={goals.steps}       goal={goals.steps}       color="#22c55e" />
        <StatCard icon="😴" label="שינה"     value={data?.sleep_hours} unit="שעות"   max={goals.sleep_hours} goal={goals.sleep_hours} color="#6366f1" />
        <StatCard icon="😊" label="מצב רוח"  value={data?.mood}        unit="/5"     max={5}                                          color="#ec4899" />
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
              <Area type="monotone" dataKey="calories" name="קלוריות" stroke="#f97316" fill="url(#gCal)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="protein"  name="חלבון"   stroke="#a855f7" fill="url(#gProt)" strokeWidth={2} dot={false} />
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
              <Bar yAxisId="steps" dataKey="steps" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="water" dataKey="water"   fill="#3b82f6" radius={[4, 4, 0, 0]} />
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
                {data.meals.map(meal => (
                  <div key={meal.id} className="item-row">
                    <div>
                      <div className="item-name">{meal.name}</div>
                      <div className="item-meta">{meal.meal_type}</div>
                    </div>
                    <span className="item-tag orange">{meal.calories} קק״ל</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.workouts?.length > 0 && (
            <div className="card">
              <h3>💪 אימונים היום</h3>
              <div className="item-list">
                {data.workouts.map(workout => (
                  <div key={workout.id} className="item-row">
                    <div>
                      <div className="item-name">{workout.name}</div>
                      <div className="item-meta">{workout.duration} דקות</div>
                    </div>
                    <span className="item-tag green">{workout.calories} קק״ל</span>
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