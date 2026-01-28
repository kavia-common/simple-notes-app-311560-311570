import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

import { createNote, deleteNote, listNotes, searchNotes, updateNote } from "./api";
import Modal from "./components/Modal";
import NoteEditor from "./components/NoteEditor";
import NoteList from "./components/NoteList";

/**
 * Notes App UI:
 * - Top bar with title + create button
 * - Search input (debounced, calls backend /search)
 * - Notes list with edit/delete
 * - Create/Edit in modal
 */

// PUBLIC_INTERFACE
function App() {
  /** Main application component. */
  const [notes, setNotes] = useState([]);
  const [selected, setSelected] = useState(null);

  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [modal, setModal] = useState({ open: false, mode: "create", note: null });
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const lastIssuedSearch = useRef(0);

  const loadAll = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await listNotes();
      const items = data?.items ?? [];
      setNotes(items);
      setSelected(items[0] ?? null);
    } catch (e) {
      setError(e?.message || "Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Debounced backend search (falls back to listNotes when query empty)
  useEffect(() => {
    let cancelled = false;
    const q = query.trim();

    const doWork = async () => {
      const issued = Date.now();
      lastIssuedSearch.current = issued;

      if (!q) {
        setIsSearching(false);
        await loadAll();
        return;
      }

      setIsSearching(true);
      setError("");
      try {
        const data = await searchNotes(q, { limit: 50 });

        // only accept latest response
        if (cancelled) return;
        if (lastIssuedSearch.current !== issued) return;

        const items = data?.items ?? [];
        setNotes(items);
        setSelected(items[0] ?? null);
      } catch (e) {
        if (cancelled) return;
        setError(e?.message || "Search failed");
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    };

    const t = setTimeout(doWork, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const headerSubtitle = useMemo(() => {
    if (loading) return "Loading…";
    if (isSearching) return "Searching…";
    if (query.trim()) return `Results for “${query.trim()}”`;
    return `${notes.length} note${notes.length === 1 ? "" : "s"}`;
  }, [loading, isSearching, query, notes.length]);

  const openCreate = () => setModal({ open: true, mode: "create", note: null });
  const openEdit = (note) => setModal({ open: true, mode: "edit", note });
  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  const onSave = async ({ title, content }) => {
    setIsSaving(true);
    setError("");
    try {
      if (modal.mode === "edit" && modal.note) {
        const updated = await updateNote(modal.note.id, { title, content });
        setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
        setSelected(updated);
      } else {
        const created = await createNote({ title, content });
        // ensure appears at top in UI
        setNotes((prev) => [created, ...prev]);
        setSelected(created);
      }
      closeModal();
      setQuery(""); // return to full list after create/edit for clarity
      await loadAll();
    } catch (e) {
      setError(e?.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = async (note) => {
    const ok = window.confirm(`Delete “${note.title}”? This cannot be undone.`);
    if (!ok) return;

    setError("");
    try {
      await deleteNote(note.id);
      setNotes((prev) => prev.filter((n) => n.id !== note.id));
      setSelected((prevSel) => (prevSel?.id === note.id ? null : prevSel));
      if (query.trim()) {
        // re-run search to keep UI consistent with backend results
        const data = await searchNotes(query.trim(), { limit: 50 });
        setNotes(data?.items ?? []);
      } else {
        await loadAll();
      }
    } catch (e) {
      setError(e?.message || "Delete failed");
    }
  };

  return (
    <div className="sn-app">
      <div className="sn-topbar">
        <div className="sn-topbar__left">
          <div className="sn-title">Notes</div>
          <div className="sn-subtitle">{headerSubtitle}</div>
        </div>
        <div className="sn-topbar__right">
          <button className="sn-btn sn-btn--primary" onClick={openCreate}>
            New note
          </button>
        </div>
      </div>

      <main className="sn-main">
        <section className="sn-panel sn-panel--left" aria-label="Notes list panel">
          <div className="sn-search">
            <input
              className="sn-input sn-input--search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes by title or content…"
              aria-label="Search notes"
            />
            {query ? (
              <button className="sn-btn sn-btn--ghost sn-btn--tiny" onClick={() => setQuery("")}>
                Clear
              </button>
            ) : null}
          </div>

          {error ? (
            <div className="sn-alert" role="alert">
              {error}
            </div>
          ) : null}

          {loading ? <div className="sn-loading">Loading notes…</div> : null}

          {!loading ? (
            <NoteList
              notes={notes}
              selectedId={selected?.id ?? null}
              onSelect={(n) => setSelected(n)}
              onEdit={openEdit}
              onDelete={onDelete}
            />
          ) : null}
        </section>

        <section className="sn-panel sn-panel--right" aria-label="Selected note panel">
          {selected ? (
            <div className="sn-detail">
              <div className="sn-detail__title">{selected.title}</div>
              <div className="sn-detail__meta">
                <span className="sn-badge">Created {new Date(selected.created_at).toLocaleString()}</span>
                <span className="sn-badge">Updated {new Date(selected.updated_at).toLocaleString()}</span>
              </div>
              <div className="sn-detail__content">{selected.content || <em>No content</em>}</div>
              <div className="sn-detail__actions">
                <button className="sn-btn sn-btn--ghost" onClick={() => openEdit(selected)}>
                  Edit
                </button>
                <button className="sn-btn sn-btn--danger" onClick={() => onDelete(selected)}>
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="sn-empty sn-empty--detail">
              <div className="sn-empty__title">Select a note</div>
              <div className="sn-empty__subtitle">Pick a note from the list to view it here.</div>
            </div>
          )}
        </section>
      </main>

      <button className="sn-fab" onClick={openCreate} aria-label="Create new note">
        New
      </button>

      <Modal
        isOpen={modal.open}
        onClose={() => {
          if (!isSaving) closeModal();
        }}
        title={modal.mode === "edit" ? "Edit note" : "New note"}
        footer={null}
      >
        <NoteEditor
          mode={modal.mode}
          initialNote={modal.note}
          onCancel={closeModal}
          onSave={onSave}
          isSaving={isSaving}
        />
      </Modal>
    </div>
  );
}

export default App;

