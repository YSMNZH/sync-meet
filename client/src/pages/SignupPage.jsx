import { useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const { data } = await axios.post('/api/auth/signup', { email, password, name })
      localStorage.setItem('token', data.token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/')
    } catch (err) {
      setError(err?.response?.data?.error || 'Signup failed')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #dbeafe, #eff6ff)'
    }}>
      <form
        onSubmit={onSubmit}
        style={{
          maxWidth: 420,
          width: '100%',
          backgroundColor: '#ffffff',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          display: 'grid',
          gap: '16px',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, sans-serif'
        }}
      >
        <h2 style={{
          margin: 0,
          fontSize: '24px',
          fontWeight: '700',
          color: '#1d4ed8',
          textAlign: 'center'
        }}>Sign up</h2>

        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
          Name
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{
              marginTop: '4px',
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#16a34a'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </label>

        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
          Email
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{
              marginTop: '4px',
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#16a34a'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </label>

        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
          Password (min 6)
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{
              marginTop: '4px',
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#16a34a'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </label>

        <button
          type="submit"
          style={{
            padding: '10px 16px',
            background: '#2563eb',
            color: 'white',
            fontSize: '15px',
            fontWeight: '600',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          Create account
        </button>

        {error && (
          <p style={{
            color: '#dc2626',
            background: '#fee2e2',
            padding: '8px',
            borderRadius: '6px',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </p>
        )}

        <p style={{ fontSize: '14px', color: '#374151', textAlign: 'center' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>
            Login
          </Link>
        </p>
      </form>
    </div>
  )
}
