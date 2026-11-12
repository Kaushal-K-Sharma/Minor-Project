
import os
import re
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from werkzeug.utils import secure_filename
from services.transcription import transcribe_file
from services.note_generator import generate_study_notes
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv


# Load environment variables
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

# Create required folders
UPLOAD_DIR = BASE_DIR / "uploads"
NOTES_DIR = BASE_DIR / "generated_notes"

UPLOAD_DIR.mkdir(exist_ok=True)
NOTES_DIR.mkdir(exist_ok=True)

app = Flask(__name__)

# Allow requests from local development and Vercel deployments
CORS(
    app,
    resources={r"/api/*": {"origins": [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://smartnotes-frontend-three.vercel.app",
        "https://smartnotes-frontend-rgek7weiv-smart-notes.vercel.app"
    ]}}
)



# Upload size limit: 500 MB
app.config["MAX_CONTENT_LENGTH"] = 500 * 1024 * 1024

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".mp4", ".mov"}


def handle_generation_error(error, mode, extra_data=None):
    error_message = str(error)
    error_lower = error_message.lower()

    response_data = {}

    if extra_data:
        response_data.update(extra_data)

    if (
        "gemini_daily_quota_exceeded" in error_lower
        or "per day" in error_lower
        or "daily quota" in error_lower
    ):
        response_data["error"] = (
            "Gemini's daily API quota has been exhausted. "
            "Your transcript has been saved. Please try generating "
            "notes again after the quota resets."
        )
        return jsonify(response_data), 429

    if (
        "gemini_rate_limit" in error_lower
        or "resource_exhausted" in error_lower
        or "429" in error_message
    ):
        response_data["error"] = (
            "Gemini API rate limit reached. "
            "Please wait a while and try again."
        )
        return jsonify(response_data), 429

    if "503" in error_message or "unavailable" in error_lower:
        response_data["error"] = (
            "Gemini is temporarily unavailable. "
            "Please try again shortly."
        )
        return jsonify(response_data), 503

    print(f"{mode} generation error:", error_message)

    response_data["error"] = (
        f"{mode} processing failed. Please try again."
    )
    return jsonify(response_data), 500


def save_lecture_data(job_id, data):
    """Save lecture transcript, timestamps and generated notes."""
    file_path = NOTES_DIR / f"{job_id}.json"

    with open(file_path, "w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)

    return file_path

def save_note_data(job_id, data):
    """Save generated notes as a JSON file."""
    file_path = NOTES_DIR / f"{job_id}.json"

    with open(file_path, "w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)

    return file_path


def create_lecture_prompt(transcript):
    transcript_for_ai = transcript[:18000]

    return (
        "Create structured study notes based on this lecture transcript. "
        "Preserve the lecturer's important explanations and examples. "
        "Do not invent information not supported by the transcript.\n\n"
        "LECTURE TRANSCRIPT:\n" + transcript_for_ai
    )


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Smart Notes Generator Backend is running!"
    })


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "success",
        "message": "Backend connected successfully",
        "app": "AI-Powered Smart Notes Generator"
    })


@app.errorhandler(413)
def file_too_large(error):
    return jsonify({
        "error": "File is too large. Maximum allowed size is 500 MB."
    }), 413


@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "error": "Requested API endpoint was not found."
    }), 404


# --------------------------------------------------
# STUDY MODE
# --------------------------------------------------

@app.route("/api/study/generate", methods=["POST"])
def study_generate():
    try:
        data = request.get_json(silent=True) or {}

        topic = str(data.get("topic", "")).strip()
        subtopic = str(data.get("subtopic", "")).strip()
        level = str(data.get("level", "beginner")).lower().strip()

        if not topic:
            return jsonify({"error": "Please provide a topic."}), 400

        if len(topic) > 150 or len(subtopic) > 150:
            return jsonify({
                "error": "Topic and subtopic must be 150 characters or fewer."
            }), 400

        if level not in ["beginner", "intermediate", "advanced"]:
            return jsonify({"error": "Invalid learning level."}), 400

        notes = generate_study_notes(topic, subtopic, level)

        job_id = uuid.uuid4().hex

        note_data = {
            "job_id": job_id,
            "status": "completed",
            "mode": "study",
            "topic": topic,
            "subtopic": subtopic,
            "level": level,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "notes": notes
        }

        save_note_data(job_id, note_data)

        return jsonify({
            "status": "success",
            **note_data
        })

    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    except Exception as error:
        return handle_generation_error(error, "Study")


# --------------------------------------------------
# LECTURE MODE - UPLOAD AND TRANSCRIBE
# --------------------------------------------------

@app.route("/api/lecture/process", methods=["POST"])
def process_lecture():
    file_path = None
    job_id = None
    transcript_saved = False

    try:
        if "file" not in request.files:
            return jsonify({"error": "Please upload a lecture file."}), 400

        uploaded_file = request.files["file"]

        if not uploaded_file.filename:
            return jsonify({"error": "No file selected."}), 400

        original_name = secure_filename(uploaded_file.filename)
        extension = Path(original_name).suffix.lower()

        if extension not in ALLOWED_EXTENSIONS:
            return jsonify({
                "error": "Only MP3, WAV, MP4 and MOV files are supported."
            }), 400

        # Save uploaded file temporarily
        unique_name = f"{uuid.uuid4().hex}{extension}"
        file_path = UPLOAD_DIR / unique_name
        uploaded_file.save(file_path)

        print(f"Lecture received: {original_name}")

        # Step 1: Speech-to-text
        transcription = transcribe_file(file_path)

        transcript = transcription["transcript"]

        # Step 2: Create a unique job ID
        job_id = uuid.uuid4().hex

        # Step 3: Save transcript BEFORE calling Gemini
        lecture_data = {
            "job_id": job_id,
            "status": "transcribed",
            "mode": "lecture",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "topic": Path(original_name).stem,
            "fileName": original_name,
            "duration": transcription["duration"],
            "language": transcription["language"],
            "transcript": transcript,
            "segments": transcription["segments"],
            "notes": None
        }

        save_lecture_data(job_id, lecture_data)
        transcript_saved = True

        print(f"Transcript saved successfully. Job ID: {job_id}")

        # Step 4: Generate notes
        notes = generate_study_notes(
            topic=Path(original_name).stem,
            subtopic=create_lecture_prompt(transcript),
            level="intermediate"
        )

        # Step 5: Save generated notes too
        lecture_data["notes"] = notes
        lecture_data["status"] = "completed"
        save_lecture_data(job_id, lecture_data)

        return jsonify({
            "status": "success",
            "mode": "lecture",
            **lecture_data
        })

    except Exception as error:
        print("Lecture processing error:", str(error))

        # If transcription was saved, preserve its job ID
        if transcript_saved and job_id:
            return handle_generation_error(
                error,
                "Lecture",
                {
                    "job_id": job_id,
                    "transcript_saved": True
                }
            )

        return jsonify({
            "error": (
                "Lecture transcription failed. "
                "Please check the file and try again."
            )
        }), 500

    finally:
        # Remove temporary upload, not the saved transcript
        if file_path and file_path.exists():
            try:
                file_path.unlink()
            except OSError:
                print("Warning: Could not remove temporary uploaded file.")


# --------------------------------------------------
# LECTURE MODE - RETRY NOTE GENERATION
# --------------------------------------------------

@app.route("/api/lecture/retry-notes/<job_id>", methods=["POST"])
def retry_lecture_notes(job_id):

    # Validate ID to prevent unsafe file paths
    if not re.fullmatch(r"[a-f0-9]{32}", job_id):
        return jsonify({"error": "Invalid lecture ID."}), 400

    transcript_file = NOTES_DIR / f"{job_id}.json"

    if not transcript_file.exists():
        return jsonify({
            "error": "Saved lecture transcript was not found."
        }), 404

    try:
        # Load previously saved transcript
        with open(transcript_file, "r", encoding="utf-8") as file:
            lecture_data = json.load(file)

        transcript = lecture_data.get("transcript", "")

        if not transcript:
            return jsonify({
                "error": "The saved lecture transcript is empty."
            }), 400

        print(f"Retrying note generation for job: {job_id}")

        # Generate notes WITHOUT transcribing again
        notes = generate_study_notes(
            topic=lecture_data["topic"],
            subtopic=create_lecture_prompt(transcript),
            level="intermediate"
        )

        # Save generated notes
        lecture_data["notes"] = notes
        lecture_data["status"] = "completed"

        save_lecture_data(job_id, lecture_data)

        return jsonify({
            "status": "success",
            **lecture_data
        })

    except Exception as error:
        return handle_generation_error(
            error,
            "Lecture retry",
            {
                "job_id": job_id,
                "transcript_saved": True
            }
        )

# --------------------------------------------------
# NOTES HISTORY
# --------------------------------------------------

@app.route("/api/history", methods=["GET"])
def get_notes_history():
    try:
        history = []

        for file_path in NOTES_DIR.glob("*.json"):
            try:
                with open(file_path, "r", encoding="utf-8") as file:
                    note_data = json.load(file)

                # Only show records with successfully generated notes
                if note_data.get("status") != "completed":
                    continue

                if not note_data.get("notes"):
                    continue

                history.append({
                    "id": note_data.get("job_id", file_path.stem),
                    "title": note_data.get("topic", "Untitled Notes"),
                    "mode": note_data.get("mode", "study"),
                    "date": note_data.get("created_at"),
                    "description": (
                        note_data.get("fileName")
                        if note_data.get("mode") == "lecture"
                        else note_data.get("subtopic") or "AI-generated study notes"
                    )
                })

            except (json.JSONDecodeError, OSError) as error:
                print(f"Skipping invalid history file {file_path.name}: {error}")

        history.sort(
            key=lambda item: item["date"] or "",
            reverse=True
        )

        return jsonify({
            "status": "success",
            "history": history
        })

    except Exception as error:
        print("History retrieval error:", str(error))
        return jsonify({"error": "Could not retrieve notes history."}), 500


# --------------------------------------------------
# GET ONE SAVED NOTE
# --------------------------------------------------

@app.route("/api/notes/<job_id>", methods=["GET"])
def get_saved_note(job_id):
    if not re.fullmatch(r"[a-f0-9]{32}", job_id):
        return jsonify({"error": "Invalid note ID."}), 400

    file_path = NOTES_DIR / f"{job_id}.json"

    if not file_path.exists():
        return jsonify({"error": "Saved notes were not found."}), 404

    try:
        with open(file_path, "r", encoding="utf-8") as file:
            note_data = json.load(file)

        if note_data.get("status") != "completed" or not note_data.get("notes"):
            return jsonify({"error": "These notes are not ready yet."}), 409

        return jsonify({
            "status": "success",
            **note_data
        })

    except Exception as error:
        print("Note retrieval error:", str(error))
        return jsonify({"error": "Could not open saved notes."}), 500


# --------------------------------------------------
# DELETE SAVED NOTE
# --------------------------------------------------

@app.route("/api/notes/<job_id>", methods=["DELETE"])
def delete_saved_note(job_id):
    if not re.fullmatch(r"[a-f0-9]{32}", job_id):
        return jsonify({"error": "Invalid note ID."}), 400

    file_path = NOTES_DIR / f"{job_id}.json"

    if not file_path.exists():
        return jsonify({"error": "Saved notes were not found."}), 404

    try:
        file_path.unlink()

        return jsonify({
            "status": "success",
            "message": "Note deleted successfully."
        })

    except OSError as error:
        print("Note deletion error:", str(error))
        return jsonify({"error": "Could not delete saved notes."}), 500





if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=os.getenv("FLASK_DEBUG", "False").lower() == "true"
    )
