import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const NAV = [
  { to: '/',             icon: '🏠', label: 'לוח בקרה'  },
  { to: '/nutrition',    icon: '🥗', label: 'תזונה'      },
  { to: '/fitness',      icon: '💪', label: 'כושר'       },
  { to: '/weight',       icon: '⚖️', label: 'משקל'       },
  { to: '/sleep',        icon: '😴', label: 'שינה'       },
  { to: '/mood',         icon: '😊', label: 'מצב רוח'    },
  { to: '/ai',           icon: '🤖', label: 'AI Coach'   },
  { to: '/achievements', icon: '🏆', label: 'הישגים'     },
  { to: '/settings',     icon: '⚙️', label: 'יעדים'      },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">🌿</div>
          <span className="logo-text">HealthyLife</span>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to} to={to} end={to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <span className="user-name">{user?.name}</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="logout-btn" onClick={toggle} title={dark ? 'מצב בהיר' : 'מצב כהה'}>
              {dark ? '☀️' : '🌙'}
            </button>
            <button className="logout-btn" onClick={handleLogout} title="יציאה">⬅️</button>
          </div>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  )
}
