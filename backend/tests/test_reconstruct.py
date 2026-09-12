from __future__ import annotations

from app.models import CaptureObject, IngestRequest, Room
from app.services.ingest import ingest_capture
from app.services.reconstruct import reconstruct_scene


def test_reconstruct_keeps_ids_and_labels_demo_objects() -> None:
    raw = ingest_capture(IngestRequest())
    result = reconstruct_scene(raw)

    assert [obj.id for obj in result.graph.objects] == [obj.id for obj in raw.objects]
    table = next(obj for obj in result.graph.objects if obj.id == "table-1")
    assert table.type == "table"
    assert table.label == "Conference table"
    assert table.category == "furniture"
    assert table.material == "wood"
    assert table.confidence is not None and table.confidence > 0

    chairs = [obj for obj in result.graph.objects if obj.type == "chair"]
    assert len(chairs) == 4
    assert result.analysis_steps
    assert {step.to for step in result.analysis_steps} >= {"Table", "Chair × 4", "Door"}


def test_reconstruct_classifies_unknown_geometry_without_demo_ids() -> None:
    raw = ingest_capture(
        IngestRequest(
            room=Room(width=5.0, depth=4.0, height=2.6),
            objects=[
                    CaptureObject(id="a", position=(0, 0.38, 0), size=(2.4, 0.76, 1.2)),
                    CaptureObject(id="b", position=(0.7, 0.46, 1.1), size=(0.48, 0.92, 0.52)),
                    CaptureObject(id="c", position=(0.9, 1.05, 2.0), size=(1.0, 2.1, 0.08)),
            ],
        )
    )
    result = reconstruct_scene(raw)
    by_id = {obj.id: obj for obj in result.graph.objects}

    assert by_id["a"].type == "table"
    assert by_id["b"].type == "chair"
    assert by_id["c"].type == "door"
    assert all(obj.id in {"a", "b", "c"} for obj in result.graph.objects)
