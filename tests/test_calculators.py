"""
tests/test_calculators.py
Tests for arithmetic engine reading strictly from data/tables.json.
"""

from calculators import (
    calculate_farmhouse_norms,
    calculate_fees,
    calculate_front_open_space,
    calculate_rear_open_space,
    calculate_side_open_spaces,
    calculate_far_and_area,
)


def test_front_open_space_slabs():
    # <= 9.0 m road -> 3.0 m
    res9 = calculate_front_open_space(street_width_m=9.0)
    assert res9["front_open_space_m"] == 3.0
    assert res9["rule"] == "56(1)(a)"
    assert res9["page"] == 77

    # 10.0 m road -> 3.6 m
    res10 = calculate_front_open_space(street_width_m=10.0)
    assert res10["front_open_space_m"] == 3.6

    # 15.0 m road -> 4.5 m
    res15 = calculate_front_open_space(street_width_m=15.0)
    assert res15["front_open_space_m"] == 4.5

    # 24.0 m road -> 6.0 m
    res24 = calculate_front_open_space(street_width_m=24.0)
    assert res24["front_open_space_m"] == 6.0


def test_rear_open_space_slabs():
    # <= 40 sqm -> 0.0 m (Nil)
    res30 = calculate_rear_open_space(plot_area_sqm=30.0)
    assert res30["rear_open_space_m"] == 0.0

    # 150 sqm -> 1.5 m
    res150 = calculate_rear_open_space(plot_area_sqm=150.0)
    assert res150["rear_open_space_m"] == 1.5
    assert res150["rule"] == "56(2)(a)"
    assert res150["page"] == 78

    # 200 sqm -> 2.5 m
    res200 = calculate_rear_open_space(plot_area_sqm=200.0)
    assert res200["rear_open_space_m"] == 2.5

    # 300 sqm -> 3.0 m
    res300 = calculate_rear_open_space(plot_area_sqm=300.0)
    assert res300["rear_open_space_m"] == 3.0


def test_farmhouse_norms():
    res = calculate_farmhouse_norms(plot_area_ha=1.0)
    assert res["min_plot_size_ha"] == 0.40
    assert res["max_far"] == 0.10
    assert res["max_height_m"] == 7.5
    assert res["min_marginal_open_space_m"] == 7.5
    assert res["min_road_width_m"] == 7.5
    assert res["rule"] == "17"
    assert res["page"] == 34


def test_fees_calculation():
    # 200 sqm built up area residential
    res200 = calculate_fees(built_up_area_sqm=200.0, use_group="residential")
    # Application fee = 200 * 1.0 = Rs 200
    assert res200["application_fee_rs"] == 200.0
    # Permission fee for 126-200 sqm slab = Rs 2,000
    assert res200["permission_fee_rs"] == 2000.0
    assert res200["total_fee_rs"] == 2200.0
    assert res200["rule"] == "21"
    assert res200["page"] == 36

    # Commercial surcharge check: +50%
    res_comm = calculate_fees(built_up_area_sqm=200.0, use_group="commercial")
    assert res_comm["commercial_surcharge_rs"] == 1000.0
    assert res_comm["permission_fee_rs"] == 3000.0
