
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileAudio,
  LoaderCircle,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import Navbar from "../components/Navbar";
import {
  generateStudyNotes,
  uploadLecture,
  retryLectureNotes,
} from "../services/api";
import "./Processing.css";

export default function Processing() {
  const location = useLocation();
  const navigate = useNavigate();

  const data = location.state || {};

  const isStudyMode = data.mode === "study";
  const isLectureMode = data.mode === "lecture" && Boolean(data.file);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Preparing your request...");
  const [retryCount, setRetryCount] = useState(0);
  const [savedJobId, setSavedJobId] = useState(null);

  const requestPromiseRef = useRef(null);

  useEffect(() => {
    if (!isStudyMode && !isLectureMode) {
      navigate("/mode-selection", { replace: true });
      return;
    }

    let cancelled = false;

    const processRequest = async () => {
      setLoading(true);
      setError("");

      try {
        // Reuse the same promise during React StrictMode's
        // second effect execution.
        if (!requestPromiseRef.current) {
          if (isStudyMode) {
            setStatus("Generating your study notes...");

            requestPromiseRef.current = generateStudyNotes({
              topic: data.topic,
              subtopic: data.subtopic,
              level: data.level,
            });
          } else {
            setStatus("Uploading your lecture and extracting audio...");

            requestPromiseRef.current = uploadLecture(data.file);
          }
        }

        const result = await requestPromiseRef.current;

        if (cancelled) return;

        setStatus("Your notes are ready!");

        navigate("/notes", {
          replace: true,
          state: result,
        });

      } catch (err) {
        if (!cancelled) {
          console.error("Processing error:", err);

          // Store the job ID if transcription was saved.
          if (err.transcript_saved && err.job_id) {
            setSavedJobId(err.job_id);
          }

          setError(err.message || "Something went wrong. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    processRequest();

    return () => {
      cancelled = true;
    };

  }, [isStudyMode, isLectureMode, navigate, retryCount]);

  // Retry using the saved transcript. Whisper will NOT run again.
  const handleRetrySavedTranscript = async () => {
    if (!savedJobId || loading) return;

    setLoading(true);
    setError("");
    setStatus("Generating notes from your saved transcript...");

    try {
      const result = await retryLectureNotes(savedJobId);

      navigate("/notes", {
        replace: true,
        state: result,
      });

    } catch (err) {
      console.error("Note generation retry error:", err);

      setError(err.message || "Unable to generate notes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Normal retry for other errors.
  const handleRetry = () => {
    requestPromiseRef.current = null;
    setSavedJobId(null);
    setRetryCount((count) => count + 1);
  };

  const handleGoBack = () => {
    navigate(isStudyMode ? "/study-mode" : "/lecture-upload");
  };

  const formatFileSize = (bytes) => {
    if (typeof bytes !== "number" || !Number.isFinite(bytes)) {
      return "Unknown size";
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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
              {error ? (
                <AlertCircle size={32} />
              ) : (
                <Sparkles size={32} />
              )}
            </div>

            <h1>
              {error
                ? "Processing Failed"
                : loading
                ? "Preparing Your Notes"
                : "Processing Complete"}
            </h1>

            <p className="processing-subtitle">
              {error ? "We couldn't complete your request." : status}
            </p>

            {loading && (
              <div className="processing-loader">
                <LoaderCircle size={36} />
              </div>
            )}

            {error && (
              <div className="processing-error" role="alert">
                {error}
              </div>
            )}

            {savedJobId && error && (
              <div className="processing-saved-message">
                <CheckCircle2 size={19} />
                <span>
                  Your lecture transcript is safely saved.
                  You do not need to upload or transcribe it again.
                </span>
              </div>
            )}

            <div className="processing-status">
              <span>
                {error ? "Error" : loading ? "In progress" : "Complete"}
              </span>
              <strong>
                {error ? "!" : loading ? "..." : "✓"}
              </strong>
            </div>

            <div className="processing-progress-track">
              <div
                className="processing-progress-fill"
                style={{
                  width: error ? "100%" : loading ? "60%" : "100%",
                  opacity: error ? 0.5 : 1,
                }}
              />
            </div>

            <p className="processing-hint">
              {isLectureMode
                ? "Speech recognition and AI note generation may take several minutes depending on your lecture length and computer."
                : "Our AI is preparing your study material. Please wait."}
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
                      <strong>{data.level}</strong>
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
                </>
              )}
            </div>

            {error && (
              <>
                {savedJobId ? (
                  <button
                    type="button"
                    className="processing-view-notes"
                    onClick={handleRetrySavedTranscript}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <LoaderCircle size={18} />
                        Generating Notes...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={18} />
                        Retry Generate Notes
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="processing-view-notes"
                    onClick={handleRetry}
                    disabled={loading}
                  >
                    Try Again
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              className="processing-cancel"
              onClick={handleGoBack}
              disabled={loading}
            >
              Go back and edit
            </button>
          </section>
        </div>
      </main>
    </>
  );
}
