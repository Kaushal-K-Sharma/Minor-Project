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
} from "lucide-react";
import Navbar from "../components/Navbar";
import "./GeneratedNotes.css";

const demoNotes = {
  summary:
    "Machine Learning is a branch of Artificial Intelligence that enables computers to learn patterns from data and make predictions or decisions without being explicitly programmed for every task.",
  keyPoints: [
    "Machine Learning is a subset of Artificial Intelligence.",
    "It uses data to identify patterns and make predictions.",
    "Supervised learning uses labelled training data.",
    "Unsupervised learning identifies patterns in unlabelled data.",
    "Reinforcement learning learns through rewards and penalties.",
  ],
  sections: [
    {
      heading: "1. Introduction to Machine Learning",
      content:
        "Machine Learning (ML) is a field of AI in which computer systems learn from data. Instead of following only fixed instructions, these systems use patterns in data to make predictions or decisions.",
    },
    {
      heading: "2. Types of Machine Learning",
      content: "There are three commonly studied types of Machine Learning:",
      bullets: [
        "Supervised Learning: The model learns from labelled data. Examples include classification and regression.",
        "Unsupervised Learning: The model discovers patterns in unlabelled data. Clustering is a common example.",
        "Reinforcement Learning: The model learns by interacting with an environment and receiving rewards or penalties.",
      ],
    },
    {
      heading: "3. Applications of Machine Learning",
      content:
        "Machine Learning is used in recommendation systems, fraud detection, image recognition, speech recognition and medical image analysis.",
    },
  ],
};

export default function GeneratedNotes() {
  const location = useLocation();
  const data = location.state || {};

  const [copied, setCopied] = useState(false);

  const topic =
    data.topic ||
    (data.mode === "lecture"
      ? data.fileName || "Lecture Notes"
      : "Machine Learning");

  const isLecture = data.mode === "lecture" || Boolean(data.fileName);

  const notesText = [
    topic,
    "",
    "SUMMARY",
    demoNotes.summary,
    "",
    "KEY POINTS",
    ...demoNotes.keyPoints.map((point) => `• ${point}`),
    "",
    ...demoNotes.sections.flatMap((section) => [
      section.heading,
      section.content,
      ...(section.bullets || []).map((bullet) => `• ${bullet}`),
      "",
    ]),
  ].join("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(notesText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      alert("Unable to copy notes. Please check clipboard permissions.");
    }
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
              <p>Review your study notes and key concepts.</p>
            </div>
          </header>

          <section className="notes-topic-card">
            <div>
              <span className="notes-label">Topic</span>
              <h2>{topic}</h2>
              <span className="notes-mode">
                {isLecture ? "Lecture Mode" : "Study Mode"}
              </span>
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

          <section className="notes-section">
            <div className="notes-section-heading">
              <Lightbulb size={21} />
              <h2>Summary</h2>
            </div>
            <p className="notes-summary">{demoNotes.summary}</p>
          </section>

          <section className="notes-section">
            <div className="notes-section-heading">
              <ListChecks size={21} />
              <h2>Key Points</h2>
            </div>
            <ul className="notes-key-list">
              {demoNotes.keyPoints.map((point, index) => (
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
              {demoNotes.sections.map((section, index) => (
                <article className="notes-article" key={index}>
                  <h3>{section.heading}</h3>
                  <p>{section.content}</p>

                  {section.bullets && (
                    <ul>
                      {section.bullets.map((bullet, bulletIndex) => (
                        <li key={bulletIndex}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          </section>

          <div className="notes-footer">
            <Link to="/mode-selection" className="notes-new-button">
              Create new notes
            </Link>
          </div>

          <p className="notes-demo-warning">
            Demo content for interface testing. Actual AI-generated notes will
            be available after backend integration.
          </p>
        </div>
      </main>
    </>
  );
}
