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
  const linkClass = (path) => `px-3 py-2 rounded ${location.pathname === path ? 'bg-slate-200' : 'hover:bg-slate-100'}`
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif' }}>
      <header style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12, borderBottom: '1px solid #e5e7eb' }}>
        <h1 style={{ marginRight: 16 }}>SyncMeet</h1>
        <nav style={{ display: 'flex', gap: 8 }}>
          <Link className={linkClass('/')} to="/">Calendar</Link>
          <Link className={linkClass('/create')} to="/create">Create Meeting</Link>
          <Link className={linkClass('/archives')} to="/archives">Archives</Link>
          <Link className={linkClass('/google')} to="/google">Google</Link>
          {!user && <Link className={linkClass('/login')} to="/login">Login</Link>}
          {!user && <Link className={linkClass('/signup')} to="/signup">Sign up</Link>}
          {user && (
            <span style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 8 }}>
              <span style={{ color: '#6b7280' }}>{user.name || user.email}</span>
              <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); navigate('/'); }} style={{ padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: 6 }}>Logout</button>
            </span>
          )}
        </nav>
      </header>
      <main style={{ padding: 16 }}>
        <Outlet />
      </main>
    </div>
  )
}