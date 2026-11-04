
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Clock3,
  FileAudio,
  Search,
  Sparkles,
  Trash2,
  LoaderCircle,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { getNotesHistory, getNote, deleteNote } from "../services/api";
import "./History.css";

export default function History() {
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openingId, setOpeningId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch real history from Flask
  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getNotesHistory();
      setHistory(response.history || []);
    } catch (err) {
      setError(err.message || "Could not load notes history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Search and filter
  const filteredHistory = useMemo(() => {
    const query = search.trim().toLowerCase();

    return history.filter((item) => {
      const matchesSearch =
        (item.title || "").toLowerCase().includes(query) ||
        (item.description || "").toLowerCase().includes(query);

      const matchesFilter =
        filter === "all" || item.mode === filter;

      return matchesSearch && matchesFilter;
    });
  }, [history, search, filter]);

  // Open complete saved notes
  const handleViewNotes = async (id) => {
    try {
      setOpeningId(id);

      const response = await getNote(id);

      navigate("/notes", {
        state: response,
      });
    } catch (err) {
      alert(err.message || "Could not open these notes.");
    } finally {
      setOpeningId(null);
    }
  };

  // Permanently delete saved notes
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete these notes?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);

      await deleteNote(id);

      setHistory((current) =>
        current.filter((item) => item.id !== id)
      );
    } catch (err) {
      alert(err.message || "Could not delete these notes.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <>
      <Navbar />

      <main className="history-page">
        <div className="history-container">

          <div className="history-heading">
            <div>
              <span className="history-eyebrow">YOUR WORKSPACE</span>
              <h1>Notes History</h1>
              <p>
                Find and revisit your previously generated notes.
              </p>
            </div>

            <Link
              to="/mode-selection"
              className="history-create-btn"
            >
              <Sparkles size={18} />
              Create New Notes
            </Link>
          </div>

          <div className="history-toolbar">
            <div className="history-search">
              <Search size={19} />

              <input
                type="search"
                placeholder="Search your notes..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search notes history"
              />
            </div>

            <div
              className="history-filters"
              aria-label="Filter history"
            >
              <button
                type="button"
                className={filter === "all" ? "active" : ""}
                onClick={() => setFilter("all")}
              >
                All
              </button>

              <button
                type="button"
                className={filter === "lecture" ? "active" : ""}
                onClick={() => setFilter("lecture")}
              >
                Lectures
              </button>

              <button
                type="button"
                className={filter === "study" ? "active" : ""}
                onClick={() => setFilter("study")}
              >
                Study Mode
              </button>
            </div>
          </div>

          <div className="history-results">
            <div className="history-results-heading">
              <h2>Recent notes</h2>
              <span>{filteredHistory.length} items</span>
            </div>

            {loading ? (
              <div className="history-empty">
                <LoaderCircle size={32} />
                <h3>Loading your notes...</h3>
              </div>
            ) : error ? (
              <div className="history-empty">
                <h3>Unable to load history</h3>
                <p>{error}</p>
                <button
                  type="button"
                  className="history-create-btn"
                  onClick={fetchHistory}
                >
                  Try Again
                </button>
              </div>
            ) : filteredHistory.length > 0 ? (
              <div className="history-list">
                {filteredHistory.map((item) => (
                  <article
                    className="history-card"
                    key={item.id}
                  >
                    <div className="history-card-icon">
                      {item.mode === "lecture" ? (
                        <FileAudio size={23} />
                      ) : (
                        <BookOpen size={23} />
                      )}
                    </div>

                    <div className="history-card-content">
                      <h3>{item.title}</h3>

                      <p>{item.description || "Generated study notes"}</p>

                      <div className="history-card-meta">
                        <span className="history-mode">
                          {item.mode === "lecture"
                            ? "Lecture Notes"
                            : "Study Mode"}
                        </span>

                        <span className="history-date">
                          <Clock3 size={14} />
                          {formatDate(item.date)}
                        </span>
                      </div>
                    </div>

                    <div className="history-card-actions">
                      <button
                        type="button"
                        className="history-view-btn"
                        disabled={openingId === item.id}
                        onClick={() => handleViewNotes(item.id)}
                      >
                        {openingId === item.id
                          ? "Opening..."
                          : "View Notes"}
                      </button>

                      <button
                        type="button"
                        className="history-delete-btn"
                        disabled={deletingId === item.id}
                        onClick={() => handleDelete(item.id)}
                        aria-label={`Delete ${item.title}`}
                        title="Delete notes"
                      >
                        {deletingId === item.id ? (
                          <LoaderCircle size={18} />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="history-empty">
                <BookOpen size={36} />
                <h3>No notes found</h3>
                <p>
                  {history.length === 0
                    ? "Your generated notes will appear here."
                    : "Try a different search or filter."}
                </p>

                <Link
                  to="/mode-selection"
                  className="history-create-btn"
                >
                  Create Notes
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
