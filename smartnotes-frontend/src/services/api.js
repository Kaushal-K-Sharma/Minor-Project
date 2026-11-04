
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000"
).replace(/\/+$/, "");

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null
        ? data.error || data.message
        : data;

    const error = new Error(message || `Request failed: ${response.status}`);

    // Preserve job ID so the frontend can retry without transcription.
    if (typeof data === "object" && data !== null) {
      error.job_id = data.job_id;
      error.transcript_saved = data.transcript_saved;
      error.status = response.status;
    }

    throw error;
  }

  return data;
}

export function uploadLecture(file) {
  const formData = new FormData();
  formData.append("file", file);

  return request("/api/lecture/process", {
    method: "POST",
    body: formData,
  });
}

export function retryLectureNotes(jobId) {
  return request(
    `/api/lecture/retry-notes/${encodeURIComponent(jobId)}`,
    {
      method: "POST",
    }
  );
}

export function generateStudyNotes({ topic, subtopic, level }) {
  return request("/api/study/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ topic, subtopic, level }),
  });
}

export function getNotesHistory() {
  return request("/api/history");
}

export function getNote(noteId) {
  return request(`/api/notes/${encodeURIComponent(noteId)}`);
}


export function deleteNote(noteId) {
  return request(`/api/notes/${encodeURIComponent(noteId)}`, {
    method: "DELETE",
  });
}