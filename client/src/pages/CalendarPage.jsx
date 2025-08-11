import { useEffect, useMemo, useState } from 'react'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth } from 'date-fns'
import { enUS } from 'date-fns/locale'
import axios from 'axios'

const locales = { 'en-US': enUS }
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})

export default function CalendarPage() {
  const [events, setEvents] = useState([])
  const [view, setView] = useState(Views.MONTH)
  const [date, setDate] = useState(new Date())  // <-- control current date
  const [range, setRange] = useState(() => ({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  }))
  const [loading, setLoading] = useState(false)

  const fetchEvents = async (r) => {
    setLoading(true)
    try {
      const params = { start: r.start.toISOString(), end: r.end.toISOString() }
      const { data } = await axios.get('/api/meetings', { params })
      const mapped = data.map((m) => ({
        id: m.id,
        title: m.title,
        start: new Date(m.startTime),
        end: new Date(m.endTime),
        color: m.colorHex || '#3b82f6',
      }))
      setEvents(mapped)
    } catch (err) {
      console.error('Failed to fetch events', err)
      setEvents([])
    }
    setLoading(false)
  }

  // Update events whenever range changes
  useEffect(() => {
    fetchEvents(range)
  }, [range])

  // Update range whenever date or view changes
  useEffect(() => {
    let start, end

    if (view === Views.MONTH) {
      start = startOfMonth(date)
      end = endOfMonth(date)
    } else if (view === Views.WEEK) {
      // Start from Monday to Sunday in the selected week
      start = startOfWeek(date, { weekStartsOn: 1 })
      end = new Date(start)
      end.setDate(end.getDate() + 6)
    } else {
      // fallback for other views (if any)
      start = startOfMonth(date)
      end = endOfMonth(date)
    }

    setRange({ start, end })
  }, [date, view])

  const eventPropGetter = useMemo(
    () => (event) => ({
      style: {
        backgroundColor: event.color,
        color: 'white',
        borderRadius: 8,
        border: 'none',
        boxShadow: '0 3px 8px rgba(0,0,0,0.18)',
        padding: '6px 10px',
        fontWeight: '600',
        fontSize: '0.9rem',
        lineHeight: 1.2,
        cursor: 'pointer',
        transition: 'transform 0.15s ease',
      },
      onMouseEnter: (e) => (e.currentTarget.style.transform = 'scale(1.05)'),
      onMouseLeave: (e) => (e.currentTarget.style.transform = 'scale(1)'),
    }),
    []
  )

  return (
    <div
      style={{
        maxWidth: 960,
        margin: '40px auto',
        padding: '0 20px',
        fontFamily: "'Inter', system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, sans-serif",
        color: '#222',
        backgroundColor: '#f9fafb',
        borderRadius: 16,
        boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
      }}
    >
      <header
        style={{
          padding: '16px 0',
          marginBottom: 20,
          borderBottom: '2px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1 style={{ margin: 0, fontWeight: 700, fontSize: '1.8rem', color: '#111827' }}>
          My Calendar
        </h1>
        <div style={{ fontSize: '1rem', color: '#6b7280' }}>
          {loading ? 'Loading events...' : `${events.length} events`}
        </div>
      </header>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={[Views.MONTH, Views.WEEK]}
        view={view}
        date={date}
        onView={setView}
        onNavigate={setDate}
        style={{
          height: '82vh',
          borderRadius: 16,
          boxShadow: '0 6px 24px rgb(0 0 0 / 0.12)',
          backgroundColor: 'white',
          padding: 16,
          fontSize: '0.95rem',
        }}
        eventPropGetter={eventPropGetter}
        popup
      />
    </div>
  )
}
