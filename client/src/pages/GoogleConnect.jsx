import { useState } from 'react'
import axios from 'axios'

export default function GoogleConnect() {
  const [email, setEmail] = useState('')
  const [authUrl, setAuthUrl] = useState('')
  const [error, setError] = useState('')

  const start = async (e) => {
    e.preventDefault()
    setError('')
    setAuthUrl('')
    try {
      const { data } = await axios.get('/api/google/auth/start', { params: { ownerEmail: email } })
      setAuthUrl(data.url)
      window.location.href = data.url
    } catch (err) {
      setError('Failed to start Google authorization')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e0f2fe, #f0f9ff)'
    }}>
      <form
        onSubmit={start}
        style={{
          maxWidth: 480,
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
          fontSize: '22px',
          fontWeight: '700',
          color: '#2563eb',
          textAlign: 'center'
        }}>
          Connect Google Calendar!
        </h2>

        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
          Your Email (organizer)
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            onFocus={(e) => e.target.style.borderColor = '#2563eb'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </label>

        <button
          type="submit"
          style={{
            padding: '10px 16px',
            background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
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
          Connect Google Calendar
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

        {authUrl && (
          <p style={{
            fontSize: '14px',
            color: '#2563eb',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            <a href={authUrl} style={{ textDecoration: 'none', color: '#2563eb' }}>
              Continue to Google
            </a>
          </p>
        )}
      </form>
    </div>
  )
}
