import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}


export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  });

  useEffect(() => {
    const onStorage = () => {
      const u = localStorage.getItem('user');
      setUser(u ? JSON.parse(u) : null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const linkClass = (path) =>
    `nav-link${location.pathname === path ? ' active' : ''}`;

  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif',
        minHeight: '100vh',
        backgroundColor: '#f3f4f6',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
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
          {user ? (
            <>
              <Link className={linkClass('/')} to="/">
                Calendar
              </Link>
              <Link className={linkClass('/create')} to="/create">
                Create Meeting
              </Link>
              <Link className={linkClass('/invite')} to="/invite">
                Invitations
              </Link>
              <Link className={linkClass('/archives')} to="/archives">
                Archives
              </Link>
              <Link className={linkClass('/google')} to="/google">
                Google
              </Link>

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
                <span>{user.name || user.email}</span>
                <button
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setUser(null);
                    navigate('/');
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
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = '#dc2626')
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = '#ef4444')
                  }
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>

            </>
          )}
        </nav>
      </header>
   <ScrollToTop />
      <main
        style={{
          flex: 1,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {!user && location.pathname === '/' ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              padding: '40px 20px',
              color: '#1e293b',
            }}
          >
            <h2
              style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                background: 'linear-gradient(45deg, #dbeafe, #3b82f6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: 16,
              }}
            >
              Welcome to SyncMeet
            </h2>
            <p
              style={{
                fontSize: '1.25rem',
                maxWidth: 600,
                color: '#334155',
                marginBottom: 32,
              }}
            >
              Organize and manage your meetings seamlessly. Create, invite, and sync
              all your schedules in one place.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Link
                to="/signup"
                style={{
                  padding: '12px 28px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  borderRadius: 8,
                  fontWeight: 600,
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = '#1e40af')
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = '#2563eb')
                }
              >
                Sign Up
              </Link>
              <Link
                to="/login"
                style={{
                  padding: '12px 28px',
                  backgroundColor: '#f3f4f6',
                  color: '#2563eb',
                  borderRadius: 8,
                  fontWeight: 600,
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = '#e0e7ff')
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = '#f3f4f6')
                }
              >
                Login
              </Link>
            </div>
          </div>
        ) : (
          <Outlet />
        )}
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
  );
}
