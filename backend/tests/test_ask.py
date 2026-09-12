from __future__ import annotations

from app.models import AskResult, IngestRequest
from app.services.ask import ask_scene
from app.services.ingest import ingest_capture
from app.services.reconstruct import reconstruct_scene


class FakeReasoner:
    def __init__(self, result: AskResult) -> None:
        self.result = result
        self.called_with: tuple[object, str] | None = None

    def ask(self, graph: object, question: str) -> AskResult:
        self.called_with = (graph, question)
        return self.result


def _twin():
    return reconstruct_scene(ingest_capture(IngestRequest())).graph


def test_ask_chairs_highlights_only_existing_chair_ids() -> None:
    twin = _twin()
    result = ask_scene(twin, "Show me all the chairs.")
    ids = {obj.id for obj in twin.objects}

    assert set(result.highlight_ids) <= ids
    assert set(result.highlight_ids) == {"chair-1", "chair-2", "chair-3", "chair-4"}
    assert "chair" in result.reply.lower()


def test_ask_door_and_obstacles_use_graph_ids() -> None:
    twin = _twin()
    door = ask_scene(twin, "Where is the door?")
    assert door.highlight_ids == ["door-1"]

    blocked = ask_scene(twin, "What objects could obstruct movement through this room?")
    assert set(blocked.highlight_ids) == {
        "table-1",
        "chair-1",
        "chair-2",
        "chair-3",
        "chair-4",
        "shelf-1",
    }


def test_ask_filters_hallucinated_ids_from_reasoner() -> None:
    twin = _twin()
    reasoner = FakeReasoner(AskResult(reply="Highlighting chairs.", highlight_ids=["chair-1", "nope"]))
    result = ask_scene(twin, "chairs", reasoner=reasoner)

    assert reasoner.called_with is not None
    assert result.highlight_ids == ["chair-1"]
    assert result.reply == "Highlighting chairs."


def test_ask_window_and_equipment_use_graph_ids() -> None:
    twin = _twin()
    window = ask_scene(twin, "Where is the window?")
    assert window.highlight_ids == ["window-1"]

    equipment = ask_scene(twin, "Show me all electronic equipment.")
    assert equipment.highlight_ids == ["monitor-1"]


def test_ask_rejects_blank_questions() -> None:
    twin = _twin()
    try:
        ask_scene(twin, "   ")
    except ValueError as exc:
        assert "question" in str(exc).lower()
    else:
        raise AssertionError("expected ValueError for blank question")
