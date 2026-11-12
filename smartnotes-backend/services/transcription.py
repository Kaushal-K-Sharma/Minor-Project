import os
import subprocess
import tempfile

from pathlib import Path
from functools import lru_cache

import imageio_ffmpeg
from faster_whisper import WhisperModel


# Use "base" for a reasonable balance on CPU.
# Change to "small" if your computer handles it comfortably.
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")

print("DEBUG: Loading Whisper model now.", flush=True)

@lru_cache(maxsize=1)
def get_model():
    print(f"Loading Faster-Whisper model: {WHISPER_MODEL}")

    return WhisperModel(
        WHISPER_MODEL,
        device="cpu",
        compute_type="int8"
    )


def extract_audio(input_path, output_path):
    """Extract audio from audio/video files and convert to 16 kHz mono WAV."""

    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

    command = [
        ffmpeg_exe,
        "-y",
        "-i", str(input_path),
        "-vn",
        "-ac", "1",
        "-ar", "16000",
        "-c:a", "pcm_s16le",
        str(output_path)
    ]

    result = subprocess.run(
        command,
        capture_output=True,
        text=True,
        timeout=60 * 30
    )

    if result.returncode != 0:
        raise RuntimeError("Audio extraction failed. The file may be damaged or unsupported.")





print("DEBUG: Audio extraction completed.", flush=True)


def transcribe_file(input_path):
    """
    Convert an audio/video file into text.
    Returns transcript and timestamped segments.
    """

    input_path = Path(input_path)

    if not input_path.exists():
        raise FileNotFoundError("Uploaded lecture file was not found.")

    with tempfile.TemporaryDirectory() as temp_dir:
        audio_path = Path(temp_dir) / "lecture_audio.wav"

        print("Extracting audio...")
        extract_audio(input_path, audio_path)

        print("Starting speech transcription...")

        model = get_model()

        segments, info = model.transcribe(
            str(audio_path),
            beam_size=3,
            vad_filter=True
        )

        transcript_parts = []
        timestamp_segments = []

    print("DEBUG: Starting transcription iteration.", flush=True)

        for segment in segments:
            text = segment.text.strip()

            if not text:
                continue

            start = round(segment.start, 2)
            end = round(segment.end, 2)

            transcript_parts.append(text)

            timestamp_segments.append({
                "start": start,
                "end": end,
                "text": text
            })

        transcript = " ".join(transcript_parts)

        if not transcript.strip():
            raise RuntimeError(
                "No speech was detected. Please upload a clearer lecture recording."
            )

        return {
            "transcript": transcript,
            "segments": timestamp_segments,
            "language": info.language,
            "duration": round(info.duration, 2)
        }