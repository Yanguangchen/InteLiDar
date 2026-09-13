from __future__ import annotations

from app.models import CaptureObject, IngestRequest, Room, SceneGraph, SceneObject
from app.services.ingest import ingest_capture
from app.services.reconstruct import reconstruct_scene


def test_reconstruct_preserves_custom_appearance() -> None:
    raw = ingest_capture(IngestRequest())
    raw.objects[0].color = "#467568"
    raw.objects[0].material = "stone"
    raw.objects[0].shape = "oval"
    result = reconstruct_scene(raw)
    table = result.graph.objects[0]
    assert table.color == "#467568"
    assert table.material == "stone"
    assert table.shape == "oval"
    assert table.size == raw.objects[0].size


def test_demo_contains_different_chair_styles_and_colors() -> None:
    result = reconstruct_scene(ingest_capture(IngestRequest()))
    chairs = [obj for obj in result.graph.objects if obj.type == "chair"]
    assert len({chair.color for chair in chairs}) == 4
    assert {chair.shape for chair in chairs} >= {"task", "armchair", "visitor"}


def test_roomplan_reconstruction_preserves_device_labels_without_demo_id_lookup() -> None:
    graph = SceneGraph(
        source="roomplan", room=Room(width=5, depth=4, height=2.6),
        objects=[SceneObject(id="table-1", type="chair", label="Captured chair", category="furniture",
                             position=(0, 0.45, 0), size=(0.5, 0.9, 0.5), rotation=(0, 1.2, 0))],
    )
    result = reconstruct_scene(graph)
    assert result.graph.model_dump()["source"] == "roomplan"
    assert result.graph.objects[0].type == "chair"
    assert result.graph.objects[0].label == "Captured chair"
    assert result.graph.objects[0].rotation == (0, 1.2, 0)


def test_catalog_model_survives_reconstruction_and_camel_case_transport() -> None:
    graph = ingest_capture(IngestRequest())
    graph.objects.append(SceneObject(id="added-sofa", type="sofa", label="Two-seat sofa", category="furniture",
                                     position=(0, 0.43, 0), size=(1.62, 0.86, 0.86), assetId="sofa_2seat"))
    result = reconstruct_scene(graph).graph
    assert result.objects[-1].type == "sofa"
    assert result.model_dump(by_alias=True)["objects"][-1]["assetId"] == "sofa_2seat"


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
