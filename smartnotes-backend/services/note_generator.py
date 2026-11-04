
import json
import os
import time

from google import genai


def generate_study_notes(topic, subtopic="", level="beginner"):
    api_key = os.getenv("GEMINI_API_KEY")
    model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")

    if not api_key:
        raise ValueError(
            "Gemini API key is missing. Add GEMINI_API_KEY to backend .env."
        )

    client = genai.Client(api_key=api_key)

    level_instructions = {
        "beginner": "Use simple language, explain basic terms, and assume the learner is new.",
        "intermediate": "Give detailed explanations and practical examples. Assume basic prior knowledge.",
        "advanced": "Give technically detailed explanations, deeper concepts, and relevant limitations."
    }

    if level not in level_instructions:
        raise ValueError("Invalid learning level.")

    prompt = f"""
You are an expert academic tutor and educational content creator.

Create high-quality, structured, and easy-to-understand study notes
for learners, students, and anyone seeking to understand the given topic.
Adapt the depth, terminology, and explanations according to the
specified learning level.

Create accurate, well-organized study notes.

TOPIC: {topic}
SUBTOPIC: {subtopic if subtopic else "Cover the important subtopics of the main topic."}
LEARNING LEVEL: {level}

INSTRUCTIONS:
{level_instructions[level]}

Create:
1. A concise but informative summary.
2. 5 to 8 important key points.
3. Detailed notes divided into meaningful sections.
4. Important definitions and explanations.
5. Practical or real-world examples where relevant.
6. A list of important keywords.
7. A short revision section.
8. 3 self-assessment questions with answers.

Return ONLY valid JSON with this exact structure:
{{
  "title": "Notes title",
  "summary": "Summary text",
  "keyPoints": ["point 1", "point 2"],
  "sections": [
    {{
      "heading": "Section heading",
      "content": "Detailed explanation",
      "bullets": ["detail 1", "detail 2"],
      "examples": ["example 1"]
    }}
  ],
  "keywords": ["keyword 1", "keyword 2"],
  "revision": ["revision point 1", "revision point 2"],
  "questions": [
    {{
      "question": "Question text",
      "answer": "Answer text"
    }}
  ]
}}

Do not include Markdown code fences. Keep the notes educational,
clear, and relevant to the specified topic.
"""

    print(f"Using Gemini model: {model}")

    response = None

    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config={
                    "response_mime_type": "application/json"
                }
            )
            break

        except Exception as error:
            error_message = str(error)
            error_lower = error_message.lower()

            # Daily Gemini quota exhausted
            if (
                "429" in error_message
                and (
                    "per day" in error_lower
                    or "quota exceeded" in error_lower
                )
            ):
                raise RuntimeError(
                    "GEMINI_DAILY_QUOTA_EXCEEDED: "
                    "Gemini's daily API quota has been exhausted. "
                    "Please try again after the quota resets."
                ) from error

            # Other temporary rate limits
            if "429" in error_message or "RESOURCE_EXHAUSTED" in error_message:
                raise RuntimeError(
                    "GEMINI_RATE_LIMIT: Gemini API rate limit reached. "
                    "Please wait before trying again."
                ) from error

            # Temporary service unavailability
            if "503" in error_message or "UNAVAILABLE" in error_message:
                if attempt < 2:
                    wait_time = 2 ** (attempt + 1)
                    print(
                        f"Gemini temporarily unavailable. "
                        f"Retrying in {wait_time} seconds..."
                    )
                    time.sleep(wait_time)
                    continue

            raise

    if response is None:
        raise RuntimeError("Gemini could not generate notes.")

    print(f"Successfully generated notes using {model}")

    if not response.text:
        raise RuntimeError("The AI returned an empty response.")

    try:
        notes = json.loads(response.text)
    except json.JSONDecodeError as error:
        raise ValueError(
            "Gemini returned an invalid JSON response. Please try again."
        ) from error

    required_fields = [
        "title", "summary", "keyPoints", "sections",
        "keywords", "revision", "questions"
    ]

    for field in required_fields:
        if field not in notes:
            raise ValueError(f"AI response is missing the {field} field.")

    return notes
