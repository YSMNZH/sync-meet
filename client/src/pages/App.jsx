import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('user')
    return u ? JSON.parse(u) : null
  })

  useEffect(() => {
    const onStorage = () => {
      const u = localStorage.getItem('user')
      setUser(u ? JSON.parse(u) : null)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const linkClass = (path) =>
    `nav-link${location.pathname === path ? ' active' : ''}`

  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif',
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Navbar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 32px',
          borderBottom: '1px solid #d1d5db',
          background: 'linear-gradient(90deg, #2563eb, #3b82f6, #60a5fa)',
          color: 'white',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 4px 8px rgba(59, 130, 246, 0.3)',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontWeight: '900',
            fontSize: '1.8rem',
            background: 'linear-gradient(45deg, #dbeafe, #3b82f6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            userSelect: 'none',
            textShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
            letterSpacing: '0.05em',
          }}
        >
          SyncMeet
        </h1>
        <nav
          style={{
            display: 'flex',
            gap: 14,
            flexWrap: 'wrap',
            alignItems: 'center',
            flexGrow: 1,
            justifyContent: 'flex-end',
          }}
        >
          <Link className={linkClass('/')} to="/">
            Calendar
          </Link>
          <Link className={linkClass('/create')} to="/create">
            Create Meeting
          </Link>
          <Link className={linkClass('/archives')} to="/archives">
            Archives
          </Link>
          <Link className={linkClass('/google')} to="/google">
            Google
          </Link>
          {!user && (
            <>
              <Link className={linkClass('/login')} to="/login">
                Login
              </Link>
              <Link className={linkClass('/signup')} to="/signup">
                Sign up
              </Link>
            </>
          )}
          {user && (
            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                marginLeft: 16,
                whiteSpace: 'nowrap',
                color: 'white',
                fontWeight: '600',
              }}
            >
              <span>
                {user.name || user.email}
              </span>
              <button
                onClick={() => {
                  localStorage.removeItem('token')
                  localStorage.removeItem('user')
                  setUser(null)
                  navigate('/')
                }}
                style={{
                  padding: '6px 14px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ef4444')}
              >
                Logout
              </button>
            </div>
          )}
        </nav>
      </header>

      <main style={{
        flex: 1, 
        width: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Outlet />
      </main>

      <style>{`
        .nav-link {
          padding: 10px 16px;
          border-radius: 8px;
          text-decoration: none;
          color: white;
          font-weight: 600;
          transition: background-color 0.3s, color 0.3s;
          background-color: transparent;
        }
        .nav-link:hover {
          background-color: rgba(255 255 255 / 0.25);
          color: #f3f4f6;
        }
        .nav-link.active {
          background-color: #dbeafe;
          color: #2563eb;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.6);
        }
      `}</style>
    </div>
  )
}
