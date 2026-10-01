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

    throw new Error(message || `Request failed: ${response.status}`);
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
