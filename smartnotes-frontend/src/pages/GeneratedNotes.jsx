
import { useEffect, useId, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import mermaid from "mermaid";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Copy,
  FileText,
  Lightbulb,
  ListChecks,
  Download,
  Award,
  Brain,
  Network,
  Sparkles,
  GraduationCap,
  BookMarked,
  Target,
} from "lucide-react";
import Navbar from "../components/Navbar";
import {
  exportNotesPDF,
  exportNotesTXT,
} from "../utils/exportNotes";
import "./GeneratedNotes.css";

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "strict",
});

function formatTimestamp(seconds = 0) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function detectImportantPoints(segments = []) {
  const patterns = [
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
    if (promotionalPatterns.some((pattern) => pattern.test(text))) {
      return false;
    }
    return patterns.some((pattern) => pattern.test(text));
  });
}

function calculateReadiness(notes) {
  const checks = [
    Boolean(notes.summary?.trim()),
    (notes.keyPoints || []).length >= 4,
    (notes.sections || []).length >= 3,
    (notes.sections || []).some((s) => s.definition?.trim()),
    (notes.sections || []).some((s) => s.examples?.length),
    (notes.sections || []).some((s) => s.bullets?.length),
    (notes.conceptExamples || []).length >= 2,
    (notes.keywords || []).length >= 5,
    (notes.revision || []).length >= 4,
    (notes.questions || []).length >= 3,
  ];

  return Math.round(
    (checks.filter(Boolean).length / checks.length) * 100
  );
}

function MermaidDiagram({ diagram }) {
  const rawId = useId();
  const elementId = `mermaid-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const [svg, setSvg] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    async function renderDiagram() {
      if (!diagram?.mermaid) return;

      try {
        const result = await mermaid.render(
          elementId,
          diagram.mermaid
        );

        if (active) {
          setSvg(result.svg);
          setError(false);
        }
      } catch (err) {
        console.error("Diagram rendering failed:", err);
        if (active) setError(true);
      }
    }

    renderDiagram();

    return () => {
      active = false;
    };
  }, [diagram, elementId]);

  return (
    <div className="notes-diagram">
      <h4>{diagram.title || "Concept Diagram"}</h4>

      {svg ? (
        <div
          className="notes-diagram-svg"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : error ? (
        <p className="diagram-error">
          This diagram could not be rendered. The remaining notes are
          still available.
        </p>
      ) : (
        <p className="diagram-loading">Preparing diagram...</p>
      )}

      {diagram.caption && (
        <p className="diagram-caption">{diagram.caption}</p>
      )}
    </div>
  );
}

function DetailList({ title, items }) {
  if (!items?.length) return null;

  return (
    <div className="notes-detail-group">
      <h4>{title}</h4>
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function ComparisonTable({ comparison }) {
  if (!comparison?.columns?.length || !comparison?.rows?.length) {
    return null;
  }

  return (
    <div className="notes-comparison">
      <h4>{comparison.title || "Comparison"}</h4>
      <div className="comparison-scroll">
        <table>
          <thead>
            <tr>
              {comparison.columns.map((column, index) => (
                <th key={index}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparison.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionHeading({ children }) {
  return <h4 className="guided-subheading">{children}</h4>;
}

function GuidedSection({ section, index }) {
  return (
    <article className="guided-article" key={index}>
      <div className="guided-article-heading">
        <span className="guided-section-number">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h3>{section.heading || `Topic ${index + 1}`}</h3>
      </div>

      {section.purpose && (
        <p className="guided-purpose">{section.purpose}</p>
      )}

      {section.definition && (
        <div className="guided-definition">
          <strong>Formal definition</strong>
          <p>{section.definition}</p>
        </div>
      )}

      {section.content && (
        <div className="guided-prose">
          {section.content.split(/\n+/).filter(Boolean).map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      )}

      {section.analogy && (
        <div className="guided-analogy">
          <strong><Lightbulb size={16} /> Think of it this way</strong>
          <p>{section.analogy}</p>
        </div>
      )}

      {section.workedExample && (
        <div className="guided-worked-example">
          <strong>Worked example</strong>
          <p>{section.workedExample}</p>
        </div>
      )}

      <DetailList title="Formal details and notation" items={section.formalDetails} />
      <DetailList title="Important characteristics" items={section.bullets} />
      <DetailList title="Types and classification" items={section.types} />
      <DetailList title="How it works" items={section.working} />
      <DetailList title="Examples" items={section.examples} />
      <DetailList title="Formulas" items={section.formula} />
      <DetailList title="Applications" items={section.applications} />

      <ComparisonTable comparison={section.comparison} />

      <DetailList title="Advantages" items={section.advantages} />
      <DetailList title="Limitations" items={section.disadvantages} />

      {section.takeaway && (
        <div className="guided-takeaway">
          <strong>Key takeaway</strong>
          <p>{section.takeaway}</p>
        </div>
      )}
    </article>
  );
}

function Glossary({ items }) {
  if (!items?.length) return null;

  return (
    <section className="notes-section guided-glossary">
      <div className="notes-section-heading">
        <BookMarked size={21} />
        <h2>Important Terminology</h2>
      </div>

      <div className="glossary-list">
        {items.map((item, index) => (
          <div className="glossary-item" key={index}>
            <strong>{item.term}</strong>
            <p>{item.meaning}</p>
          </div>
        ))}
      </div>
    </section>
  );
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

  const learningStyle = (
    notes.learningStyle ||
    data.learning_style ||
    (isLecture ? "guided" : "structured")
  ).toLowerCase();

  const isGuided = learningStyle === "guided";

  const transcriptSegments = data.segments || [];
  const importantPoints = isLecture
    ? detectImportantPoints(transcriptSegments)
    : [];

  const readiness = calculateReadiness(notes);

  const metadata = {
    topic,
    mode: data.mode,
    level: data.level,
    learning_style: learningStyle,
    fileName: data.fileName,
  };

  const notesText = [
    notes.title || topic,
    "",
    isGuided ? "GUIDED TEACHING NOTES" : "STRUCTURED NOTES",
    "",
    notes.introduction || "",
    "",
    ...(notes.learningObjectives?.length
      ? [
          "WHAT YOU WILL LEARN",
          ...notes.learningObjectives.map((item) => `- ${item}`),
          "",
        ]
      : []),
    "SUMMARY",
    notes.summary || "",
    "",
    "KEY POINTS",
    ...(notes.keyPoints || []).map((point) => `- ${point}`),
    "",
    "DETAILED NOTES",
    ...(notes.sections || []).flatMap((section, index) => [
      `${index + 1}. ${section.heading || ""}`,
      section.purpose ? `Why it matters: ${section.purpose}` : "",
      section.definition ? `Definition: ${section.definition}` : "",
      section.content || "",
      section.analogy ? `Analogy: ${section.analogy}` : "",
      section.workedExample ? `Worked example: ${section.workedExample}` : "",
      ...(section.formalDetails || []).map((item) => `Formal detail: ${item}`),
      ...(section.bullets || []).map((item) => `- ${item}`),
      ...(section.types || []).map((item) => `Type: ${item}`),
      ...(section.working || []).map((item) => `Step: ${item}`),
      ...(section.examples || []).map((item) => `Example: ${item}`),
      ...(section.formula || []).map((item) => `Formula: ${item}`),
      ...(section.applications || []).map((item) => `Application: ${item}`),
      section.takeaway ? `Key takeaway: ${section.takeaway}` : "",
      "",
    ]),
    ...(notes.recap ? ["TOPIC RECAP", notes.recap, ""] : []),
    ...(notes.glossary?.length
      ? [
          "IMPORTANT TERMINOLOGY",
          ...notes.glossary.map((item) => `${item.term}: ${item.meaning}`),
          "",
        ]
      : []),
    "CONCEPT–EXAMPLE PAIRING",
    ...(notes.conceptExamples || []).flatMap((item) => [
      `Concept: ${item.concept}`,
      item.explanation || "",
      `Example: ${item.example || ""}`,
      item.connection || "",
      "",
    ]),
    "KEYWORDS",
    (notes.keywords || []).join(", "),
    "",
    "QUICK REVISION",
    ...(Array.isArray(notes.revision)
      ? notes.revision
      : [notes.revision || ""]),
    "",
    "SELF-ASSESSMENT",
    ...(notes.questions || []).flatMap((item) => [
      `Q: ${item.question}`,
      `A: ${item.answer}`,
      "",
    ]),
  ].filter((line) => line !== null && line !== undefined).join("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(notesText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Unable to copy notes.");
    }
  };

  const handlePDF = () => exportNotesPDF(notes, metadata);
  const handleTXT = () => exportNotesTXT(notes, metadata);

  return (
    <>
      <Navbar />

      <main className={`notes-page ${isGuided ? "guided-notes-page" : ""}`}>
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
              <h1>{isGuided ? "Guided Teaching Notes" : "Generated Notes"}</h1>
              <p>
                {isGuided
                  ? "Learn the topic through connected, step-by-step explanations."
                  : "Your organized academic study material."}
              </p>
            </div>
          </header>

          <section className="notes-topic-card">
            <div>
              <span className="notes-label">Topic</span>
              <h2>{topic}</h2>
              <span className="notes-mode">
                {isLecture ? "Lecture Mode" : "Study Mode"}
              </span>
              <span className="notes-style-badge">
                {isGuided ? "Guided Explanation" : "Structured Notes"}
              </span>
              {data.level && (
                <p className="notes-level">Learning level: {data.level}</p>
              )}
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

          <section className="notes-readiness">
            <div className="readiness-icon">
              <Award size={25} />
            </div>
            <div className="readiness-content">
              <div className="readiness-heading">
                <h2>Revision Readiness</h2>
                <strong>{readiness}%</strong>
              </div>
              <div className="readiness-track">
                <div
                  className="readiness-fill"
                  style={{ width: `${readiness}%` }}
                />
              </div>
              <p>
                Based on the completeness of your generated study material.
                This is not a measure of your actual exam readiness.
              </p>
            </div>
          </section>

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

          {isGuided ? (
            <>
              {notes.introduction && (
                <section className="guided-introduction">
                  <span className="guided-eyebrow">LET'S UNDERSTAND THE TOPIC</span>
                  <h2>{notes.title || topic}</h2>
                  <p>{notes.introduction}</p>
                </section>
              )}

              {notes.learningObjectives?.length > 0 && (
                <section className="notes-section">
                  <div className="notes-section-heading">
                    <Target size={21} />
                    <h2>What You Will Learn</h2>
                  </div>
                  <ul className="notes-key-list">
                    {notes.learningObjectives.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </section>
              )}

              {notes.summary && (
                <section className="guided-summary">
                  <div className="notes-section-heading">
                    <Lightbulb size={21} />
                    <h2>At a Glance</h2>
                  </div>
                  <p>{notes.summary}</p>
                </section>
              )}

              {notes.sections?.length > 0 && (
                <section className="guided-teaching-section">
                  <div className="guided-main-heading">
                    <GraduationCap size={23} />
                    <div>
                      <h2>Let's Build Your Understanding</h2>
                      <p>
                        Follow the concepts in order. Each section builds
                        on what you have just learned.
                      </p>
                    </div>
                  </div>

                  <div className="guided-articles">
                    {notes.sections.map((section, index) => (
                      <GuidedSection
                        section={section}
                        index={index}
                        key={index}
                      />
                    ))}
                  </div>
                </section>
              )}

              {notes.recap && (
                <section className="guided-recap">
                  <div className="notes-section-heading">
                    <BookOpen size={21} />
                    <h2>Bringing It All Together</h2>
                  </div>
                  <p>{notes.recap}</p>
                </section>
              )}

              <Glossary items={notes.glossary} />
            </>
          ) : (
            <>
              {notes.summary && (
                <section className="notes-section">
                  <div className="notes-section-heading">
                    <Lightbulb size={21} />
                    <h2>Summary</h2>
                  </div>
                  <p className="notes-summary">{notes.summary}</p>
                </section>
              )}

              {notes.keyPoints?.length > 0 && (
                <section className="notes-section">
                  <div className="notes-section-heading">
                    <ListChecks size={21} />
                    <h2>Key Points</h2>
                  </div>
                  <ul className="notes-key-list">
                    {notes.keyPoints.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </section>
              )}

              {notes.sections?.length > 0 && (
                <section className="notes-section">
                  <div className="notes-section-heading">
                    <FileText size={21} />
                    <h2>Detailed Study Notes</h2>
                  </div>

                  <div className="notes-content">
                    {notes.sections.map((section, index) => (
                      <article className="notes-article" key={index}>
                        <h3>{section.heading}</h3>
                        {section.definition && (
                          <div className="notes-definition">
                            <strong>Definition</strong>
                            <p>{section.definition}</p>
                          </div>
                        )}
                        {section.content && <p>{section.content}</p>}
                        <DetailList title="Key Characteristics" items={section.bullets} />
                        <DetailList title="Types / Classification" items={section.types} />
                        <DetailList title="Working / Steps" items={section.working} />
                        <DetailList title="Examples" items={section.examples} />
                        <DetailList title="Advantages" items={section.advantages} />
                        <DetailList title="Disadvantages" items={section.disadvantages} />
                        <DetailList title="Applications" items={section.applications} />
                        <DetailList title="Formulas" items={section.formula} />
                        <ComparisonTable comparison={section.comparison} />
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {notes.keyPoints?.length > 0 && isGuided && (
            <section className="notes-section">
              <div className="notes-section-heading">
                <ListChecks size={21} />
                <h2>Key Ideas to Remember</h2>
              </div>
              <ul className="notes-key-list">
                {notes.keyPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </section>
          )}

          {notes.conceptExamples?.length > 0 && (
            <section className="notes-section">
              <div className="notes-section-heading">
                <Brain size={21} />
                <h2>Concept–Example Pairing</h2>
              </div>
              <p className="section-description">
                Understand important concepts through relevant examples.
              </p>
              <div className="concept-example-grid">
                {notes.conceptExamples.map((item, index) => (
                  <article className="concept-example-card" key={index}>
                    <span className="concept-number">CONCEPT {index + 1}</span>
                    <h3>{item.concept}</h3>
                    <p>{item.explanation}</p>
                    <div className="concept-example">
                      <strong>Example</strong>
                      <p>{item.example}</p>
                    </div>
                    {item.connection && (
                      <p className="concept-connection">
                        <strong>Why it fits:</strong> {item.connection}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {notes.diagrams?.length > 0 && (
            <section className="notes-section">
              <div className="notes-section-heading">
                <Network size={21} />
                <h2>Diagrams and Visual Explanations</h2>
              </div>
              <p className="section-description">
                Visual representations of important concepts and processes.
              </p>
              <div className="notes-diagrams-list">
                {notes.diagrams.map((diagram, index) => (
                  <MermaidDiagram diagram={diagram} key={index} />
                ))}
              </div>
            </section>
          )}

          {notes.keywords?.length > 0 && (
            <section className="notes-section">
              <div className="notes-section-heading">
                <Sparkles size={21} />
                <h2>Important Keywords</h2>
              </div>
              <div className="notes-keyword-list">
                {notes.keywords.map((word, index) => (
                  <span className="notes-keyword" key={index}>{word}</span>
                ))}
              </div>
            </section>
          )}

          {notes.revision?.length > 0 && (
            <section className="notes-section">
              <div className="notes-section-heading">
                <ListChecks size={21} />
                <h2>Quick Revision</h2>
              </div>
              <ul className="notes-key-list">
                {(Array.isArray(notes.revision)
                  ? notes.revision
                  : [notes.revision]
                ).map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </section>
          )}

          {notes.questions?.length > 0 && (
            <section className="notes-section">
              <div className="notes-section-heading">
                <BookOpen size={21} />
                <h2>Self-Assessment Questions</h2>
              </div>
              <div className="notes-content">
                {notes.questions.map((item, index) => (
                  <article className="notes-article" key={index}>
                    <h3>Q{index + 1}. {item.question}</h3>
                    <p><strong>Answer:</strong> {item.answer}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

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
