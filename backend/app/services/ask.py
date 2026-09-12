from __future__ import annotations

from app.models import AskResult, SceneGraph, SceneObject
from app.services.reasoner import Reasoner, valid_highlight_ids


def ask_scene(graph: SceneGraph, question: str, reasoner: Reasoner | None = None) -> AskResult:
    if not question.strip():
        raise ValueError("question is required")
    if reasoner is not None:
        result = reasoner.ask(graph, question)
        return AskResult(reply=result.reply, highlight_ids=valid_highlight_ids(graph, result.highlight_ids))
    return heuristic_ask(graph, question)


def heuristic_ask(graph: SceneGraph, question: str) -> AskResult:
    q = question.lower()
    chairs = _of_type(graph, "chair")
    tables = _of_type(graph, "table")
    equipment = [obj for obj in graph.objects if obj.category == "equipment"]
    doors = _of_type(graph, "door")
    windows = _of_type(graph, "window")
    obstructors = [obj for obj in graph.objects if obj.type in {"table", "chair", "shelf"}]
    room = graph.room

    if "chair" in q:
        return AskResult(
            reply=f"{len(chairs)} chairs detected around the conference table. Highlighting them in the scene.",
            highlight_ids=[obj.id for obj in chairs],
        )
    if "table" in q:
        return AskResult(
            reply="One conference table sits at the center of the room. Highlighting it now."
            if len(tables) == 1
            else f"{len(tables)} tables found. Highlighting them now.",
            highlight_ids=[obj.id for obj in tables],
        )
    if "door" in q or "exit" in q:
        return AskResult(
            reply="The door is on the far wall, offset to the right of center. Nearest exit highlighted.",
            highlight_ids=[obj.id for obj in doors],
        )
    if "window" in q:
        return AskResult(
            reply="One window spans the right wall. Highlighting the opening."
            if len(windows) == 1
            else f"{len(windows)} windows found. Highlighting them now.",
            highlight_ids=[obj.id for obj in windows],
        )
    if any(word in q for word in ("electronic", "equipment", "monitor", "display")):
        return AskResult(
            reply="Electronic equipment: one display on the conference table."
            if len(equipment) == 1
            else f"{len(equipment)} electronic objects found.",
            highlight_ids=[obj.id for obj in equipment],
        )
    if any(word in q for word in ("obstruct", "walkway", "movement", "block")):
        return AskResult(
            reply="The table, chairs, and shelf sit in the main circulation path and could obstruct movement.",
            highlight_ids=[obj.id for obj in obstructors],
        )
    return AskResult(
        reply=(
            f"This {room.name} is {room.width}m × {room.depth}m. "
            f"I found {len(graph.objects)} labelled objects. Try asking about chairs, the door, or obstacles."
        ),
        highlight_ids=[],
    )


def _of_type(graph: SceneGraph, type_name: str) -> list[SceneObject]:
    return [obj for obj in graph.objects if obj.type == type_name]
