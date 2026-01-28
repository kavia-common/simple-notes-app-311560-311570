import React, { useEffect, useMemo, useState } from "react";

// PUBLIC_INTERFACE
export default function NoteEditor({ initialNote, mode, onCancel, onSave, isSaving }) {
  /** Form for creating/editing a note. */
  const initialTitle = initialNote?.title ?? "";
  const initialContent = initialNote?.content ?? "";

  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent);
  }, [initialTitle, initialContent]);

  const canSave = useMemo(() => title.trim().length > 0, [title]);

  const submit = (e) => {
    e.preventDefault();
    if (!canSave || isSaving) return;
    onSave?.({ title: title.trim(), content });
  };

  return (
    <form className="sn-form" onSubmit={submit}>
      <label className="sn-label">
        Title
        <input
          className="sn-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
          maxLength={200}
          required
        />
      </label>

      <label className="sn-label">
        Content
        <textarea
          className="sn-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your note..."
          rows={10}
        />
      </label>

      <div className="sn-form__actions">
        <button type="button" className="sn-btn sn-btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="sn-btn sn-btn--primary" disabled={!canSave || isSaving}>
          {isSaving ? "Saving..." : mode === "edit" ? "Save changes" : "Create note"}
        </button>
      </div>
    </form>
  );
}

