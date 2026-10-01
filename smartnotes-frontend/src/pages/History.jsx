import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Clock3,
  FileAudio,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import Navbar from "../components/Navbar";
import "./History.css";

const initialHistory = [
  {
    id: 1,
    title: "Introduction to Machine Learning",
    mode: "study",
    date: "2026-09-30",
    description: "Study notes about the fundamentals of machine learning.",
  },
  {
    id: 2,
    title: "Python Programming Lecture",
    mode: "lecture",
    date: "2026-09-28",
    description: "Notes generated from a recorded Python lecture.",
  },
  {
    id: 3,
    title: "Data Analytics Fundamentals",
    mode: "study",
    date: "2026-09-25",
    description: "Study notes covering data analytics basics.",
  },
];

export default function History() {
  const [history, setHistory] = useState(initialHistory);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredHistory = useMemo(() => {
    const query = search.trim().toLowerCase();

    return history.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);

      const matchesFilter = filter === "all" || item.mode === filter;

      return matchesSearch && matchesFilter;
    });
  }, [history, search, filter]);

  const deleteHistoryItem = (id) => {
    setHistory((current) => current.filter((item) => item.id !== id));
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
              <p>Find and revisit your previously generated notes.</p>
            </div>

            <Link to="/mode-selection" className="history-create-btn">
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

            <div className="history-filters" aria-label="Filter history">
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

            {filteredHistory.length > 0 ? (
              <div className="history-list">
                {filteredHistory.map((item) => (
                  <article className="history-card" key={item.id}>
                    <div className="history-card-icon">
                      {item.mode === "lecture" ? (
                        <FileAudio size={23} />
                      ) : (
                        <BookOpen size={23} />
                      )}
                    </div>

                    <div className="history-card-content">
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>

                      <div className="history-card-meta">
                        <span className="history-mode">
                          {item.mode === "lecture"
                            ? "Lecture Notes"
                            : "Study Mode"}
                        </span>
                        <span className="history-date">
                          <Clock3 size={14} />
                          {new Date(`${item.date}T00:00:00`).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="history-card-actions">
                      <Link
                        to="/notes"
                        state={
                          item.mode === "study"
                            ? { mode: "study", topic: item.title }
                            : {
                                mode: "lecture",
                                fileName: item.title,
                              }
                        }
                        className="history-view-btn"
                      >
                        View Notes
                      </Link>

                      <button
                        type="button"
                        className="history-delete-btn"
                        onClick={() => deleteHistoryItem(item.id)}
                        aria-label={`Remove ${item.title} from history`}
                        title="Remove from history"
                      >
                        <Trash2 size={18} />
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
                  Try a different search or filter, or create some new notes.
                </p>
                <Link to="/mode-selection" className="history-create-btn">
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
