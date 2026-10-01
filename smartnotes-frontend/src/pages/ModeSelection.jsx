import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  FileAudio,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import Navbar from "../components/Navbar";
import "./ModeSelection.css";

const modes = [
  {
    title: "Lecture Mode",
    description:
      "Turn your recorded lectures into structured notes, summaries and revision material.",
    icon: FileAudio,
    features: [
      "Upload audio or video lectures",
      "Generate lecture-based notes",
      "Organize important concepts",
    ],
    buttonText: "Upload Lecture",
    path: "/lecture-upload",
    theme: "lecture",
  },
  {
    title: "Study Mode",
    description:
      "Enter a subject or topic and generate organized study notes at your preferred level.",
    icon: GraduationCap,
    features: [
      "Enter a topic or subtopic",
      "Choose your learning level",
      "Generate topic-based notes",
    ],
    buttonText: "Start Studying",
    path: "/study-mode",
    theme: "study",
  },
];

export default function ModeSelection() {
  return (
    <>
      <Navbar />

      <main className="mode-page">
        <div className="container mode-container">
          <Link to="/" className="mode-back">
            <ArrowLeft size={17} />
            Back to Home
          </Link>

          <div className="mode-heading">
            <span className="mode-eyebrow">
              <Sparkles size={15} />
              SMARTNOTES AI
            </span>

            <h1>How would you like to study?</h1>

            <p>
              Choose a mode to get started. Generate notes from your lectures or
              explore a topic of your choice.
            </p>
          </div>

          <div className="mode-grid">
            {modes.map((mode) => {
              const Icon = mode.icon;

              return (
                <article className={`mode-card ${mode.theme}`} key={mode.title}>
                  <div className="mode-card-top">
                    <div className="mode-icon">
                      <Icon size={30} />
                    </div>

                    <span className="mode-tag">
                      {mode.theme === "lecture"
                        ? "LECTURE-BASED"
                        : "TOPIC-BASED"}
                    </span>
                  </div>

                  <h2>{mode.title}</h2>
                  <p className="mode-description">{mode.description}</p>

                  <div className="mode-features">
                    {mode.features.map((feature) => (
                      <div className="mode-feature" key={feature}>
                        <span className="mode-check">✓</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Link to={mode.path} className="btn mode-button">
                    {mode.buttonText}
                    <ArrowRight size={18} />
                  </Link>
                </article>
              );
            })}
          </div>

          <div className="mode-tip">
            <BookOpen size={19} />
            <p>
              Not sure where to start? Choose Study Mode if you already know the
              topic you want to learn.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
