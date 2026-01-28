/**
 * Small API helper for the Notes backend.
 * Backend runs on port 3001 in this environment.
 */

const DEFAULT_BASE_URL = "http://localhost:3001";

/**
 * Build an API error with best-effort detail extraction.
 */
async function buildApiError(response) {
  let detail = `Request failed (${response.status})`;
  try {
    const data = await response.json();
    if (typeof data?.detail === "string") detail = data.detail;
  } catch {
    // ignore JSON parse errors
  }
  const err = new Error(detail);
  err.status = response.status;
  return err;
}

/**
 * Internal JSON request wrapper.
 */
async function requestJson(path, { method = "GET", body } = {}) {
  const baseUrl =
    (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_BASE_URL) ||
    DEFAULT_BASE_URL;

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    throw await buildApiError(res);
  }

  // 204 has no body
  if (res.status === 204) return null;

  return await res.json();
}

// PUBLIC_INTERFACE
export async function listNotes() {
  /** Fetch all notes, ordered by updated_at desc. */
  return await requestJson("/notes");
}

// PUBLIC_INTERFACE
export async function searchNotes(q, { limit = 50 } = {}) {
  /** Search notes by title/content. */
  const qs = new URLSearchParams({ q: String(q || "").trim(), limit: String(limit) });
  return await requestJson(`/search?${qs.toString()}`);
}

// PUBLIC_INTERFACE
export async function createNote({ title, content }) {
  /** Create a new note. */
  return await requestJson("/notes", {
    method: "POST",
    body: { title, content },
  });
}

// PUBLIC_INTERFACE
export async function updateNote(noteId, { title, content }) {
  /** Update an existing note. Provide title/content (at least one). */
  return await requestJson(`/notes/${noteId}`, {
    method: "PUT",
    body: { title, content },
  });
}

// PUBLIC_INTERFACE
export async function deleteNote(noteId) {
  /** Delete a note by id. */
  return await requestJson(`/notes/${noteId}`, { method: "DELETE" });
}

