import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'

export default function InvitationRespondPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [inv, setInv] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const { data } = await axios.get(`/api/invitations/${token}`)
        setInv(data)
      } catch {
        setMessage('Invalid or expired invitation link')
      }
    }
    if (token) load()
  }, [token])

  const respond = async (status) => {
    try {
      await axios.post('/api/invitations/respond', { token, status })
      setMessage(`Response saved: ${status}`)
    } catch {
      setMessage('Failed to save response')
    }
  }

  if (!token) return <p>Missing token.</p>
  if (!inv) return <p>{message || 'Loading invitation...'}</p>

  return (
    <div style={{ maxWidth: 640 }}>
      <h2>{inv.meeting.title}</h2>
      <p>{inv.meeting.description}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => respond('ACCEPTED')} style={{ padding: '8px 12px', background: '#10b981', color: 'white', borderRadius: 6 }}>Attend</button>
        <button onClick={() => respond('DECLINED')} style={{ padding: '8px 12px', background: '#ef4444', color: 'white', borderRadius: 6 }}>Not Attend</button>
      </div>
      {message && <p>{message}</p>}
    </div>
  )
}