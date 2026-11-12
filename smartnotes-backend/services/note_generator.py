
import json
import os
import time

from google import genai


def generate_study_notes(topic, subtopic="", level="beginner"):
    api_key = os.getenv("GEMINI_API_KEY")
    model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")

    if not api_key:
        raise ValueError(
            "Gemini API key is missing. Add GEMINI_API_KEY to backend .env."
        )

    if not topic or not topic.strip():
        raise ValueError("Please provide a topic.")

    level_instructions = {
        "beginner": (
            "Use simple language, explain technical terms, and build "
            "understanding from the basics. Include relatable examples."
        ),
        "intermediate": (
            "Give detailed academic explanations, practical examples, "
            "technical terminology, and relevant comparisons."
        ),
        "advanced": (
            "Give technically detailed explanations, deeper concepts, "
            "algorithms, limitations, formulas, and advanced examples."
        ),
    }

    level = level.lower().strip()
    if level not in level_instructions:
        raise ValueError("Invalid learning level.")

    client = genai.Client(api_key=api_key)

    prompt = f"""
You are an experienced university professor, subject expert,
and academic study-material writer.

Create COMPLETE, HIGH-QUALITY STUDY NOTES that a university student
can genuinely study from and use for exam preparation.

TOPIC: {topic}
SUBTOPIC: {subtopic if subtopic else "Cover the important subtopics of this topic."}
LEARNING LEVEL: {level}

LEARNING LEVEL INSTRUCTIONS:
{level_instructions[level]}

CONTENT QUALITY RULES:
1. Be factually accurate, specific, educational, and sufficiently detailed.
2. Do not give generic filler or repeat the same point in different words.
3. Organize the material from fundamentals to advanced ideas.
4. Explain technical terms when they first appear.
5. Use meaningful headings and logical subtopics.
6. Include relevant examples, preferably practical or real-world examples.
7. Use comparison tables when concepts are commonly confused or compared.
8. Include advantages, disadvantages, applications, types, and limitations
   whenever they are relevant to the topic.
9. Include formulas only when relevant. Explain every symbol.
10. For algorithms or processes, explain the steps in correct order.
11. Do not force irrelevant sections into a topic.
12. Avoid unsupported claims. If a detail is uncertain, do not invent it.
13. Make the notes useful for learning, not just quick revision.

GENERATE THE FOLLOWING:

A. SUMMARY
A concise but informative overview of the complete topic.

B. KEY POINTS
Provide 6 to 10 meaningful and non-repetitive points.

C. DETAILED NOTES
Create approximately 4 to 8 well-developed sections, depending on
the topic's complexity. Each section should use the relevant fields:
- heading
- definition
- content
- bullets
- examples
- types
- working
- advantages
- disadvantages
- applications
- formula
- comparison

Use empty strings or empty arrays for fields that are not relevant.
Do not force every field into every section.

For comparisons, use:
"comparison": {{
  "title": "Comparison title",
  "columns": ["Aspect", "Concept A", "Concept B"],
  "rows": [
    ["Meaning", "Explanation A", "Explanation B"]
  ]
}}

D. CONCEPT-EXAMPLE PAIRING
Provide 3 to 5 important concepts and a relevant example for each.
Explain briefly why the example demonstrates the concept.

E. DIAGRAMS
Suggest exactly 2 educational diagrams when the topic supports them.
Each diagram must be a valid Mermaid flowchart using simple syntax.
Choose diagrams that genuinely explain important concepts, processes,
architectures, classifications, or relationships from the notes.

Use this structure:
{{
  "title": "Diagram title",
  "caption": "What the diagram explains",
  "mermaid": "flowchart TD; A[Input] --> B[Process] --> C[Output]"
}}

Do not include images, external URLs, HTML, or Markdown fences.
If a meaningful diagram is not suitable, return an empty array.

F. KEYWORDS
Provide 6 to 12 important technical keywords.

G. QUICK REVISION
Provide 6 to 10 concise revision points.

H. SELF-ASSESSMENT
Provide 5 useful questions with accurate answers.
Include a mix of conceptual, descriptive, and application-based questions.

RETURN ONLY VALID JSON with this exact structure:

{{
  "title": "Study notes title",
  "summary": "Informative summary",
  "keyPoints": ["point 1", "point 2"],
  "sections": [
    {{
      "heading": "Section heading",
      "definition": "Relevant definition",
      "content": "Detailed explanation",
      "bullets": ["detail 1", "detail 2"],
      "examples": ["Relevant example"],
      "types": ["Type and explanation"],
      "working": ["Step 1", "Step 2"],
      "advantages": ["Advantage"],
      "disadvantages": ["Disadvantage"],
      "applications": ["Application"],
      "formula": ["Formula and explanation"],
      "comparison": {{
        "title": "",
        "columns": [],
        "rows": []
      }}
    }}
  ],
  "conceptExamples": [
    {{
      "concept": "Concept name",
      "explanation": "What the concept means",
      "example": "Relevant example",
      "connection": "Why the example demonstrates the concept"
    }}
  ],
  "diagrams": [
    {{
      "title": "Diagram title",
      "caption": "Diagram explanation",
      "mermaid": "flowchart TD; A[Start] --> B[Process]"
    }}
  ],
  "keywords": ["keyword 1"],
  "revision": ["revision point 1"],
  "questions": [
    {{
      "question": "Question",
      "answer": "Detailed but concise answer"
    }}
  ]
}}

Return valid JSON only. Do not use Markdown code fences.
"""

    print(f"Using Gemini model: {model}")

    response = None

    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config={"response_mime_type": "application/json"},
            )
            break

        except Exception as error:
            error_message = str(error)
            error_lower = error_message.lower()

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

            if "429" in error_message or "RESOURCE_EXHAUSTED" in error_message:
                raise RuntimeError(
                    "GEMINI_RATE_LIMIT: Gemini API rate limit reached. "
                    "Please wait before trying again."
                ) from error

            if "503" in error_message or "UNAVAILABLE" in error_message:
                if attempt < 2:
                    wait_time = 2 ** (attempt + 1)
                    print(f"Gemini unavailable. Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                    continue

            raise

    if response is None or not response.text:
        raise RuntimeError("Gemini returned an empty response.")

    try:
        notes = json.loads(response.text)
    except json.JSONDecodeError as error:
        raise ValueError(
            "Gemini returned invalid JSON. Please try again."
        ) from error

    required_fields = [
        "title",
        "summary",
        "keyPoints",
        "sections",
        "conceptExamples",
        "diagrams",
        "keywords",
        "revision",
        "questions",
    ]

    for field in required_fields:
        if field not in notes:
            raise ValueError(f"AI response is missing the {field} field.")

    # Ensure optional collections always have predictable types.
    for field in [
        "keyPoints", "sections", "conceptExamples",
        "diagrams", "keywords", "revision", "questions"
    ]:
        if not isinstance(notes[field], list):
            notes[field] = []

    for section in notes["sections"]:
        for field in [
            "bullets", "examples", "types", "working",
            "advantages", "disadvantages", "applications", "formula"
        ]:
            if not isinstance(section.get(field), list):
                section[field] = []

        if not isinstance(section.get("comparison"), dict):
            section["comparison"] = {
                "title": "",
                "columns": [],
                "rows": [],
            }

    print(f"Successfully generated notes using {model}")
    return notes