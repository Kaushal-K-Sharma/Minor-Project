
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Copy,
  FileText,
  Lightbulb,
  ListChecks,
  Download,
} from "lucide-react";
import Navbar from "../components/Navbar";
import {
  exportNotesPDF,
  exportNotesTXT,
} from "../utils/exportNotes";
import "./GeneratedNotes.css";

function formatTimestamp(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}


function detectImportantPoints(segments = []) {
  const importantPatterns = [
    /\b(very important|extremely important|most important)\b/i,
    /\b(remember this|remember that|keep in mind)\b/i,
    /\b(note that|take note|pay attention)\b/i,
    /\b(key point|key concept|important concept)\b/i,
    /\b(important for the exam|important for exams|exam point)\b/i,
    /\b(must know|must remember|do not forget)\b/i,
    /\b(frequently asked|commonly asked|exam question)\b/i,
    /\b(focus on this|understand this carefully)\b/i,
  ];

  const promotionalPatterns = [
    /\b(like and subscribe|subscribe and like)\b/i,
    /\b(subscribe to (my|our|the) channel)\b/i,
    /\b(like this video|share this video)\b/i,
    /\b(follow (me|us|the channel))\b/i,
    /\b(subscribe for more)\b/i,
    /\b(comment below|hit the bell icon)\b/i,
  ];

  return segments.filter((segment) => {
    const text = segment.text || "";

    // Ignore promotional and channel-related statements.
    if (promotionalPatterns.some((pattern) => pattern.test(text))) {
      return false;
    }

    // Highlight only statements containing meaningful emphasis phrases.
    return importantPatterns.some((pattern) => pattern.test(text));
  });
}


export default function GeneratedNotes() {

  
  const location = useLocation();

  const data = location.state;
  const notes = data?.notes;

  const [copied, setCopied] = useState(false);

  if (!notes) {
    return (
      <>
        <Navbar />
        <main className="notes-page">
          <div className="notes-container">
            <h2>No generated notes found.</h2>
            <p>Please generate notes using Study Mode or Lecture Mode.</p>
            <Link to="/mode-selection">Create notes</Link>
          </div>
        </main>
      </>
    );
  }

  const topic = data.topic || notes.title || "Generated Notes";
  const isLecture = data.mode === "lecture";

  const transcriptSegments = data.segments || [];

  const importantPoints = isLecture
    ? detectImportantPoints(transcriptSegments)
    : [];

  const metadata = {
    topic,
    mode: data.mode,
    level: data.level,
    fileName: data.fileName,
  };

  const notesText = [
    notes.title || topic,
    "",
    "SUMMARY",
    notes.summary || "",
    "",
    "KEY POINTS",
    ...(notes.keyPoints || []).map((point) => `• ${point}`),
    "",
    "DETAILED NOTES",
    ...(notes.sections || []).flatMap((section) => [
      section.heading || "",
      section.content || "",
      ...(section.bullets || []).map((bullet) => `• ${bullet}`),
      ...(section.examples || []).map((example) => `Example: ${example}`),
      "",
    ]),
    "KEYWORDS",
    (notes.keywords || []).join(", "),
    "",
    "QUICK REVISION",
    ...(Array.isArray(notes.revision)
      ? notes.revision.map((point) => `• ${point}`)
      : [notes.revision || ""]),
    "",
    "SELF-ASSESSMENT",
    ...(notes.questions || []).flatMap((item) => [
      `Q: ${item.question}`,
      `A: ${item.answer}`,
      "",
    ]),
  ].join("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(notesText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Unable to copy notes.");
    }
  };

  const handlePDF = () => {
    exportNotesPDF(notes, metadata);
  };

  const handleTXT = () => {
    exportNotesTXT(notes, metadata);
  };

  return (
    <>
      <Navbar />

      <main className="notes-page">
        <div className="notes-container">
          <Link to="/mode-selection" className="notes-back">
            <ArrowLeft size={18} />
            Back to mode selection
          </Link>

          <header className="notes-header">
            <div className="notes-title-icon">
              <BookOpen size={28} />
            </div>
            <div>
              <h1>Generated Notes</h1>
              <p>Your AI-generated study material.</p>
            </div>
          </header>

          <section className="notes-topic-card">
            <div>
              <span className="notes-label">Topic</span>
              <h2>{topic}</h2>
              <span className="notes-mode">
                {isLecture ? "Lecture Mode" : "Study Mode"}
              </span>
              {data.level && <p>Level: {data.level}</p>}
            </div>

            <button
              type="button"
              className="notes-copy-button"
              onClick={handleCopy}
            >
              {copied ? <Check size={17} /> : <Copy size={17} />}
              {copied ? "Copied" : "Copy notes"}
            </button>
          </section>

          {/* Export buttons */}
          <div className="notes-export-buttons">
            <button type="button" onClick={handlePDF}>
              <Download size={17} />
              Download PDF
            </button>

            <button type="button" onClick={handleTXT}>
              <FileText size={17} />
              Download TXT
            </button>
          </div>

          <section className="notes-section">
            <div className="notes-section-heading">
              <Lightbulb size={21} />
              <h2>Summary</h2>
            </div>
            <p className="notes-summary">{notes.summary}</p>
          </section>

          <section className="notes-section">
            <div className="notes-section-heading">
              <ListChecks size={21} />
              <h2>Key Points</h2>
            </div>
            <ul className="notes-key-list">
              {(notes.keyPoints || []).map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </section>

          <section className="notes-section">
            <div className="notes-section-heading">
              <FileText size={21} />
              <h2>Detailed Notes</h2>
            </div>

            <div className="notes-content">
              {(notes.sections || []).map((section, index) => (
                <article className="notes-article" key={index}>
                  <h3>{section.heading}</h3>
                  <p>{section.content}</p>

                  {section.bullets?.length > 0 && (
                    <ul>
                      {section.bullets.map((bullet, i) => (
                        <li key={i}>{bullet}</li>
                      ))}
                    </ul>
                  )}

                  {section.examples?.length > 0 && (
                    <>
                      <h4>Examples</h4>
                      <ul>
                        {section.examples.map((example, i) => (
                          <li key={i}>{example}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </article>
              ))}
            </div>
          </section>

          <section className="notes-section">
            <div className="notes-section-heading">
              <Lightbulb size={21} />
              <h2>Important Keywords</h2>
            </div>
            <ul className="notes-key-list">
              {(notes.keywords || []).map((word, index) => (
                <li key={index}>{word}</li>
              ))}
            </ul>
          </section>

          <section className="notes-section">
            <div className="notes-section-heading">
              <ListChecks size={21} />
              <h2>Quick Revision</h2>
            </div>
            <ul className="notes-key-list">
              {(Array.isArray(notes.revision)
                ? notes.revision
                : notes.revision
                  ? [notes.revision]
                  : []
              ).map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </section>

          <section className="notes-section">
            <div className="notes-section-heading">
              <BookOpen size={21} />
              <h2>Self-Assessment Questions</h2>
            </div>
            <div className="notes-content">
              {(notes.questions || []).map((item, index) => (
                <article className="notes-article" key={index}>
                  <h3>Q{index + 1}. {item.question}</h3>
                  <p><strong>Answer:</strong> {item.answer}</p>
                </article>
              ))}
            </div>
          </section>

          {isLecture && importantPoints.length > 0 && (
            <section className="notes-section important-points-section">
              <h2>⭐ Potentially Important Moments</h2>
              <p className="section-description">
                Statements containing emphasis phrases detected in your lecture.
              </p>

              <div className="important-points-list">
                {importantPoints.map((point, index) => (
                  <div className="important-point" key={index}>
                    <span className="transcript-timestamp">
                      {formatTimestamp(point.start)}
                    </span>
                    <p>{point.text}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {isLecture && transcriptSegments.length > 0 && (
            <section className="notes-section transcript-section">
              <details>
                <summary>
                  <h2>Lecture Transcript</h2>
                  <span>{transcriptSegments.length} segments</span>
                </summary>

                <div className="transcript-list">
                  {transcriptSegments.map((segment, index) => (
                    <div className="transcript-item" key={index}>
                      <span className="transcript-timestamp">
                        {formatTimestamp(segment.start)}
                      </span>
                      <p>{segment.text}</p>
                    </div>
                  ))}
                </div>
              </details>
            </section>
          )}

          <div className="notes-footer">
            <Link to="/mode-selection" className="notes-new-button">
              Create new notes
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
