import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CloudUpload,
  FileAudio,
  FileVideo,
  FileX,
  Info,
} from "lucide-react";
import Navbar from "../components/Navbar";
import "./LectureUpload.css";

const MAX_FILE_SIZE = 500 * 1024 * 1024;

const ACCEPTED_TYPES = {
  "audio/mpeg": "audio",
  "audio/mp3": "audio",
  "audio/wav": "audio",
  "audio/x-wav": "audio",
  "audio/wave": "audio",
  "video/mp4": "video",
  "video/quicktime": "video",
};

const ACCEPTED_EXTENSIONS = [".mp3", ".wav", ".mp4", ".mov"];

function getFileType(file) {
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];

  if (extension === ".mp3" || extension === ".wav") {
    return "audio";
  }

  if (extension === ".mp4" || extension === ".mov") {
    return "video";
  }

  return null;
}

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function LectureUpload() {
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (selectedFile) => {
    if (!selectedFile) {
      return "Please select a file.";
    }

    const type = getFileType(selectedFile);

    if (!type) {
      return "Unsupported file. Please select MP3, WAV, MP4 or MOV.";
    }

    if (selectedFile.type && ACCEPTED_TYPES[selectedFile.type] !== type) {
      return "The selected file type does not match its extension.";
    }

    if (selectedFile.size === 0) {
      return "The selected file is empty.";
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      return "File size must not exceed 500 MB.";
    }

    return "";
  };

  const handleFile = (selectedFile) => {
    const validationError = validateFile(selectedFile);

    if (validationError) {
      setFile(null);
      setError(validationError);
      return;
    }

    setFile(selectedFile);
    setError("");
  };

  const handleInputChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      handleFile(selectedFile);
    }

    // Allows selecting the same file again.
    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(event.dataTransfer.files);

    if (droppedFiles.length !== 1) {
      setFile(null);
      setError("Please drop exactly one file.");
      return;
    }

    handleFile(droppedFiles[0]);
  };

  const removeFile = () => {
    setFile(null);
    setError("");
  };

const continueToProcessing = () => {
  if (!file || error) {
    return;
  }

  navigate("/processing", {
    state: {
      mode: "lecture",
      file: file,
      fileName: file.name,
      fileSize: file.size,
      fileType: getFileType(file),
    },
  });
};

  const fileType = file ? getFileType(file) : null;
  const FileIcon = fileType === "video" ? FileVideo : FileAudio;

  return (
    <>
      <Navbar />

      <main className="upload-page">
        <div className="container upload-container">
          <Link to="/mode-selection" className="upload-back">
            <ArrowLeft size={17} />
            Back to Modes
          </Link>

          <div className="upload-heading">
            <span className="upload-eyebrow">LECTURE MODE</span>
            <h1>Upload Your Lecture</h1>
            <p>Upload an audio or video lecture to prepare your study notes.</p>
          </div>

          <section className="upload-card">
            <div
              className={`drop-zone ${isDragging ? "dragging" : ""}`}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();

                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setIsDragging(false);
                }
              }}
              onDrop={handleDrop}
            >
              <input
                ref={inputRef}
                className="file-input"
                type="file"
                accept={ACCEPTED_EXTENSIONS.join(",")}
                onChange={handleInputChange}
                aria-label="Choose a lecture file"
              />

              <div className="upload-cloud-icon">
                <CloudUpload size={34} />
              </div>

              <h2>Drag & drop your lecture here</h2>
              <p>or select a file from your computer</p>

              <button
                type="button"
                className="btn btn-primary choose-file-btn"
                onClick={() => inputRef.current?.click()}
              >
                Browse Files
              </button>

              <span className="upload-formats">
                Supported: MP3, WAV, MP4, MOV
              </span>
              <span className="upload-formats">Maximum file size: 500 MB</span>
            </div>

            {error && (
              <div className="upload-error" role="alert">
                <Info size={18} />
                <span>{error}</span>
              </div>
            )}

            {file && (
              <div className="selected-file">
                <div className="selected-file-icon">
                  <FileIcon size={23} />
                </div>

                <div className="selected-file-info">
                  <strong title={file.name}>{file.name}</strong>
                  <span>{formatFileSize(file.size)}</span>
                </div>

                <span className="file-valid">
                  <CheckCircle2 size={16} />
                  Ready
                </span>

                <button
                  type="button"
                  className="remove-file"
                  aria-label="Remove selected file"
                  onClick={removeFile}
                >
                  <FileX size={19} />
                </button>
              </div>
            )}

            <div className="upload-actions">
              <Link to="/mode-selection" className="btn btn-secondary">
                Cancel
              </Link>

              <button
                type="button"
                className="btn btn-primary"
                disabled={!file || Boolean(error)}
                onClick={continueToProcessing}
              >
                Continue
                <ArrowRight size={18} />
              </button>
            </div>
          </section>

          <div className="upload-info">
            <Info size={19} />
            <p>
              <p>
                Your uploaded lecture will be processed using speech recognition
                and AI to generate structured study notes.
              </p>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
