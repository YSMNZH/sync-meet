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
  fontSize: "2rem",
  fontWeight: "700",
  marginBottom: 24,
  textAlign: "center",
  color: "#2563eb",
};

const listStyles = {
  display: "grid",
  gap: 12,
  padding: 0,
  listStyle: "none",
  maxWidth: 700,
  margin: "0 auto",
};

const itemStyles = {
  border: "1px solid #bfdbfe",
  borderRadius: 12,
  padding: 20,
  backgroundColor: "white",
  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)",
  transition: "transform 0.2s ease",
  cursor: "pointer",
};

const itemHoverStyles = {
  transform: "scale(1.03)",
  boxShadow: "0 6px 18px rgba(59, 130, 246, 0.3)",
};

const titleRowStyles = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontWeight: "600",
  fontSize: "1.1rem",
  color: "#1e40af",
};

const descriptionStyles = {
  marginTop: 8,
  fontSize: "0.95rem",
  lineHeight: 1.4,
  color: "#3b82f6",
};

const infoRowStyles = {
  marginTop: 6,
  fontSize: "0.85rem",
  color: "#1e3a8a",
};

export default function ArchivesPage() {
  const [items, setItems] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await axios.get("/api/meetings/archives/list");
        setItems(data);
      } catch (err) {
        console.error("Failed to load archived meetings", err);
      }
    }
    load();
  }, []);

  return (
    <div style={pageStyles}>
      <h2 style={headerStyles}>Archived Meetings</h2>
      <ul style={listStyles}>
        {items.map((m, i) => (
          <li
            key={m.id}
            style={{
              ...itemStyles,
              ...(hoveredIndex === i ? itemHoverStyles : {}),
            }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div style={titleRowStyles}>
              <strong>{m.title}</strong>
            </div>
            <p style={descriptionStyles}>{m.description || "No description"}</p>
            <div style={infoRowStyles}>
              <strong>ُstart Time:</strong>{" "}
              {m.startTime ? new Date(m.startTime).toLocaleString() : "N/A"}
            </div>
            <div style={infoRowStyles}>
              <strong>End Time:</strong>{" "}
              {m.endTime ? new Date(m.endTime).toLocaleString() : "N/A"}
            </div>

            <div style={infoRowStyles}>
              <strong>Organizer:</strong> {m.organizerEmail || "Unknown"}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
