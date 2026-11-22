
import json
import os
import re
import time

from google import genai


def parse_gemini_json(response_text):
    """Extract a JSON object from Gemini's response."""

    if not response_text or not response_text.strip():
        raise ValueError("Gemini returned an empty response.")

    cleaned = response_text.strip()

    cleaned = re.sub(
        r"^```(?:json)?\s*",
        "",
        cleaned,
        flags=re.IGNORECASE
    )
    cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        result = json.loads(cleaned)
        if isinstance(result, dict):
            return result
    except json.JSONDecodeError:
        pass

    decoder = json.JSONDecoder()

    for index, character in enumerate(cleaned):
        if character == "{":
            try:
                result, _ = decoder.raw_decode(cleaned[index:])
                if isinstance(result, dict):
                    return result
            except json.JSONDecodeError:
                continue

    print("GEMINI RAW RESPONSE PREVIEW:")
    print(cleaned[:3000])

    raise ValueError(
        "Gemini returned incomplete or invalid JSON. Please try again."
    )


def generate_study_notes(
    topic,
    subtopic="",
    level="beginner",
    learning_style="structured",
    nlp_analysis=None,
    source_type="study"
):
    """
    Generate adaptive academic notes using Gemini.

    learning_style:
        structured = exam-oriented notes
        guided = teacher-like guided explanations

    source_type:
        study = topic-based learning
        lecture = notes grounded in a lecture transcript
    """

    api_key = os.getenv("GEMINI_API_KEY")
    model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")

    if not api_key:
        raise ValueError(
            "Gemini API key is missing. Check your backend .env file."
        )

    if not isinstance(topic, str) or not topic.strip():
        raise ValueError("Please provide a valid topic.")

    level = str(level).lower().strip()
    learning_style = str(learning_style).lower().strip()
    source_type = str(source_type).lower().strip()

    if level not in ["beginner", "intermediate", "advanced"]:
        raise ValueError("Invalid learning level.")

    if learning_style not in ["structured", "guided"]:
        raise ValueError("Invalid learning style.")

    if source_type not in ["study", "lecture"]:
        raise ValueError("Invalid source type.")

    # --------------------------------------------------
    # DIFFICULTY LEVEL
    # --------------------------------------------------

    level_instructions = {
        "beginner": """
Assume the student is new to the topic.

Start with intuitive explanations and familiar language.
Introduce technical terms gradually and explain them.
Use simple examples before formal or complex explanations.
Do not remove important academic concepts merely to simplify them.
""",

        "intermediate": """
Assume the student knows basic concepts but needs a proper
understanding of the topic.

Use accurate technical terminology, detailed explanations,
relevant examples, comparisons and academic concepts.
Explain relationships between concepts.
""",

        "advanced": """
Assume the student already understands the fundamentals.

Include deeper technical details, formal definitions,
mathematical reasoning, algorithms, limitations and advanced
applications wherever relevant.

Do not spend excessive space explaining basic concepts.
"""
    }

    # --------------------------------------------------
    # LEARNING STYLE
    # --------------------------------------------------

    if learning_style == "structured":

        style_instructions = """
LEARNING STYLE: STRUCTURED NOTES

Create exam-oriented, well-organized academic notes.

The purpose is to make information easy to locate, revise
and remember.

Prefer:
- Clear headings and subheadings.
- Concise definitions.
- Important points and bullet lists.
- Classification and types.
- Advantages and disadvantages.
- Applications.
- Formulas and algorithms.
- Comparison tables.
- Short, relevant examples.
- Quick revision points.

Use paragraphs when an explanation requires them, but do not
turn the entire document into long continuous prose.

Keep the notes comprehensive enough for university study,
but make revision convenient.
"""

    else:

        style_instructions = """
LEARNING STYLE: GUIDED TEACHING EXPLANATION

Create carefully prepared teaching material similar to
a knowledgeable university teacher explaining a subject
to a student.

This is NOT ordinary structured notes with longer paragraphs.
It must have a clearly different teaching experience.

TEACHING FLOW:

1. Begin with a meaningful introduction that explains what
   the topic is and why it matters.

2. Give the student a short list of learning objectives.

3. Divide the subject into a logical sequence of concepts.
   Teach prerequisites before dependent concepts.

4. Begin each concept with an intuitive explanation.
   Then introduce its technical meaning or formal definition
   when appropriate.

5. Explain WHY a concept works and HOW it works, not merely
   what it means.

6. Use short, connected paragraphs with natural transitions.
   Avoid excessive bullet points and enormous text blocks.

7. Introduce examples immediately after the concept they explain.

8. Use step-by-step worked examples when the subject requires
   calculations, algorithms, derivations, state transitions,
   transformations or procedures.

9. Explain every important symbol, variable, notation or
   technical term when it first appears.

10. Connect each section to the next so the student develops
    a complete mental model of the subject.

11. End each major section with a concise takeaway when useful.

12. Finish with a meaningful recap, important terminology
    and self-assessment questions.

ADAPTIVE TEACHING — EXTREMELY IMPORTANT:

Do NOT use a fixed template for every subject.

First identify the nature of the topic and decide which
teaching methods are actually useful.

Examples:

- Theoretical computer science:
  formal definitions, notation, state diagrams, derivations,
  transition tables and step-by-step machine execution.

- Database concepts:
  sample tables, before-and-after transformations,
  functional dependencies, normalization examples and comparisons.

- Mathematics and statistics:
  intuition, equations, symbol explanations, calculations,
  worked numerical examples and interpretation.

- Algorithms and programming:
  problem explanation, logic, pseudocode, step-by-step execution,
  code examples and complexity analysis.

- Machine learning:
  intuition, workflow, mathematical foundations, examples,
  model behaviour, evaluation and limitations.

- Networking and computer architecture:
  components, architecture diagrams, data flow, protocols
  and practical scenarios.

These are examples, not mandatory templates.
Select only the elements that genuinely help explain the topic.

Do not force every section to contain a formula, table,
diagram, algorithm, advantages or disadvantages.

If an element is not relevant, omit it.

CONTENT DEPTH:

The student should be able to understand the covered topic
from the notes without searching elsewhere for basic explanations.

Do not sacrifice technical correctness for simplicity.
Preserve important formal details while explaining them clearly.

Avoid filler, repetitive introductions, generic statements
and unnecessary motivational language.
"""

    # --------------------------------------------------
    # SOURCE-GROUNDING INSTRUCTIONS
    # --------------------------------------------------

    if source_type == "lecture":

        source_instructions = """
SOURCE TYPE: LECTURE TRANSCRIPT

The provided source contains a lecturer's spoken explanation.

The transcript is the primary source for these notes.

SOURCE-GROUNDING RULES:

1. Preserve the lecturer's important concepts, explanations,
   examples, definitions and emphasis.

2. Give appropriate priority to concepts identified by NLP
   keyword extraction and important-sentence ranking.

3. Correctly organize spoken explanations into readable
   academic teaching material.

4. Remove speech disfluencies and repetition without removing
   meaningful information.

5. Do not invent an example and claim the lecturer gave it.

6. Do not attribute a definition, opinion or explanation
   to the lecturer unless the source supports it.

7. You may add background explanations to make difficult
   concepts understandable. However, clearly distinguish
   additional clarification from lecture-derived material.

8. Do not silently replace the lecturer's explanation
   with an unrelated textbook treatment.

9. If the transcript is unclear or incomplete, do not invent
   missing lecture details.

10. Retain important lecturer-specific examples and emphasis.

The notes should be a faithful, well-organized educational
version of the lecture, not a generic essay about the topic.
"""

    else:

        source_instructions = """
SOURCE TYPE: TOPIC-BASED STUDY

Create educational material using reliable subject knowledge.

Explain the topic comprehensively at the selected learning level.
Use relevant examples, formal concepts and supporting explanations.

Do not invent references, research findings or specific facts.
"""

    # --------------------------------------------------
    # NLP ANALYSIS
    # --------------------------------------------------

    nlp_context = ""

    if isinstance(nlp_analysis, dict) and nlp_analysis:

        keywords = nlp_analysis.get("keywords", [])
        important_sentences = nlp_analysis.get(
            "important_sentences", []
        )
        sentence_count = nlp_analysis.get("sentence_count", 0)
        methods = nlp_analysis.get("analysis_method", [])

        nlp_context = f"""
NLP ANALYSIS:

Sentence count: {sentence_count}

Extracted important terms:
{json.dumps(keywords, ensure_ascii=False)}

Important sentences:
{json.dumps(important_sentences, ensure_ascii=False)}

Techniques used:
{json.dumps(methods, ensure_ascii=False)}

Use this analysis as guidance for identifying important
concepts and organizing the material.

Do not blindly copy ranked sentences.
Do not assume frequent words are automatically important.
Do not treat NLP output as proof that a statement is correct.
"""

    # --------------------------------------------------
    # CONTENT SCHEMA
    # --------------------------------------------------

    output_structure = """
{
  "title": "Title",
  "learningStyle": "structured or guided",
  "introduction": "Introduction to the topic",
  "learningObjectives": [
    "Learning objective"
  ],
  "summary": "Topic summary",
  "keyPoints": [
    "Important point"
  ],
  "sections": [
    {
      "heading": "Section heading",
      "purpose": "Why this concept matters",
      "definition": "Formal definition when relevant",
      "content": "Main explanation",
      "bullets": [],
      "examples": [],
      "types": [],
      "working": [],
      "advantages": [],
      "disadvantages": [],
      "applications": [],
      "formula": [],
      "workedExample": "",
      "formalDetails": [],
      "analogy": "",
      "takeaway": "",
      "comparison": {
        "title": "",
        "columns": [],
        "rows": []
      }
    }
  ],
  "conceptExamples": [
    {
      "concept": "Concept",
      "explanation": "Explanation",
      "example": "Example",
      "connection": "Why this example demonstrates the concept"
    }
  ],
  "diagrams": [
    {
      "title": "Diagram title",
      "caption": "Diagram explanation",
      "mermaid": "flowchart TD; A[Start] --> B[End]"
    }
  ],
  "keywords": [
    "Important term"
  ],
  "glossary": [
    {
      "term": "Technical term",
      "meaning": "Simple explanation"
    }
  ],
  "revision": [
    "Revision point"
  ],
  "recap": "Final connected recap of the topic",
  "questions": [
    {
      "question": "Question",
      "answer": "Answer"
    }
  ]
}
"""

    # --------------------------------------------------
    # GENERATION PROMPT
    # --------------------------------------------------

    prompt = f"""
You are an experienced university professor and academic
learning-material designer.

Your task is to create high-quality university-level study notes.

TOPIC:
{topic}

ADDITIONAL TOPIC OR SOURCE MATERIAL:
{subtopic if subtopic else "No additional material supplied."}

LEARNING LEVEL:
{level}

{level_instructions[level]}

{style_instructions}

{source_instructions}

{nlp_context}

GENERAL CONTENT RULES:

- Be accurate and specific.
- Organize concepts in a logical learning sequence.
- Explain technical vocabulary.
- Avoid generic filler and repetition.
- Use examples that genuinely demonstrate the concept.
- Include important academic details.
- Do not invent facts or unsupported claims.
- Adapt the number and type of sections to the topic.
- Do not force irrelevant content into the notes.

GUIDED STYLE ADDITIONAL RULES:

When the selected style is guided:

- The introduction should create a clear starting point.
- Learning objectives should describe what the student will understand.
- Sections should teach concepts in a meaningful order.
- The content field should contain connected explanations.
- Use workedExample for a genuine step-by-step example.
- Use formalDetails for relevant notation, definitions or rules.
- Use comparison only when comparison improves understanding.
- Use diagrams only when a visual relationship is useful.
- Use takeaway to reinforce the central idea of a section.
- Include a glossary of important technical terms.
- Write a connected recap rather than repeating the summary.

STRUCTURED STYLE ADDITIONAL RULES:

When the selected style is structured:

- Prioritize organized reference material.
- Keep definitions and points concise.
- Use relevant tables, lists, formulas and classifications.
- Do not force a long teaching narrative.
- Introduction, learningObjectives, glossary and recap may be
  concise or empty if they do not add value.

ADAPTIVE SECTION PLANNING:

Before writing, internally determine:
1. What kind of subject is this?
2. What prerequisites should be explained?
3. Which concepts are central?
4. Which examples would make the concepts understandable?
5. Does the topic need formulas, tables, diagrams, algorithms,
   derivations, state transitions or before-and-after examples?
6. Which of those elements are actually relevant?

Do not include this planning in the final response.
Use it to produce the best teaching structure.

OUTPUT REQUIREMENTS:

Return one valid JSON object using this structure:

{output_structure}

IMPORTANT FIELD RULES:

- Keep all listed legacy fields in every section.
- Use empty strings or empty arrays when a field is irrelevant.
- comparison must always be an object with title, columns and rows.
- workedExample, formalDetails, analogy and takeaway are additional fields.
- diagrams must contain valid Mermaid flowchart syntax.
- Do not put Markdown fences around the JSON.
- Do not add explanations outside the JSON.
- Ensure all strings are correctly escaped.
- Return complete JSON, not a truncated response.
"""

    # --------------------------------------------------
    # GEMINI REQUEST
    # --------------------------------------------------

    client = genai.Client(api_key=api_key)

    print(f"Using Gemini model: {model}", flush=True)
    print(f"Learning style: {learning_style}", flush=True)
    print(f"Learning level: {level}", flush=True)
    print(f"Source type: {source_type}", flush=True)

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

            if (
                "429" in error_message
                and (
                    "per day" in error_lower
                    or "quota exceeded" in error_lower
                )
            ):
                raise RuntimeError(
                    "GEMINI_DAILY_QUOTA_EXCEEDED: "
                    "Gemini daily quota exhausted."
                ) from error

            if (
                "429" in error_message
                or "RESOURCE_EXHAUSTED" in error_message
            ):
                raise RuntimeError(
                    "GEMINI_RATE_LIMIT: "
                    "Gemini rate limit reached. Please wait and retry."
                ) from error

            if (
                "503" in error_message
                or "UNAVAILABLE" in error_message
            ):
                if attempt < 2:
                    wait_time = 2 ** (attempt + 1)
                    print(
                        f"Gemini unavailable. Retrying in {wait_time}s.",
                        flush=True
                    )
                    time.sleep(wait_time)
                    continue

            raise

    if response is None or not response.text:
        raise RuntimeError("Gemini returned an empty response.")

    # --------------------------------------------------
    # PARSE AND VALIDATE
    # --------------------------------------------------

    notes = parse_gemini_json(response.text)

    required_fields = [
        "title",
        "summary",
        "keyPoints",
        "sections",
        "conceptExamples",
        "diagrams",
        "keywords",
        "revision",
        "questions"
    ]

    for field in required_fields:
        if field not in notes:
            raise ValueError(
                f"AI response is missing the {field} field."
            )

    list_fields = [
        "keyPoints",
        "sections",
        "conceptExamples",
        "diagrams",
        "keywords",
        "revision",
        "questions",
        "learningObjectives",
        "glossary"
    ]

    for field in list_fields:
        if not isinstance(notes.get(field), list):
            notes[field] = []

    for field in [
        "introduction",
        "recap",
        "summary",
        "title"
    ]:
        if not isinstance(notes.get(field), str):
            notes[field] = ""

    # Ensure backward-compatible section structure.
    for section in notes["sections"]:

        if not isinstance(section, dict):
            continue

        for field in [
            "bullets",
            "examples",
            "types",
            "working",
            "advantages",
            "disadvantages",
            "applications",
            "formula",
            "formalDetails"
        ]:
            if not isinstance(section.get(field), list):
                section[field] = []

        for field in [
            "heading",
            "purpose",
            "definition",
            "content",
            "workedExample",
            "analogy",
            "takeaway"
        ]:
            if not isinstance(section.get(field), str):
                section[field] = ""

        if not isinstance(section.get("comparison"), dict):
            section["comparison"] = {
                "title": "",
                "columns": [],
                "rows": []
            }

    notes["learningStyle"] = learning_style

    print(
        f"Successfully generated {learning_style} notes.",
        flush=True
    )

    return notes
