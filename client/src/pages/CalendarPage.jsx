import { useEffect, useMemo, useState } from 'react'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import {
  format,
  parse,
  startOfWeek,
  getDay,
  startOfMonth,
  endOfMonth,
} from 'date-fns'
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
  const [date, setDate] = useState(new Date())
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

  useEffect(() => {
    fetchEvents(range)
  }, [range])

  useEffect(() => {
    let start, end

    if (view === Views.MONTH) {
      start = startOfMonth(date)
      end = endOfMonth(date)
    } else if (view === Views.WEEK) {
      start = startOfWeek(date, { weekStartsOn: 1 })
      end = new Date(start)
      end.setDate(end.getDate() + 6)
    } else {
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
        borderRadius: 10,
        border: '2px solid #fff',
        boxShadow:
          '0 4px 8px rgba(0, 0, 0, 0.15), 0 0 6px rgba(255, 255, 255, 0.3)',
        padding: '8px 12px',
        fontWeight: '700',
        fontSize: '1rem',
        lineHeight: 1.3,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        userSelect: 'none',
      },
      onMouseEnter: (e) => {
        e.currentTarget.style.transform = 'scale(1.08)'
        e.currentTarget.style.boxShadow =
          '0 8px 16px rgba(0, 0, 0, 0.25), 0 0 10px rgba(255, 255, 255, 0.5)'
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow =
          '0 4px 8px rgba(0, 0, 0, 0.15), 0 0 6px rgba(255, 255, 255, 0.3)'
      },
    }),
    []
  )

  const calendarStyles = {
    height: '82vh',
    borderRadius: 20,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    backgroundColor: '#ffffff',
    padding: 24,
    fontSize: '1rem',
    border: '1px solid #e2e8f0',
  }

  const headerStyles = {
    maxWidth: 960,
    margin: '40px auto',
    padding: '0 20px',
    fontFamily:
      "'Inter', system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, sans-serif",
    color: '#1e293b',
    backgroundColor: '#f0f9ff',
    borderRadius: 20,
    boxShadow: '0 15px 45px rgba(14, 165, 233, 0.15)',
  }

  const headerInnerStyles = {
    padding: '18px 0',
    marginBottom: 30,
    borderBottom: '3px solid #3b82f6',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }

  return (
    <div style={headerStyles}>
      <header style={headerInnerStyles}>
        <h1
          style={{
            margin: 0,
            fontWeight: 900,
            fontSize: '2.2rem',
            color: '#1e40af',
            textShadow: '1px 1px 4px rgba(59, 130, 246, 0.3)',
          }}
        >
          My Calendar
        </h1>
        <div
          style={{
            fontSize: '1.1rem',
            color: loading ? '#2563eb' : '#64748b',
            fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
          }}
        >
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
        style={calendarStyles}
        eventPropGetter={eventPropGetter}
        popup
        popupOffset={15}
      />
    </div>
  )
}
