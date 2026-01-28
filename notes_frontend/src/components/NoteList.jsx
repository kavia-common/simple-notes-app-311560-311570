import React from "react";

function truncate(text, max = 140) {
  const t = String(text || "").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
}

// PUBLIC_INTERFACE
export default function NoteList({ notes, selectedId, onSelect, onEdit, onDelete }) {
  /** Renders a list of notes with title + truncated content and actions. */
  if (!notes || notes.length === 0) {
    return (
      <div className="sn-empty">
        <div className="sn-empty__title">No notes</div>
        <div className="sn-empty__subtitle">Create your first note to get started.</div>
      </div>
    );
  }

  return (
    <div className="sn-list" role="list" aria-label="Notes list">
      {notes.map((n) => (
        <div
          key={n.id}
          role="listitem"
          className={`sn-card ${selectedId === n.id ? "sn-card--selected" : ""}`}
          onClick={() => onSelect?.(n)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onSelect?.(n);
          }}
        >
          <div className="sn-card__head">
            <div className="sn-card__title">{n.title}</div>
            <div className="sn-card__actions">
              <button
                type="button"
                className="sn-btn sn-btn--tiny sn-btn--ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(n);
                }}
                aria-label={`Edit note ${n.title}`}
              >
                Edit
              </button>
              <button
                type="button"
                className="sn-btn sn-btn--tiny sn-btn--danger"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(n);
                }}
                aria-label={`Delete note ${n.title}`}
              >
                Delete
              </button>
            </div>
          </div>

          <div className="sn-card__content">{truncate(n.content, 160) || <em>No content</em>}</div>

          <div className="sn-card__meta">
            <span className="sn-badge">Updated {new Date(n.updated_at).toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

