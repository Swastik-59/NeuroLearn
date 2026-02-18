"""
Flashcard generation prompts.
The actual generation is done via gemini_client.generate_json().
"""

_FLASHCARD_FORMAT_INSTRUCTIONS = (
    "Return ONLY a JSON array with no extra text, no markdown fences, no explanation.\n"
    "Each element must have exactly two keys: \"front\" and \"back\".\n"
    "\"front\" is the question or term, \"back\" is the answer or definition.\n"
    "Keep answers concise (1-3 sentences).\n"
    "Generate at least 5 and up to 10 flashcards.\n"
    "Example format:\n"
    '[{"front": "What is a stack?", "back": "A LIFO data structure where elements are added and removed from the top."}]'
)


def generate_flashcard_prompt(subject: str, level: str, topic: str | None = None) -> str:
    """Build a prompt that asks the LLM to produce flashcards for a subject."""
    scope = f"{subject} at {level} level"
    if topic:
        scope += f", focusing on {topic}"

    return (
        f"Generate exactly 10 flashcards for studying {scope}.\n"
        + _FLASHCARD_FORMAT_INSTRUCTIONS
    )


def generate_flashcard_custom_topic_prompt(custom_topic: str) -> str:
    """Build a prompt for a free-form custom topic (no subject required)."""
    return (
        f"Generate exactly 10 flashcards for the topic: {custom_topic}\n"
        "Cover the most important concepts, definitions, and facts.\n"
        + _FLASHCARD_FORMAT_INSTRUCTIONS
    )


def generate_flashcard_from_material_prompt(chunks: list[str]) -> str:
    """Build a prompt that generates flashcards from uploaded material chunks."""
    context = "\n---\n".join(chunks)
    return (
        "Based on the following study material, generate exactly 10 flashcards.\n"
        + _FLASHCARD_FORMAT_INSTRUCTIONS + "\n\n"
        f"MATERIAL:\n{context}\n\n"
        "Generate the flashcards now."
    )


def validate_flashcards(cards: list[dict]) -> list[dict]:
    """Normalize and validate flashcard dicts. Returns cleaned list."""
    normalized: list[dict] = []
    for c in cards:
        front = str(c.get("front") or c.get("question") or c.get("term") or "").strip()
        back = str(c.get("back") or c.get("answer") or c.get("definition") or "").strip()
        if front and back:
            normalized.append({"front": front, "back": back})
    return normalized
