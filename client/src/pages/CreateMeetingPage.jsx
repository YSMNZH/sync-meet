import { useState } from 'react'
import axios from 'axios'

export default function CreateMeetingPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [colorHex, setColorHex] = useState('#3b82f6')
  const [reminder, setReminder] = useState(30)
  const [inviteesText, setInviteesText] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    try {
      const invitees = inviteesText.split(/[,\n]/).map(s => s.trim()).filter(Boolean)
      await axios.post('/api/meetings', {
        title,
        description,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        colorHex,
        reminderMinutesBefore: reminder,
        invitees,
      })
      setMessage('✅ Meeting created and invitations sent (if any).')
      setTitle(''); setDescription(''); setStartTime(''); setEndTime(''); setInviteesText('')
    } catch (err) {
      setMessage('❌ Failed to create meeting')
      console.error(err)
    }
  }

  const inputStyle = {
    marginTop: '6px',
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  }

  const handleFocus = (e) => {
    e.target.style.borderColor = '#2563eb'
    e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.2)'
  }

  const handleBlur = (e) => {
    e.target.style.borderColor = '#d1d5db'
    e.target.style.boxShadow = 'none'
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f9fafb, #e5e7eb)',
      padding: '20px'
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: 640,
          width: '100%',
          backgroundColor: '#ffffff',
          padding: '28px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          display: 'grid',
          gap: '20px',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, sans-serif'
        }}
      >
        <h2 style={{
          margin: 0,
          fontSize: '24px',
          fontWeight: '700',
          color: '#111827',
          textAlign: 'center'
        }}>
          Create New Meeting
        </h2>

        <label style={{ fontWeight: '500', color: '#374151' }}>
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={inputStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </label>

        <label style={{ fontWeight: '500', color: '#374151' }}>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ ...inputStyle, minHeight: '70px' }}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <label style={{ fontWeight: '500', color: '#374151' }}>
            Start Time
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </label>
          <label style={{ fontWeight: '500', color: '#374151' }}>
            End Time
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <label style={{ fontWeight: '500', color: '#374151' }}>
            Color
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: '6px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              overflow: 'hidden',
              height: '42px'
            }}>
              <input
                type="color"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                style={{
                  border: 'none',
                  width: '50px',
                  height: '100%',
                  padding: 0,
                  cursor: 'pointer',
                  background: 'transparent'
                }}
              />
              <span style={{
                flex: 1,
                paddingLeft: '12px',
                fontSize: '14px',
                color: '#374151'
              }}>
                {colorHex}
              </span>
            </div>
          </label>

          <label style={{ fontWeight: '500', color: '#374151' }}>
            Reminder (minutes before)
            <input
              type="number"
              min={1}
              max={1440}
              value={reminder}
              onChange={(e) => setReminder(parseInt(e.target.value || '0', 10))}
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </label>
        </div>

        <label style={{ fontWeight: '500', color: '#374151' }}>
          Invitees (comma or newline separated emails)
          <textarea
            value={inviteesText}
            onChange={(e) => setInviteesText(e.target.value)}
            placeholder="alice@example.com, bob@example.com"
            style={{ ...inputStyle, minHeight: '70px' }}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </label>

        <button
          type="submit"
          style={{
            padding: '10px 16px',
            background: 'linear-gradient(90deg, #2563eb, #1d4ed8)',
            color: 'white',
            fontSize: '15px',
            fontWeight: '600',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            transition: 'transform 0.1s, opacity 0.2s'
          }}
          onMouseOver={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'scale(1.02)' }}
          onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)' }}
        >
          Create Meeting
        </button>

        {message && (
          <p style={{
            color: message.startsWith('❌') ? '#dc2626' : '#16a34a',
            background: message.startsWith('❌') ? '#fee2e2' : '#dcfce7',
            padding: '10px',
            borderRadius: '6px',
            fontSize: '14px',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            {message}
          </p>
        )}
      </form>
    </div>
  )
}
