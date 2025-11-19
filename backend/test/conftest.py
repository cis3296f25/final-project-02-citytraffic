import pytest
from django.test import RequestFactory
from edits_api.models import CityEdit

@pytest.fixture
def factory():
    return RequestFactory()

@pytest.fixture
def sample_city_data():
    return {
        "title": "Test City",
        "grid_data": [
            [None, "road_straight", None],
            ["tree", "building", "car"],
            [None, "road_intersection", None]
        ],
        "rows": 3,
        "cols": 3,
        "selected_tool": "road_straight"
    }

@pytest.fixture
def city_edit_instance(sample_city_data):
    return CityEdit.objects.create(**sample_city_data)