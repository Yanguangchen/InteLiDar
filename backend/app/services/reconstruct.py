from __future__ import annotations

from collections import Counter

from app.fixtures import demo_twin_graph
from app.models import AnalysisStep, ReconstructResult, SceneGraph, SceneObject

_DEMO_BY_ID = {obj.id: obj for obj in demo_twin_graph().objects}


def reconstruct_scene(graph: SceneGraph) -> ReconstructResult:
    # RoomPlan already labels its measured objects. Never overwrite these with demo ids or size heuristics.
    objects = [obj.model_copy() for obj in graph.objects] if graph.source == "roomplan" else [_classify(obj) for obj in graph.objects]
    return ReconstructResult(
        graph=SceneGraph(source=graph.source, room=graph.room, objects=objects),
        analysis_steps=_analysis_steps(objects),
    )


def _classify(obj: SceneObject) -> SceneObject:
    demo = _DEMO_BY_ID.get(obj.id)
    if demo is not None:
        labelled = demo.model_copy()
        labelled.position = obj.position
        labelled.size = obj.size
        labelled.rotation = obj.rotation
        labelled.color = obj.color or labelled.color
        labelled.material = obj.material or labelled.material
        labelled.shape = obj.shape or labelled.shape
        return labelled
    return _classify_geometry(obj)


def _classify_geometry(obj: SceneObject) -> SceneObject:
    width, height, depth = obj.size
    thin = min(width, depth) < 0.15
    span = max(width, depth)

    if thin and height >= 2.0:
        return obj.model_copy(
            update={
                "type": "door",
                "label": "Door",
                "category": "opening",
                "material": "wood",
                "color": "#5c4030",
                "confidence": 0.82,
            }
        )
    if thin and height >= 1.0:
        return obj.model_copy(
            update={
                "type": "window",
                "label": "Window",
                "category": "opening",
                "material": "glass",
                "color": "#7ec8e3",
                "confidence": 0.8,
            }
        )
    if thin:
        return obj.model_copy(
            update={
                "type": "monitor",
                "label": "Display",
                "category": "equipment",
                "material": "plastic",
                "color": "#1c222c",
                "confidence": 0.74,
            }
        )
    if height < 0.9 and span >= 1.5:
        return obj.model_copy(
            update={
                "type": "table",
                "label": "Table",
                "category": "furniture",
                "material": "wood",
                "color": "#8d5a32",
                "confidence": 0.8,
            }
        )
    if 0.7 <= height <= 1.2 and span <= 0.7:
        return obj.model_copy(
            update={
                "type": "chair",
                "label": "Chair",
                "category": "furniture",
                "material": "fabric",
                "color": "#3d4a5c",
                "confidence": 0.78,
            }
        )
    if height >= 1.4:
        return obj.model_copy(
            update={
                "type": "shelf",
                "label": "Storage shelf",
                "category": "furniture",
                "material": "metal",
                "color": "#6b6258",
                "confidence": 0.72,
            }
        )
    return obj.model_copy(
        update={
            "type": "object",
            "label": "Object",
            "category": "furniture",
            "confidence": 0.5,
        }
    )


def _analysis_steps(objects: list[SceneObject]) -> list[AnalysisStep]:
    counts = Counter(obj.type for obj in objects)
    steps = [
        AnalysisStep(origin="Unknown surface", to="Wall"),
        AnalysisStep(origin="Unknown surface", to="Floor"),
    ]
    if counts["table"]:
        steps.append(AnalysisStep(origin="Unknown object", to="Table"))
    if counts["chair"]:
        n = counts["chair"]
        steps.append(AnalysisStep(origin="Unknown object", to="Chair × 4" if n == 4 else ("Chair" if n == 1 else f"Chair × {n}")))
    if counts["door"]:
        steps.append(AnalysisStep(origin="Unknown opening", to="Door"))
    if counts["window"]:
        steps.append(AnalysisStep(origin="Unknown opening", to="Window"))
    if counts["monitor"]:
        steps.append(AnalysisStep(origin="Unknown object", to="Display"))
    if counts["shelf"]:
        steps.append(AnalysisStep(origin="Unknown object", to="Shelf"))
    return steps
