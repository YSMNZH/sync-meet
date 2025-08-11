import { useEffect, useMemo, useState } from 'react'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { format, parse, startOfWeek, getDay } from 'date-fns'
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
  const [range, setRange] = useState({ start: new Date(), end: new Date() })

  const fetchEvents = async (r) => {
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
  }

  useEffect(() => { fetchEvents(range) }, [])

  const eventPropGetter = useMemo(() => (event) => ({ style: { backgroundColor: event.color, color: 'white', border: 'none' } }), [])

  return (
    <div>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={[Views.MONTH, Views.WEEK]}
        view={view}
        onView={setView}
        style={{ height: '80vh' }}
        onRangeChange={(r) => {
          let start, end
          if (Array.isArray(r)) {
            start = r[0]
            end = r[r.length - 1]
          } else {
            start = r.start
            end = r.end
          }
          const newRange = { start, end }
          setRange(newRange)
          fetchEvents(newRange)
        }}
        eventPropGetter={eventPropGetter}
      />
    </div>
  )
}