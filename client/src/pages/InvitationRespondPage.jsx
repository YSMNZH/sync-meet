import { useEffect, useState } from "react";
import axios from "axios";

export default function InvitationsPage() {
  const [sent, setSent] = useState([]);
  const [received, setReceived] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadInvites = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setMessage("Not logged in");
          return;
        }
        const { data } = await axios.get("/api/invitations/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSent(data.sent);
        setReceived(data.received);
      } catch (err) {
        console.error(err);
        setMessage("Failed to load invitations");
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

      setReceived(prev =>
        prev.map(inv =>
          inv.token === invToken ? { ...inv, status: status.toUpperCase() } : inv
        )
      );
    } catch (err) {
      console.error("Failed to respond:", err.response?.data || err.message);
      setMessage("Failed to update invitation");
    }
  };

  const formatDate = date => {
    const d = new Date(date);
    return isNaN(d.getTime()) ? "Invalid Date" : d.toLocaleString();
  };

  const cardStyle = {
    background: "white",
    borderRadius: "12px",
    padding: "1rem 1.5rem",
    boxShadow: "0 6px 12px rgba(0,0,0,0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const buttonStyle = color => ({
    background: color,
    color: "white",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2rem",
        background: "linear-gradient(135deg, #dbeafe, #eff6ff)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "2rem" }}>
        My Invitations
      </h1>
      {message && <p style={{ color: "red", textAlign: "center" }}>{message}</p>}

      <section style={{ marginBottom: "3rem" }}>
        <h2>Received Invitations</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {received.map(inv => (
            <div key={inv.token} style={cardStyle}>
              <div>
                <h3 style={{ color: inv.color || "#000" }}>
                  {inv.meeting?.title || "Untitled Meeting"}
                </h3>
                <p>{inv.meeting?.description || "No description"}</p>
                <p>
                  {formatDate(inv.meeting?.startTime)} - {formatDate(inv.meeting?.endTime)}
                </p>
                <p style={{ fontSize: "0.85rem", color: "#555" }}>
                  Created: {formatDate(inv.createdAt)}
                </p>
              </div>
              {inv.status === "PENDING" ? (
                <div style={{ display: "flex", gap: "0.5rem" }}>
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
                <p style={{ fontWeight: "bold" }}>{inv.status}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Sent Invitations</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {sent.map(inv => (
            <div key={inv.id} style={cardStyle}>
              <div>
                <h3 style={{ color: inv.color || "#000" }}>
                  {inv.meeting?.title || "Untitled Meeting"}
                </h3>
                <p>{inv.meeting?.description || "No description"}</p>
                <p>
                  {formatDate(inv.meeting?.startTime)} - {formatDate(inv.meeting?.endTime)}
                </p>
                <p>
                  Invitee: {inv.invitee?.name || inv.email || "Unknown"}
                </p>
                <p style={{ fontSize: "0.85rem", color: "#555" }}>
                  Created: {formatDate(inv.createdAt)}
                </p>
                <p style={{ fontWeight: "bold" }}>
                  Status: {inv.status.toUpperCase()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
