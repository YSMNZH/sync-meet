import { useEffect, useState } from "react";
import axios from "axios";

const pageStyles = {
  minHeight: "100vh",
  padding: "40px 20px",
  background: "linear-gradient(135deg, #dbeafe, #eff6ff)",
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  color: "#1e3a8a",
};

const headerStyles = {
  fontSize: "2.5rem",
  fontWeight: 700,
  marginBottom: 24,
  textAlign: "center",
  color: "#2563eb",
};

const sectionHeaderStyles = {
  fontSize: "1.5rem",
  fontWeight: 600,
  marginBottom: 16,
  color: "#1e40af",
  borderBottom: "2px solid #93c5fd",
  paddingBottom: 4,
};

const gridStyles = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
  gap: 24,
};

const listStyles = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  padding: 0,
  listStyle: "none",
};

const cardStyles = {
  border: "1px solid #bfdbfe",
  borderRadius: 12,
  padding: 20,
  backgroundColor: "white",
  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};

const cardHoverStyles = {
  transform: "scale(1.03)",
  boxShadow: "0 8px 24px rgba(59, 130, 246, 0.25)",
};

const titleStyles = {
  fontSize: "1.3rem",
  fontWeight: 700,
  color: "#1e40af",
  marginBottom: 6,
};

const descriptionStyles = {
  fontSize: "0.95rem",
  lineHeight: 1.4,
  color: "#3b82f6",
  marginBottom: 12,
};

const footerStyles = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 12,
};

const metaTextStyles = {
  fontSize: "0.85rem",
  color: "#6b7280",
};

const statusBadge = (status) => {
  const base = {
    padding: "4px 10px",
    borderRadius: 12,
    fontWeight: 600,
    fontSize: "0.85rem",
    textTransform: "uppercase",
  };
  switch (status) {
    case "ACCEPTED":
      return { ...base, backgroundColor: "#d1fae5", color: "#059669" };
    case "DECLINED":
      return { ...base, backgroundColor: "#fee2e2", color: "#b91c1c" };
    default:
      return { ...base, backgroundColor: "#f3f4f6", color: "#374151" };
  }
};

const buttonStyle = (color) => ({
  background: color,
  color: "white",
  border: "none",
  padding: "0.5rem 1rem",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 600,
  transition: "transform 0.1s",
});

export default function InvitationsPage() {
  const [sent, setSent] = useState([]);
  const [received, setReceived] = useState([]);
  const [message, setMessage] = useState("");
  const [hoveredSent, setHoveredSent] = useState(null);
  const [hoveredReceived, setHoveredReceived] = useState(null);

  useEffect(() => {
    const loadInvites = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setMessage("Not Logged in");
          return;
        }
        const { data } = await axios.get("/api/invitations/my", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const sortedSent = [...(data.sent || [])].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        const sortedReceived = [...(data.received || [])]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .sort((a, b) => {
            const aPending = a.status !== "ACCEPTED" && a.status !== "DECLINED";
            const bPending = b.status !== "ACCEPTED" && b.status !== "DECLINED";
            return aPending === bPending ? 0 : aPending ? -1 : 1;
          });

        setSent(sortedSent);
        setReceived(sortedReceived);
      } catch (err) {
        console.error(err);
        setMessage("Failed to Load Invitations");
      }
    };
    loadInvites();
  }, []);

  const handleResponse = async (invToken, status) => {
    try {
      const tokenAuth = localStorage.getItem("token");
      await axios.post(
        "/api/invitations/respond",
        { token: invToken, status: status.toUpperCase() },
        { headers: { Authorization: `Bearer ${tokenAuth}` } }
      );

      setReceived((prev) => {
        const updated = prev.map((inv) =>
          inv.token === invToken
            ? { ...inv, status: status.toUpperCase(), respondedAt: new Date() }
            : inv
        );
        return updated
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .sort((a, b) => {
            const aPending =
              a.status !== "ACCEPTED" && a.status !== "DECLINED";
            const bPending =
              b.status !== "ACCEPTED" && b.status !== "DECLINED";
            return aPending === bPending ? 0 : aPending ? -1 : 1;
          });
      });
    } catch (err) {
      console.error("Failed to Respond:", err.response?.data || err.message);
      setMessage("Failed to Update Invitation");
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not Set";
    const d = new Date(date);
    return isNaN(d.getTime())
      ? "Invalid Date"
      : d.toLocaleString([], {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  const renderReceivedCard = (inv, i) => {
    const meeting = inv.meeting || {};
    const organizerName = meeting.organizer?.name || inv.email || "Unknown";

    return (
      <li
        key={inv.token}
        style={{
          ...cardStyles,
          ...(hoveredReceived === i ? cardHoverStyles : {}),
        }}
        onMouseEnter={() => setHoveredReceived(i)}
        onMouseLeave={() => setHoveredReceived(null)}
      >
        <div>
          <div style={titleStyles}>{meeting.title || "Untitled Meeting"}</div>
          <div style={descriptionStyles}>
            {meeting.description || "No description"}
          </div>
        </div>
        <div style={footerStyles}>
          <div style={metaTextStyles}>
            From: {organizerName} <br />
            Time: {formatDate(meeting.startTime)} - {formatDate(meeting.endTime)} <br />
            Sent at: {formatDate(inv.createdAt)}
          </div>
          {inv.status === "PENDING" ? (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                style={buttonStyle("#22c55e")}
                onClick={() => handleResponse(inv.token, "ACCEPTED")}
              >
                Accept
              </button>
              <button
                style={buttonStyle("#ef4444")}
                onClick={() => handleResponse(inv.token, "DECLINED")}
              >
                Decline
              </button>
            </div>
          ) : (
            <div style={statusBadge(inv.status)}>{inv.status}</div>
          )}
        </div>
      </li>
    );
  };

  const renderSentCard = (inv, i) => {
    const meeting = inv.meeting || {};
    const inviteeName =
      inv.invitee?.name || inv.invitee?.email || inv.email || "Unknown";

    return (
      <li
        key={inv.id}
        style={{
          ...cardStyles,
          ...(hoveredSent === i ? cardHoverStyles : {}),
        }}
        onMouseEnter={() => setHoveredSent(i)}
        onMouseLeave={() => setHoveredSent(null)}
      >
        <div>
          <div style={titleStyles}>{meeting.title || "Untitled Meeting"}</div>
          <div style={descriptionStyles}>
            {meeting.description || "No description"}
          </div>
        </div>
        <div style={footerStyles}>
          <div style={metaTextStyles}>
            To: {inviteeName} <br />
            Meeting: {formatDate(meeting.startTime)} - {formatDate(meeting.endTime)} <br />
            Sent at: {formatDate(inv.createdAt)}
          </div>
          <div style={statusBadge(inv.status)}>{inv.status.toUpperCase()}</div>
        </div>
      </li>
    );
  };

  return (
    <div style={pageStyles}>
      <h1 style={headerStyles}>My Invitations</h1>
      {message && (
        <p style={{ color: "#b91c1c", textAlign: "center", marginBottom: 20 }}>
          {message}
        </p>
      )}

      <div style={gridStyles}>
        <section>
          <h2 style={sectionHeaderStyles}>Received Invitations</h2>
          <ul style={listStyles}>{received.map(renderReceivedCard)}</ul>
        </section>

        <section>
          <h2 style={sectionHeaderStyles}>Sent Invitations</h2>
          <ul style={listStyles}>{sent.map(renderSentCard)}</ul>
        </section>
      </div>
    </div>
  );
}
