import math

import pytest

from app.fixtures import demo_twin_graph


def test_demo_furniture_faces_into_room_and_monitor_rests_on_table() -> None:
    objects = {obj.id: obj for obj in demo_twin_graph().objects}
    table = objects['table-1']
    for chair_id in ['chair-1', 'chair-2', 'chair-3', 'chair-4']:
        chair = objects[chair_id]
        assert chair.rotation is not None
        toward_table_z = table.position[2] - chair.position[2]
        assert math.cos(chair.rotation[1]) * toward_table_z > 0

    monitor = objects['monitor-1']
    assert monitor.rotation == pytest.approx((0, math.pi, 0))
    assert monitor.size == pytest.approx((0.58, 0.478, 0.2))
    assert monitor.position[1] - monitor.size[1] / 2 == pytest.approx(
        table.position[1] + table.size[1] / 2
    )

    shelf = objects['shelf-1']
    assert shelf.size == pytest.approx((1.6, 1.8, 0.38))
    assert shelf.rotation == pytest.approx((0, math.pi / 2, 0))
