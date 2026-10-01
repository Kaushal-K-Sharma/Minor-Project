import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileAudio,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import Navbar from "../components/Navbar";
import "./Processing.css";

export default function Processing() {
  const location = useLocation();
  const navigate = useNavigate();

  const data = location.state;
  const [progress, setProgress] = useState(0);

  const isStudyMode = data?.mode === "study";
  const isLectureMode = data?.mode === "lecture" && Boolean(data?.fileName);

  useEffect(() => {
    if (!isStudyMode && !isLectureMode) {
      navigate("/mode-selection", { replace: true });
      return;
    }

    // Simulated progress for frontend demonstration only.
    const interval = setInterval(() => {
      setProgress((current) => {
        if (current >= 90) {
          clearInterval(interval);
          return 90;
        }

        return Math.min(current + 2, 90);
      });
    }, 300);

    return () => clearInterval(interval);
  }, [isStudyMode, isLectureMode, navigate]);

  const formatFileSize = (bytes) => {
    if (typeof bytes !== "number" || !Number.isFinite(bytes)) {
      return "Unknown size";
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleViewNotes = () => {
    navigate("/notes", {
      state: data,
    });
  };

  const handleGoBack = () => {
    navigate(isStudyMode ? "/study-mode" : "/lecture-upload");
  };

  return (
    <>
      <Navbar />

      <main className="processing-page">
        <div className="processing-container">
          <Link
            to={isStudyMode ? "/study-mode" : "/lecture-upload"}
            className="processing-back"
          >
            <ArrowLeft size={18} />
            Back
          </Link>

          <section className="processing-card">
            <div className="processing-icon">
              <Sparkles size={32} />
            </div>

            <h1>Preparing Your Notes</h1>

            <p className="processing-subtitle">
              Your information is ready. We're preparing the next step.
            </p>

            <div className="processing-loader">
              <LoaderCircle size={36} />
            </div>

            <div className="processing-status">
              <span>Demo processing</span>
              <strong>{progress}%</strong>
            </div>

            <div
              className="processing-progress-track"
              role="progressbar"
              aria-label="Demo processing progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <div
                className="processing-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="processing-hint">
              This is a demonstration progress indicator. Actual AI processing
              will be connected to the Flask backend.
            </p>

            <div className="processing-details">
              <h2>Selected information</h2>

              {isStudyMode && (
                <>
                  <div className="processing-detail-row">
                    <BookOpen size={19} />
                    <div>
                      <span>Mode</span>
                      <strong>Study Mode</strong>
                    </div>
                  </div>

                  <div className="processing-detail-row">
                    <Sparkles size={19} />
                    <div>
                      <span>Topic</span>
                      <strong>{data.topic}</strong>
                    </div>
                  </div>

                  {data.subtopic && (
                    <div className="processing-detail-row">
                      <BookOpen size={19} />
                      <div>
                        <span>Subtopic</span>
                        <strong>{data.subtopic}</strong>
                      </div>
                    </div>
                  )}

                  <div className="processing-detail-row">
                    <CheckCircle2 size={19} />
                    <div>
                      <span>Learning level</span>
                      <strong>
                        {data.level
                          ? data.level.charAt(0).toUpperCase() +
                            data.level.slice(1)
                          : "Not specified"}
                      </strong>
                    </div>
                  </div>
                </>
              )}

              {isLectureMode && (
                <>
                  <div className="processing-detail-row">
                    <FileAudio size={19} />
                    <div>
                      <span>Mode</span>
                      <strong>Lecture Mode</strong>
                    </div>
                  </div>

                  <div className="processing-detail-row">
                    <FileAudio size={19} />
                    <div>
                      <span>File name</span>
                      <strong className="processing-file-name">
                        {data.fileName}
                      </strong>
                    </div>
                  </div>

                  <div className="processing-detail-row">
                    <BookOpen size={19} />
                    <div>
                      <span>File size</span>
                      <strong>{formatFileSize(data.fileSize)}</strong>
                    </div>
                  </div>

                  {data.fileType && (
                    <div className="processing-detail-row">
                      <FileAudio size={19} />
                      <div>
                        <span>File type</span>
                        <strong>{data.fileType.toUpperCase()}</strong>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {progress >= 90 && (
              <button
                type="button"
                className="processing-view-notes"
                onClick={handleViewNotes}
              >
                View demo notes →
              </button>
            )}

            <button
              type="button"
              className="processing-cancel"
              onClick={handleGoBack}
            >
              Go back and edit
            </button>
          </section>
        </div>
      </main>
    </>
  );
}
