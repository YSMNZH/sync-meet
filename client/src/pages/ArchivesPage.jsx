import { useEffect, useState } from 'react'
import axios from 'axios'

export default function ArchivesPage() {
  const [items, setItems] = useState([])
  useEffect(() => {
    async function load() {
      const { data } = await axios.get('/api/meetings/archives/list')
      setItems(data)
    }
    load()
  }, [])

  return (
    <div>
      <h2>Archived Meetings</h2>
      <ul style={{ display: 'grid', gap: 8, padding: 0, listStyle: 'none' }}>
        {items.map(m => (
          <li key={m.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{m.title}</strong>
              <span>{new Date(m.startTime).toLocaleString()}</span>
            </div>
            <p style={{ marginTop: 6 }}>{m.description}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}