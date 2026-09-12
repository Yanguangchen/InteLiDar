from __future__ import annotations

from app.models import CaptureObject, IngestRequest, Room
from app.services.ingest import ingest_capture


def test_ingest_demo_returns_raw_unknown_objects_with_stable_ids() -> None:
    graph = ingest_capture(IngestRequest())

    assert graph.room.width == 7.4
    assert graph.room.depth == 5.2
    assert graph.room.height == 2.8
    assert graph.room.units == "m"
    assert [obj.id for obj in graph.objects] == [
        "table-1",
        "chair-1",
        "chair-2",
        "chair-3",
        "chair-4",
        "monitor-1",
        "shelf-1",
        "door-1",
        "window-1",
    ]
    assert all(obj.type == "unknown" for obj in graph.objects)


def test_ingest_preserves_caller_geometry_and_strips_semantics() -> None:
    graph = ingest_capture(
        IngestRequest(
            room=Room(id="room-x", name="lab", width=4.0, depth=3.0, height=2.5),
            objects=[
                    CaptureObject(
                        id="blob-1",
                        position=(1.0, 0.4, 2.0),
                        size=(2.0, 0.8, 1.0),
                    type="table",
                    label="Conference table",
                    category="furniture",
                    material="wood",
                )
            ],
        )
    )

    assert graph.room.id == "room-x"
    assert graph.room.width == 4.0
    assert len(graph.objects) == 1
    obj = graph.objects[0]
    assert obj.id == "blob-1"
    assert obj.position == (1.0, 0.4, 2.0)
    assert obj.size == (2.0, 0.8, 1.0)
    assert obj.type == "unknown"
    assert obj.label == "Unknown object"
    assert obj.material is None
    assert obj.confidence is None
