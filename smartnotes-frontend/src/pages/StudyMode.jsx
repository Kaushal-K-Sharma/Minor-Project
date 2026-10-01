import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Lightbulb,
  Rocket,
} from "lucide-react";
import Navbar from "../components/Navbar";
import "./StudyMode.css";

const levels = [
  {
    value: "beginner",
    title: "Beginner",
    description: "Simple explanations with basic examples.",
    icon: Lightbulb,
  },
  {
    value: "intermediate",
    title: "Intermediate",
    description: "Detailed explanations with practical examples.",
    icon: BookOpen,
  },
  {
    value: "advanced",
    title: "Advanced",
    description: "In-depth explanations of complex concepts.",
    icon: Rocket,
  },
];

export default function StudyMode() {
  const navigate = useNavigate();

  const [topic, setTopic] = useState("");
  const [subtopic, setSubtopic] = useState("");
  const [level, setLevel] = useState("beginner");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    const cleanTopic = topic.trim();
    const cleanSubtopic = subtopic.trim();

    if (!cleanTopic) {
      setError("Please enter a topic to continue.");
      return;
    }

    setError("");

    navigate("/processing", {
      state: {
        mode: "study",
        topic: cleanTopic,
        subtopic: cleanSubtopic,
        level,
      },
    });
  };

  return (
    <>
      <Navbar />

      <main className="study-page">
        <div className="study-container">
          <Link to="/mode-selection" className="study-back">
            <ArrowLeft size={18} />
            <span>Back to mode selection</span>
          </Link>

          <div className="study-heading">
            <div className="study-heading-icon">
              <GraduationCap size={30} />
            </div>

            <h1>Study Mode</h1>
            <p>Choose a topic and customize how you want to learn.</p>
          </div>

          <form className="study-card" onSubmit={handleSubmit}>
            <div className="study-form-group">
              <label htmlFor="study-topic">
                Topic <span className="required">*</span>
              </label>
              <input
                id="study-topic"
                type="text"
                placeholder="e.g., Machine Learning"
                value={topic}
                onChange={(event) => {
                  setTopic(event.target.value);
                  if (error) setError("");
                }}
                maxLength={150}
                required
              />
              <small>Enter the subject you want to study.</small>
            </div>

            <div className="study-form-group">
              <label htmlFor="study-subtopic">
                Subtopic <span className="optional">(Optional)</span>
              </label>
              <input
                id="study-subtopic"
                type="text"
                placeholder="e.g., Linear Regression"
                value={subtopic}
                onChange={(event) => setSubtopic(event.target.value)}
                maxLength={150}
              />
              <small>
                Specify a particular concept if you have one in mind.
              </small>
            </div>

            <div className="study-form-group">
              <label>
                Learning level <span className="required">*</span>
              </label>
              <p className="study-level-hint">
                Select the level that suits your understanding.
              </p>

              <div className="study-levels">
                {levels.map((item) => {
                  const Icon = item.icon;
                  const selected = level === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      className={`study-level ${selected ? "selected" : ""}`}
                      onClick={() => setLevel(item.value)}
                      aria-pressed={selected}
                    >
                      <span className="study-level-icon">
                        <Icon size={22} />
                      </span>
                      <span className="study-level-text">
                        <strong>{item.title}</strong>
                        <small>{item.description}</small>
                      </span>
                      <span className="study-radio">
                        {selected && <span />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <p className="study-error" role="alert">
                {error}
              </p>
            )}

            <button className="study-submit" type="submit">
              Continue
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <p className="study-note">
            You can review your selections before generating your notes.
          </p>
        </div>
      </main>
    </>
  );
}
