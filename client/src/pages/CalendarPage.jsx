import { useEffect, useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { syncMeetingToGoogle } from '../services/api';
import toast, { Toaster } from 'react-hot-toast';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  format,
  parse,
  startOfWeek,
  getDay,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { enUS } from 'date-fns/locale';
import axios from 'axios';

const modalOverlay = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',  alignItems: 'center',
  zIndex: 9999,
};

const modalContent = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '24px',
  width: '420px',
  maxWidth: '90%',
  boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
  animation: 'fadeIn 0.3s ease',
  fontFamily: "'Inter', sans-serif",
};

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [range, setRange] = useState(() => ({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  }));
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchEvents = async (r) => {
    setLoading(true);
    try {
      const params = { start: r.start.toISOString(), end: r.end.toISOString() };
      const { data } = await axios.get('/api/meetings', { params });
      const mapped = data.map((m) => ({        id: m.id,
        title: m.title,
        start: new Date(m.startTime),
        end: new Date(m.endTime),
        description: m.description || 'No description provided',        invitees: m.invitees || [],
        color: m.colorHex || '#3b82f6',
        organizer: m.organizer || null,
        googleEventId: m.googleEventId || null,
      }));
      setEvents(mapped);
    } catch (err) {
      console.error('Failed to fetch events', err);
      setEvents([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents(range);
  }, [range]);

  useEffect(() => {
    let start, end;
    if (view === Views.MONTH) {
      start = startOfMonth(date);
      end = endOfMonth(date);
    } else if (view === Views.WEEK) {      start = startOfWeek(date, { weekStartsOn: 1 });
      end = new Date(start);
      end.setDate(end.getDate() + 6);
    } else {
      start = startOfMonth(date);      end = endOfMonth(date);
    }
    setRange({ start, end });
  }, [date, view]);

  const eventPropGetter = useMemo(
    () => (event) => ({
      style: {
        backgroundColor: event.color,
        color: 'white',
        borderRadius: 10,        border: '2px solid #fff',
        boxShadow:
          '0 4px 8px rgba(0, 0, 0, 0.15), 0 0 6px rgba(255, 255, 255, 0.3)',
        padding: '12px 16px',
        fontWeight: '700',
        fontSize: '1rem',
        lineHeight: 1.3,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        userSelect: 'none',
        minHeight: '60px',
      },
      onMouseEnter: (e) => {
        e.currentTarget.style.transform = 'scale(1.08)';        e.currentTarget.style.boxShadow =
          '0 8px 16px rgba(0, 0, 0, 0.25), 0 0 10px rgba(255, 255, 255, 0.5)';
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow =
          '0 4px 8px rgba(0, 0, 0, 0.15), 0 0 6px rgba(255, 255, 255, 0.3)';
      },
    }),
    []
  );

  const calendarStyles = {
    margin: '0 24px 24px 24px',
    borderRadius: 20,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    backgroundColor: '#ffffff',
    padding: 24,    fontSize: '1rem',
    border: '1px solid #e2e8f0',
  };

  const headerStyles = {
    fontFamily:
      "'Inter', system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, sans-serif",
    color: '#1e293b',
    backgroundColor: '#f0f9ff',
    borderRadius: 20,
    boxShadow: '0 15px 45px rgba(14, 165, 233, 0.15)',
  };

  const headerInnerStyles = {
    padding: '18px 0',
    marginBottom: 30,
    borderBottom: '3px solid #3b82f6',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      .rbc-month-row { min-height: 140px !important; }
      .rbc-time-slot { min-height: 40px !important; }
      .rbc-row { min-height: 40px !important; }
    `;
    document.head.appendChild(styleTag);
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  const handleSync = async (meetingId) => {
    if (!meetingId) return;

    const toastId = toast.loading('Syncing to Google Calendar...');

    try {
      const { data } = await syncMeetingToGoogle(meetingId);
      toast.success(`Meeting "${data.event.summary}" synced successfully!`, {
        id: toastId,
      });

      setEvents(prevEvents =>
        prevEvents.map(ev =>
          ev.id === meetingId ? { ...ev, googleEventId: data.event.id } : ev
        )
      );
      setSelectedEvent(prev => ({ ...prev, googleEventId: data.event.id }));
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to sync meeting.';
      toast.error(errorMessage, {
        id: toastId,
      });
      console.error('Sync failed:', err);
    }
  };

  return (
    <div style={headerStyles}>
      <Toaster position="top-center" reverseOrder={false} />
      <header style={headerInnerStyles}>
        <h1
          style={{
            margin: '45px',
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
            margin: '50px',
            fontSize: '1.1rem',
            color: loading ? '#2563eb' : '#64748b',
            fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {loading ? 'Loading events...' : `${events.length} events`}
        </div>
      </header>      <Calendar
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
        onSelectEvent={(event) => setSelectedEvent(event)}
        dayPropGetter={() => ({ style: { position: 'relative' } })}
      />

      {selectedEvent && (
        <div style={modalOverlay} onClick={() => setSelectedEvent(null)}>
          <div
            style={{ ...modalContent, position: 'relative' }}            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedEvent(null)}
              style={{
                position: 'absolute',
                top: '12px',
                left: '16px',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#64748b',                cursor: 'pointer',
              }}
            >
              ×
            </button>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '16px',
                color: selectedEvent.color || '#1e40af',
                textAlign: 'center',
              }}
            >
              {selectedEvent.title}
            </h2>
            <p>
              <strong style={{ color: selectedEvent.color || '#1e40af' }}>
                Start Time:
              </strong>{' '}
              <span>{format(selectedEvent.start, 'PPpp')}</span>
            </p>
            <p>
              <strong style={{ color: selectedEvent.color || '#1e40af' }}>
                End Time:
              </strong>{' '}
              <span>{format(selectedEvent.end, 'PPpp')}</span>
            </p>
            <p>
              <strong style={{ color: selectedEvent.color || '#1e40af' }}>
                Description:
              </strong>{' '}
              <span>{selectedEvent.description}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}