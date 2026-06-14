import { useEffect, useState } from 'react'
import { api } from '../api'

const CATEGORIES = ['רצף', 'תזונה', 'כושר', 'שינה', 'מצב רוח']

export default function AchievementsPage() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.achievements.get()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page-loading"><div className="spinner" />טוען...</div>
  if (!data)   return <div className="page"><p>שגיאה בטעינת הישגים.</p></div>

  const { earnedCount, total, achievements, streak } = data

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>🏆 הישגים</h2>
          <p className="page-subtitle">עקוב אחרי ההתקדמות שלך</p>
        </div>
        <div className="totals-row">
          {streak > 0 && <span className="badge orange">🔥 {streak} ימי רצף</span>}
          <span className="badge green">{earnedCount}/{total} הישגים</span>
        </div>
      </div>

      <div className="achieve-progress-wrap card mb16">
        <div className="achieve-progress-label">
          <span>התקדמות כוללת</span>
          <span>{earnedCount} מתוך {total}</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${Math.round((earnedCount / total) * 100)}%`, background: 'var(--green)' }}
          />
        </div>
      </div>

      {CATEGORIES.map(category => {
        const group = achievements.filter(a => a.category === category)
        return (
          <div key={category} className="achieve-group">
            <h3 className="achieve-group-title">{category}</h3>
            <div className="achieve-grid">
              {group.map(a => (
                <div key={a.id} className={`achieve-card${a.earned ? ' earned' : ' locked'}`}>
                  <div className="achieve-icon">{a.earned ? a.icon : '🔒'}</div>
                  <div className="achieve-info">
                    <div className="achieve-title">{a.title}</div>
                    <div className="achieve-desc">{a.desc}</div>
                  </div>
                  {a.earned && <div className="achieve-check">✓</div>}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
