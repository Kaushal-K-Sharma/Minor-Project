import {
  ArrowRight,
  BookOpen,
  Brain,
  FileText,
  GraduationCap,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./Home.css";

const features = [
  {
    icon: FileText,
    title: "Smart Notes",
    description:
      "Convert learning material into structured notes that are easier to read and understand.",
  },
  {
    icon: Brain,
    title: "AI-Powered Summaries",
    description:
      "Create concise summaries from lectures and study topics to help you focus on key concepts.",
  },
  {
    icon: GraduationCap,
    title: "Exam Preparation",
    description:
      "Organize important concepts, formulas and revision material for exam preparation.",
  },
  {
    icon: Zap,
    title: "Quick Revision",
    description:
      "Review essential information using concise notes and organized study material.",
  },
];

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload or Enter a Topic",
    description: "Upload a lecture file or enter a topic you want to study.",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "Generate Smart Notes",
    description: "Choose your study preferences and generate organized notes.",
  },
  {
    number: "03",
    icon: BookOpen,
    title: "Review and Learn",
    description:
      "Read your generated notes and prepare your revision material.",
  },
];

export default function Home() {
  return (
    <>
      <Navbar />

      <main>
        <section className="hero" id="home">
          <div className="container hero-container">
            <div className="hero-content">
              <span className="hero-badge">
                <Sparkles size={15} />
                Your AI-powered study companion
              </span>

              <h1>
                Turn Lectures into <span>Smart Notes</span>
              </h1>

              <p className="hero-description">
                Transform lectures and study topics into structured,
                easy-to-understand notes. Spend less time organizing information
                and more time learning.
              </p>

              <div className="hero-actions">
                <Link to="/mode-selection" className="btn btn-primary">
                  Get Started
                  <ArrowRight size={18} />
                </Link>

                <a href="#features" className="btn btn-secondary">
                  Explore Features
                </a>
              </div>

              <div className="hero-note">
                <BookOpen size={17} />
                <span>One place for your study notes</span>
              </div>
            </div>

            <div className="hero-visual" aria-hidden="true">
              <div className="visual-glow"></div>

              <div className="preview-card">
                <div className="preview-header">
                  <div className="preview-title">
                    <span className="preview-icon">
                      <FileText size={19} />
                    </span>
                    <div>
                      <strong>Generated Notes</strong>
                      <small>Machine Learning</small>
                    </div>
                  </div>
                  <span className="preview-status">Ready</span>
                </div>

                <div className="preview-body">
                  <div className="preview-label">QUICK SUMMARY</div>
                  <div className="preview-line long"></div>
                  <div className="preview-line medium"></div>
                  <div className="preview-line short"></div>

                  <div className="preview-section">
                    <strong>Key Concepts</strong>
                    <div className="concept-row">
                      <span className="concept-dot blue-dot"></span>
                      <span>Supervised Learning</span>
                    </div>
                    <div className="concept-row">
                      <span className="concept-dot green-dot"></span>
                      <span>Model Training</span>
                    </div>
                    <div className="concept-row">
                      <span className="concept-dot purple-dot"></span>
                      <span>Prediction</span>
                    </div>
                  </div>

                  <div className="preview-footer">
                    <span>Revision material</span>
                    <span className="preview-footer-badge">
                      <Sparkles size={13} />
                      AI Notes
                    </span>
                  </div>
                </div>
              </div>

              <div className="floating-chip chip-top">
                <Brain size={17} />
                <span>AI Summaries</span>
              </div>

              <div className="floating-chip chip-bottom">
                <BookOpen size={17} />
                <span>Easy Revision</span>
              </div>
            </div>
          </div>
        </section>

        <section className="features-section" id="features">
          <div className="container">
            <div className="section-heading">
              <span className="section-eyebrow">FEATURES</span>
              <h2>Everything you need to study smarter</h2>
              <p>
                Organize your learning with tools designed to simplify your
                study workflow.
              </p>
            </div>

            <div className="features-grid">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <article className="feature-card" key={feature.title}>
                    <div className="feature-icon">
                      <Icon size={24} />
                    </div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="how-section" id="how-it-works">
          <div className="container">
            <div className="section-heading">
              <span className="section-eyebrow">HOW IT WORKS</span>
              <h2>Three simple steps to get started</h2>
              <p>
                Go from your learning material to organized study notes in a
                simple workflow.
              </p>
            </div>

            <div className="steps-grid">
              {steps.map((step) => {
                const Icon = step.icon;

                return (
                  <article className="step-card" key={step.number}>
                    <div className="step-top">
                      <div className="step-icon">
                        <Icon size={24} />
                      </div>
                      <span className="step-number">{step.number}</span>
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="container">
            <div className="cta-card">
              <div>
                <span className="cta-eyebrow">SMARTNOTES AI</span>
                <h2>Ready to organize your learning?</h2>
                <p>
                  Start with a lecture or enter a study topic to explore
                  SmartNotes AI.
                </p>
              </div>
              <Link to="/mode-selection" className="btn cta-button">
                Start Now
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-content">
          <Link to="/" className="footer-brand">
            <BookOpen size={19} />
            SmartNotes AI
          </Link>
          <span>AI-powered study assistance</span>
        </div>
      </footer>
    </>
  );
}
