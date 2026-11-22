
"""Lightweight NLP preprocessing for Smart Notes Generator.

Techniques:
1. Sentence segmentation
2. TF-IDF keyword extraction
3. TextRank sentence ranking
"""

import math
import re
from collections import Counter
from typing import Any


STOP_WORDS = {
    "a", "about", "above", "after", "again", "against", "all", "also",
    "am", "an", "and", "any", "are", "as", "at", "be", "because",
    "been", "before", "being", "below", "between", "both", "but", "by",
    "can", "could", "did", "do", "does", "doing", "down", "during",
    "each", "few", "for", "from", "further", "had", "has", "have",
    "having", "he", "her", "here", "hers", "herself", "him", "himself",
    "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself",
    "just", "me", "more", "most", "my", "myself", "no", "nor", "not",
    "of", "off", "on", "once", "only", "or", "other", "our", "ours",
    "ourselves", "out", "over", "own", "same", "she", "should", "so",
    "some", "such", "than", "that", "the", "their", "theirs", "them",
    "themselves", "then", "there", "these", "they", "this", "those",
    "through", "to", "too", "under", "until", "up", "very", "was",
    "we", "were", "what", "when", "where", "which", "while", "who",
    "whom", "why", "will", "with", "would", "you", "your", "yours",
    "yourself", "yourselves", "lecture", "today", "okay", "yeah", "um",
    "uh", "like", "know", "think", "actually", "basically",
}

WORD_PATTERN = re.compile(r"[A-Za-z][A-Za-z0-9_'-]*")
SENTENCE_PATTERN = re.compile(r"(?<=[.!?])\s+|[\r\n]+")


def clean_sentence(sentence: str) -> str:
    """Remove unnecessary whitespace and formatting characters."""
    return re.sub(r"\s+", " ", sentence).strip(" \t\r\n-•")


def segment_sentences(text: str) -> list[str]:
    """Divide text into sentence-like units."""
    if not isinstance(text, str) or not text.strip():
        return []

    normalized = text.replace("\u2028", "\n").replace("\u2029", "\n")
    parts = SENTENCE_PATTERN.split(normalized)

    sentences = [clean_sentence(part) for part in parts]

    return [
        sentence for sentence in sentences
        if len(sentence) >= 3
    ]


def tokenize(text: str) -> list[str]:
    """Extract useful words and remove stop words."""
    return [
        word.lower()
        for word in WORD_PATTERN.findall(text)
        if len(word) > 1 and word.lower() not in STOP_WORDS
    ]


def build_tfidf(sentences: list[str]):
    """Calculate TF-IDF weights for words in sentences."""
    tokenized = [Counter(tokenize(sentence)) for sentence in sentences]

    document_frequency = Counter()

    for word_counts in tokenized:
        document_frequency.update(word_counts.keys())

    total_documents = max(len(sentences), 1)

    idf = {
        word: math.log(
            1 + total_documents / (1 + frequency)
        ) + 1
        for word, frequency in document_frequency.items()
    }

    return tokenized, idf


def create_sentence_vectors(tokenized, idf):
    """Convert sentences into TF-IDF vectors."""
    vectors = []

    for word_counts in tokenized:
        total_words = sum(word_counts.values()) or 1

        vector = {
            word: (count / total_words) * idf.get(word, 0.0)
            for word, count in word_counts.items()
        }

        vectors.append(vector)

    return vectors


def cosine_similarity(vector_a, vector_b) -> float:
    """Calculate similarity between two sentence vectors."""
    if not vector_a or not vector_b:
        return 0.0

    common_words = vector_a.keys() & vector_b.keys()

    dot_product = sum(
        vector_a[word] * vector_b[word]
        for word in common_words
    )

    norm_a = math.sqrt(
        sum(value ** 2 for value in vector_a.values())
    )

    norm_b = math.sqrt(
        sum(value ** 2 for value in vector_b.values())
    )

    denominator = norm_a * norm_b

    return dot_product / denominator if denominator else 0.0


def textrank_scores(vectors, iterations: int = 20) -> list[float]:
    """Rank sentences using a TextRank-style similarity graph."""
    count = len(vectors)

    if count == 0:
        return []

    if count == 1:
        return [1.0]

    graph = [dict() for _ in range(count)]

    # Connect sentences based on their similarity.
    for i in range(count):
        for j in range(i + 1, count):
            similarity = cosine_similarity(vectors[i], vectors[j])

            if similarity > 0:
                graph[i][j] = similarity
                graph[j][i] = similarity

    damping = 0.85
    scores = [1.0 / count] * count

    # PageRank-style iterative scoring.
    for _ in range(iterations):
        updated = [(1 - damping) / count] * count

        for node in range(count):
            for neighbor, weight in graph[node].items():

                neighbor_total = sum(graph[neighbor].values())

                if neighbor_total:
                    updated[node] += (
                        damping
                        * scores[neighbor]
                        * weight
                        / neighbor_total
                    )

        scores = updated

    return scores


def analyze_text(
    text: str,
    max_keywords: int = 12,
    max_important_sentences: int = 8
) -> dict[str, Any]:
    """Perform NLP analysis and return useful information for note generation."""

    if not isinstance(text, str):
        raise TypeError("Input text must be a string.")

    sentences = segment_sentences(text)

    if not sentences:
        return {
            "sentence_count": 0,
            "keywords": [],
            "important_sentences": [],
            "analysis_method": [
                "Sentence Segmentation",
                "TF-IDF",
                "TextRank"
            ]
        }

    # Limit ranking to 120 sentences to control processing time.
    ranking_sentences = sentences[:120]

    # TF-IDF processing.
    tokenized, idf = build_tfidf(ranking_sentences)

    vectors = create_sentence_vectors(tokenized, idf)

    # Extract important keywords.
    keyword_scores = Counter()

    for word_counts in tokenized:
        total_words = sum(word_counts.values()) or 1

        for word, count in word_counts.items():
            keyword_scores[word] += (
                count / total_words
            ) * idf.get(word, 0.0)

    keywords = [
        word
        for word, score in keyword_scores.most_common(
            max(1, max_keywords)
        )
    ]

    # TextRank sentence ranking.
    scores = textrank_scores(vectors)

    ranked_indices = sorted(
        range(len(ranking_sentences)),
        key=lambda index: scores[index],
        reverse=True
    )

    selected_indices = sorted(
        ranked_indices[:max(1, max_important_sentences)]
    )

    important_sentences = [
        ranking_sentences[index]
        for index in selected_indices
    ]

    return {
        "sentence_count": len(sentences),
        "keywords": keywords,
        "important_sentences": important_sentences,
        "analysis_method": [
            "Sentence Segmentation",
            "TF-IDF Keyword Extraction",
            "TextRank Sentence Ranking"
        ]
    }
