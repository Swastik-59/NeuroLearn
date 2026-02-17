"""
Performance tracking module.
Tracks per-topic accuracy, per-question-type accuracy, mastery scoring,
cognitive load metrics, weakness DNA, and stress detection.
All state is stored in the session document in MongoDB.
"""

from __future__ import annotations
import math
from datetime import datetime, timezone

QUESTION_TYPES = ["mcq", "true_false", "short", "qa"]

# ---------------------------------------------------------------------------
# Adaptive mode thresholds
# ---------------------------------------------------------------------------
_HIGH_RESPONSE_TIME_THRESHOLD = 30.0   # seconds per question
_LOW_RESPONSE_TIME_THRESHOLD  = 8.0    # seconds per question
_STRESS_MISTAKE_STREAK        = 3
_ROLLING_WINDOW               = 5      # questions for rolling accuracy


def empty_performance() -> dict:
    """Return a blank performance record to embed in a new session."""
    return {
        # Existing fields
        "topic_accuracy": {},       # topic -> {correct: int, total: int}
        "type_accuracy": {},        # question_type -> {correct: int, total: int}
        "mastery_score": 0.0,
        "total_time_seconds": 0.0,
        "total_responses": 0,
        "streak": 0,
        "best_streak": 0,
        # Cognitive load fields
        "response_times": [],           # list[float] — per-question seconds
        "mistake_streak": 0,
        "correct_streak": 0,
        "cognitive_strain_index": 0.0,
        "adaptive_mode": None,          # str | None
        # Weakness DNA
        "weakness_profile": {},         # topic -> WeaknessEntry
        # Rolling buffer for stress detection
        "rolling_results": [],          # list[bool] — last N correct flags
        "stress_history": [],           # list[str] — logged stress events
    }


# ---------------------------------------------------------------------------
# Cognitive strain index
# ---------------------------------------------------------------------------

def _compute_csi(response_times: list[float], mistake_streak: int) -> float:
    """
    Cognitive Strain Index (0-100).
    Weighted combination of:
      - Normalised average response time (40%)
      - Response time variance / 100 normalised (30%)
      - Consecutive mistake ratio (30%)
    """
    if not response_times:
        return 0.0

    avg_rt = sum(response_times) / len(response_times)
    variance = (
        sum((t - avg_rt) ** 2 for t in response_times) / len(response_times)
        if len(response_times) > 1 else 0.0
    )
    std_rt = math.sqrt(variance)

    # Normalise: cap avg_rt at 60s → 0-1
    norm_avg   = min(avg_rt / 60.0, 1.0)
    # Normalise std deviation: cap at 30s
    norm_var   = min(std_rt / 30.0, 1.0)
    # Mistake streak: cap at 5
    norm_streak = min(mistake_streak / 5.0, 1.0)

    csi = (norm_avg * 0.4 + norm_var * 0.3 + norm_streak * 0.3) * 100
    return round(min(csi, 100.0), 1)


def _determine_adaptive_mode(
    accuracy: float,
    avg_response_time: float,
) -> str:
    """
    Determine adaptive learning mode based on accuracy and response time.

    Rules:
      accuracy >= 70 and avg_rt > HIGH  → fluency_training
      accuracy < 50  and avg_rt < LOW   → concept_reinforcement
      accuracy < 50  and avg_rt > HIGH  → cognitive_overload
      default                           → standard
    """
    if accuracy >= 70 and avg_response_time > _HIGH_RESPONSE_TIME_THRESHOLD:
        return "fluency_training"
    if accuracy < 50 and avg_response_time < _LOW_RESPONSE_TIME_THRESHOLD:
        return "concept_reinforcement"
    if accuracy < 50 and avg_response_time > _HIGH_RESPONSE_TIME_THRESHOLD:
        return "cognitive_overload"
    return "standard"


# ---------------------------------------------------------------------------
# Stress detection
# ---------------------------------------------------------------------------

def detect_stress(perf: dict) -> dict:
    """
    Return stress signal flags.
    Triggers if any of:
      - mistake_streak >= STRESS_MISTAKE_STREAK
      - last question's response time spiked > 2x the running average
      - rolling accuracy (last N) < 30%

    Returns:
        {
            "stress_detected": bool,
            "recommended_action": "micro_break" | "simplified_explanation"
                                  | "switch_to_review" | None
        }
    """
    stress = False
    action: str | None = None

    mistake_streak = perf.get("mistake_streak", 0)
    response_times = perf.get("response_times", [])
    rolling: list[bool] = perf.get("rolling_results", [])

    # Trigger 1 — consecutive mistakes
    if mistake_streak >= _STRESS_MISTAKE_STREAK:
        stress = True
        action = "switch_to_review"

    # Trigger 2 — sudden response-time spike
    if not stress and len(response_times) >= 2:
        avg_prev = sum(response_times[:-1]) / len(response_times[:-1])
        last = response_times[-1]
        if avg_prev > 0 and last > 2.5 * avg_prev and last > _HIGH_RESPONSE_TIME_THRESHOLD:
            stress = True
            action = "micro_break"

    # Trigger 3 — rolling accuracy drop
    if not stress and len(rolling) >= _ROLLING_WINDOW:
        recent = rolling[-_ROLLING_WINDOW:]
        rolling_acc = sum(recent) / len(recent) * 100
        if rolling_acc < 30:
            stress = True
            action = "simplified_explanation"

    return {
        "stress_detected": stress,
        "recommended_action": action,
    }


# ---------------------------------------------------------------------------
# Weakness DNA
# ---------------------------------------------------------------------------

def _update_weakness_profile(
    perf: dict,
    topic: str,
    answers: list[dict],
) -> None:
    """
    Update the weakness_profile for a given topic.
    mastery_score for the topic is derived from its topic_accuracy entry.
    """
    wp = perf.setdefault("weakness_profile", {})
    ta = perf.get("topic_accuracy", {})
    entry: dict = ta.get(topic, {"correct": 0, "total": 0})
    total = entry.get("total", 0)
    correct = entry.get("correct", 0)
    topic_acc = (correct / total * 100) if total > 0 else 0.0

    profile = wp.setdefault(topic, {
        "mastery_score": 0.0,
        "error_types": [],
        "recurring_patterns": [],
        "last_updated": None,
    })

    profile["mastery_score"] = round(topic_acc, 1)
    profile["last_updated"] = datetime.now(timezone.utc).isoformat()

    # Collect error types and keyword patterns from wrong answers
    for ans in answers:
        if not ans.get("correct", True):
            qtype = ans.get("type", "unknown")
            if qtype not in profile["error_types"]:
                profile["error_types"].append(qtype)

            # Extract keywords from the question as recurring pattern hints
            question_text: str = str(ans.get("question", ""))
            keywords = [
                w.lower() for w in question_text.split()
                if len(w) > 4 and w.isalpha()
            ]
            for kw in keywords[:3]:
                if kw not in profile["recurring_patterns"]:
                    profile["recurring_patterns"].append(kw)

    # Trim pattern list to avoid unbounded growth
    profile["recurring_patterns"] = profile["recurring_patterns"][-20:]

    # Remove from profile if no longer a weakness
    if topic_acc >= 60 and total >= 3:
        wp.pop(topic, None)


def get_weakness_dna(perf: dict) -> dict:
    """
    Return the full weakness profile (topics with mastery < 60).
    """
    return perf.get("weakness_profile", {})


# ---------------------------------------------------------------------------
# Core record function (updated)
# ---------------------------------------------------------------------------

def record_answers(
    perf: dict,
    answers: list[dict],
    question_type: str,
    topic: str,
    time_seconds: float = 0.0,
    per_question_times: list[float] | None = None,
) -> dict:
    """
    Update performance dict in-place after a round of answers.

    Each answer dict must have:
      - correct: bool

    Args:
        per_question_times: list of per-question response times (seconds).
            If provided, used for cognitive load metrics.
            Falls back to evenly distributing time_seconds if not provided.
    """
    correct_count = sum(1 for a in answers if a.get("correct", False))
    total_count = len(answers)

    # -- topic accuracy --
    ta = perf.setdefault("topic_accuracy", {})
    entry = ta.setdefault(topic, {"correct": 0, "total": 0})
    entry["correct"] += correct_count
    entry["total"] += total_count

    # -- type accuracy --
    tya = perf.setdefault("type_accuracy", {})
    tentry = tya.setdefault(question_type, {"correct": 0, "total": 0})
    tentry["correct"] += correct_count
    tentry["total"] += total_count

    # -- timing --
    perf["total_time_seconds"] = perf.get("total_time_seconds", 0.0) + time_seconds
    perf["total_responses"] = perf.get("total_responses", 0) + total_count

    # -- per-question times --
    times_list: list[float] = perf.setdefault("response_times", [])
    if per_question_times and len(per_question_times) == total_count:
        times_list.extend(per_question_times)
    elif total_count > 0 and time_seconds > 0:
        per = time_seconds / total_count
        times_list.extend([per] * total_count)
    # Keep last 50 entries to bound memory
    perf["response_times"] = times_list[-50:]

    # -- streak --
    if correct_count == total_count and total_count > 0:
        perf["streak"] = perf.get("streak", 0) + 1
        perf["correct_streak"] = perf.get("correct_streak", 0) + total_count
        perf["mistake_streak"] = 0
    else:
        mistake_count = total_count - correct_count
        perf["mistake_streak"] = perf.get("mistake_streak", 0) + mistake_count
        perf["correct_streak"] = 0
        perf["streak"] = 0
    perf["best_streak"] = max(perf.get("best_streak", 0), perf.get("streak", 0))

    # -- rolling results for stress detection --
    rolling: list[bool] = perf.setdefault("rolling_results", [])
    for a in answers:
        rolling.append(bool(a.get("correct", False)))
    perf["rolling_results"] = rolling[-20:]  # keep last 20

    # -- cognitive strain --
    perf["cognitive_strain_index"] = _compute_csi(
        perf["response_times"], perf.get("mistake_streak", 0)
    )

    # -- adaptive mode --
    total_all = entry["total"]
    acc_all = (entry["correct"] / total_all * 100) if total_all > 0 else 0.0
    rt_list = perf["response_times"]
    avg_rt = sum(rt_list) / len(rt_list) if rt_list else 0.0
    perf["adaptive_mode"] = _determine_adaptive_mode(acc_all, avg_rt)

    # -- weakness DNA --
    _update_weakness_profile(perf, topic, answers)

    # -- mastery --
    perf["mastery_score"] = compute_mastery(perf)

    return perf


def compute_mastery(perf: dict) -> float:
    """
    Mastery score (0-100) based on overall accuracy across all topics/types.
    Weighted: 60% accuracy, 20% coverage breadth, 20% streak bonus.
    """
    topic_acc = perf.get("topic_accuracy", {})
    type_acc = perf.get("type_accuracy", {})

    # overall accuracy
    total_correct = sum(v["correct"] for v in topic_acc.values())
    total_attempts = sum(v["total"] for v in topic_acc.values())
    accuracy = (total_correct / total_attempts * 100) if total_attempts > 0 else 0.0

    # coverage: how many topics & types attempted
    topic_count = len(topic_acc)
    type_count = len(type_acc)
    coverage = min((topic_count + type_count) / 8.0, 1.0) * 100  # normalise to 100

    # streak bonus
    streak = min(perf.get("best_streak", 0), 10)
    streak_score = (streak / 10.0) * 100

    mastery = accuracy * 0.6 + coverage * 0.2 + streak_score * 0.2
    return round(min(mastery, 100.0), 1)


def detect_weaknesses(perf: dict) -> list[dict]:
    """Return topics / types where accuracy < 50%."""
    weaknesses: list[dict] = []

    for topic, v in perf.get("topic_accuracy", {}).items():
        if v["total"] >= 2:
            acc = v["correct"] / v["total"] * 100
            if acc < 50:
                weaknesses.append({"kind": "topic", "name": topic, "accuracy": round(acc, 1)})

    for qtype, v in perf.get("type_accuracy", {}).items():
        if v["total"] >= 2:
            acc = v["correct"] / v["total"] * 100
            if acc < 50:
                weaknesses.append({"kind": "question_type", "name": qtype, "accuracy": round(acc, 1)})

    return weaknesses


def suggest_next_topic(perf: dict, all_topics: list[str]) -> str:
    """Pick the topic with lowest accuracy, or an un-attempted one."""
    ta = perf.get("topic_accuracy", {})

    # prefer un-attempted
    for t in all_topics:
        if t not in ta:
            return t

    # otherwise lowest accuracy
    scored = []
    for t in all_topics:
        v = ta.get(t, {"correct": 0, "total": 1})
        scored.append((t, v["correct"] / max(v["total"], 1)))
    scored.sort(key=lambda x: x[1])
    return scored[0][0] if scored else all_topics[0]


def get_study_recommendations(perf: dict, subject: str) -> list[str]:
    """Generate text recommendations based on performance data."""
    recs: list[str] = []
    mastery = perf.get("mastery_score", 0)
    weaknesses = detect_weaknesses(perf)

    if mastery < 30:
        recs.append(f"Focus on building fundamentals in {subject}.")
    elif mastery < 60:
        recs.append("Solid progress. Continue practicing to strengthen weak areas.")
    else:
        recs.append("Strong performance. Consider moving to advanced topics.")

    for w in weaknesses[:3]:
        if w["kind"] == "topic":
            recs.append(f"Review {w['name']} -- accuracy is {w['accuracy']}%.")
        else:
            recs.append(f"Practice more {w['name'].replace('_', ' ')} questions.")

    streak = perf.get("streak", 0)
    if streak >= 3:
        recs.append(f"Current streak: {streak} rounds correct in a row.")

    return recs
