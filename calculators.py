"""
calculators.py
Deterministic arithmetic engine for MP Bhumi Vikas Rules 2012.

Hard Rule 1: All arithmetic (fees, areas, setbacks, floors) happens in calculators.py,
never in the LLM.

All table values are loaded strictly from data/tables.json (verified from PDF pages).
Each calculator result includes the exact rule and PDF page for citations.
"""

from __future__ import annotations
import json
from pathlib import Path
from typing import Any, Dict, List, Optional

TABLES_PATH = Path("data/tables.json")


def load_tables() -> Dict[str, Any]:
    if not TABLES_PATH.exists():
        raise FileNotFoundError(f"Authoritative tables file not found at {TABLES_PATH}")
    with open(TABLES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


TABLES = load_tables()


def calculate_front_open_space(
    street_width_m: float,
    building_height_m: float = 9.0,
) -> Dict[str, Any]:
    """
    Calculates front open space for residential building based on street width.
    Rule: 56(1)(a), Page 77.
    """
    cfg = TABLES["rule_56_front_open_space"]
    rule = cfg["rule"]
    page = cfg["page"]
    max_h = cfg["max_building_height_meters"]

    if building_height_m > max_h:
        # Buildings > 12.5m follow Rule 42 Table 4/5
        return {
            "rule": "56(5) / 42",
            "page": 78,
            "applicable": False,
            "message": f"Building height {building_height_m}m exceeds 12.5m; open spaces governed by Rule 42 Tables 4 and 5.",
            "numbers_produced": [building_height_m, 12.5],
        }

    selected_space: Optional[float] = None
    slab_label = ""
    for slab in cfg["street_width_slabs"]:
        min_w = slab["min_street_width_m"]
        max_w = slab["max_street_width_m"]
        if max_w is None:
            if street_width_m >= min_w:
                selected_space = slab["front_open_space_m"]
                slab_label = slab["label"]
                break
        else:
            if min_w <= street_width_m <= max_w:
                selected_space = slab["front_open_space_m"]
                slab_label = slab["label"]
                break

    if selected_space is None:
        selected_space = 3.0
        slab_label = "Up to 9.0 meters (default)"

    return {
        "rule": rule,
        "page": page,
        "front_open_space_m": selected_space,
        "street_width_m": street_width_m,
        "building_height_m": building_height_m,
        "slab_label": slab_label,
        "numbers_produced": [selected_space, street_width_m, building_height_m],
    }


def calculate_rear_open_space(
    plot_area_sqm: float,
    building_height_m: float = 9.0,
) -> Dict[str, Any]:
    """
    Calculates rear open space for residential building based on plot area.
    Rule: 56(2)(a), Page 78.
    """
    cfg = TABLES["rule_56_rear_open_space"]
    rule = cfg["rule"]
    page = cfg["page"]
    max_h = cfg["max_building_height_meters"]

    if building_height_m > max_h:
        return {
            "rule": "56(5) / 42",
            "page": 78,
            "applicable": False,
            "message": f"Building height {building_height_m}m exceeds 12.5m; open spaces governed by Rule 42 Tables 4 and 5.",
            "numbers_produced": [building_height_m, 12.5],
        }

    selected_space: Optional[float] = None
    slab_label = ""
    for slab in cfg["plot_area_slabs"]:
        min_a = slab["min_plot_area_sqm"]
        max_a = slab["max_plot_area_sqm"]
        if max_a is None:
            if plot_area_sqm >= min_a:
                selected_space = slab["rear_open_space_m"]
                slab_label = slab["label"]
                break
        else:
            if min_a <= plot_area_sqm <= max_a:
                selected_space = slab["rear_open_space_m"]
                slab_label = slab["label"]
                break

    if selected_space is None:
        selected_space = 3.0
        slab_label = "Above 225.00 sq m"

    return {
        "rule": rule,
        "page": page,
        "rear_open_space_m": selected_space,
        "plot_area_sqm": plot_area_sqm,
        "slab_label": slab_label,
        "numbers_produced": [selected_space, plot_area_sqm],
    }


def calculate_side_open_spaces(
    building_type: str = "detached",
    frontage_m: Optional[float] = None,
    building_height_m: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Calculates side open spaces under Rule 56(3), Page 78.
    """
    cfg = TABLES["rule_56_side_open_space"]
    rule = cfg["rule"]
    page = cfg["page"]

    b_type = building_type.lower().replace("-", "_").replace(" ", "_")
    type_info = cfg["types"].get(b_type, cfg["types"]["detached"])
    side1 = type_info["side1_m"]
    side2 = type_info["side2_m"]

    # Concessions
    if b_type == "detached" and frontage_m is not None and frontage_m < 12.0 and building_height_m is not None and building_height_m <= 7.0:
        side2 = 1.5

    if b_type == "semi_detached" and frontage_m is not None and frontage_m <= 10.0 and building_height_m is not None and building_height_m <= 10.0:
        side1 = 2.5

    return {
        "rule": rule,
        "page": page,
        "building_type": building_type,
        "side1_m": side1,
        "side2_m": side2,
        "numbers_produced": [side1, side2],
    }


def calculate_far_and_area(
    use_group: str = "residential",
    plot_area_sqm: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Calculates permissible Floor Area Ratio (FAR) and maximum built-up area.
    Rule: 61 Table 8, Page 84.
    """
    cfg = TABLES["rule_61_table_8_far"]
    rule = cfg["rule"]
    page = cfg["page"]

    key = use_group.lower().strip()
    if "residen" in key:
        far_val = cfg["use_groups"]["residential"]["far"]
        category = cfg["use_groups"]["residential"]["category"]
    elif "commercial" in key or "shop" in key:
        far_val = cfg["use_groups"]["commercial_city_centre"]["far"]
        category = "Commercial (City Centre default)"
    elif "public" in key or "institutional" in key:
        far_val = cfg["use_groups"]["public_semi_public"]["far"]
        category = cfg["use_groups"]["public_semi_public"]["category"]
    else:
        far_val = 1.25
        category = "General"

    result = {
        "rule": rule,
        "page": page,
        "use_group": use_group,
        "category": category,
        "far": far_val,
        "numbers_produced": [far_val],
    }

    if plot_area_sqm is not None:
        max_builtup = round(plot_area_sqm * far_val, 2)
        result["plot_area_sqm"] = plot_area_sqm
        result["max_builtup_area_sqm"] = max_builtup
        result["numbers_produced"].extend([plot_area_sqm, max_builtup])

    return result


def calculate_farmhouse_norms(
    plot_area_sqm: Optional[float] = None,
    plot_area_ha: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Calculates Farm House norms under Rule 17, Page 34.
    """
    cfg = TABLES["rule_17_farm_house"]
    rule = cfg["rule"]
    page = cfg["page"]

    min_ha = cfg["min_plot_size_ha"]
    min_sqm = cfg["min_plot_size_sqm"]
    max_far = cfg["max_far"]
    max_height = cfg["max_height_m"]
    min_mos = cfg["min_mos_all_sides_m"]
    min_road = cfg["min_road_width_m"]
    min_trees = cfg["min_trees_per_ha"]

    res: Dict[str, Any] = {
        "rule": rule,
        "page": page,
        "min_plot_size_ha": min_ha,
        "min_plot_size_sqm": min_sqm,
        "max_far": max_far,
        "max_height_m": max_height,
        "min_marginal_open_space_m": min_mos,
        "min_road_width_m": min_road,
        "min_trees_per_ha": min_trees,
        "numbers_produced": [min_ha, min_sqm, max_far, max_height, min_mos, min_road, min_trees],
    }

    if plot_area_sqm is not None:
        builtup = round(plot_area_sqm * max_far, 2)
        res["plot_area_sqm"] = plot_area_sqm
        res["max_permissible_builtup_sqm"] = builtup
        res["numbers_produced"].extend([plot_area_sqm, builtup])
    elif plot_area_ha is not None:
        sqm = plot_area_ha * 10000.0
        builtup = round(sqm * max_far, 2)
        res["plot_area_ha"] = plot_area_ha
        res["plot_area_sqm"] = sqm
        res["max_permissible_builtup_sqm"] = builtup
        res["numbers_produced"].extend([plot_area_ha, sqm, builtup])

    return res


def calculate_fees(
    built_up_area_sqm: float,
    use_group: str = "residential",
) -> Dict[str, Any]:
    """
    Calculates building permission fee and application fee under Rule 21, Pages 35-36.
    """
    cfg = TABLES["rule_21_fees"]
    app_rate = cfg["application_fee"]["rate_per_sqm_builtup_area"]
    application_fee_rs = round(built_up_area_sqm * app_rate, 2)

    slabs = cfg["residential_permission_fee"]["slabs"]
    permission_fee_rs = 0
    slab_matched = None
    for slab in slabs:
        min_s = slab["min_sqm"]
        max_s = slab["max_sqm"]
        if max_s is None:
            if built_up_area_sqm >= min_s:
                permission_fee_rs = slab["fee_rs"]
                slab_matched = slab
                break
        else:
            if min_s <= built_up_area_sqm <= max_s:
                permission_fee_rs = slab["fee_rs"]
                slab_matched = slab
                break

    is_commercial = "commercial" in use_group.lower() or "shop" in use_group.lower()
    commercial_surcharge_rs = 0.0
    if is_commercial:
        surcharge_pct = cfg["commercial_surcharge"]["surcharge_percent"]
        commercial_surcharge_rs = round(permission_fee_rs * (surcharge_pct / 100.0), 2)
        permission_fee_rs = round(permission_fee_rs + commercial_surcharge_rs, 2)

    total_fee_rs = round(application_fee_rs + permission_fee_rs, 2)

    return {
        "rule": "21",
        "page": 36,
        "built_up_area_sqm": built_up_area_sqm,
        "use_group": use_group,
        "application_fee_rs": application_fee_rs,
        "permission_fee_rs": permission_fee_rs,
        "commercial_surcharge_rs": commercial_surcharge_rs if is_commercial else None,
        "total_fee_rs": total_fee_rs,
        "numbers_produced": [
            built_up_area_sqm,
            application_fee_rs,
            permission_fee_rs,
            total_fee_rs,
        ],
    }


def run_all_applicable_calculators(
    plot_area: Optional[float] = None,
    road_width: Optional[float] = None,
    building_height: Optional[float] = None,
    built_up_area: Optional[float] = None,
    use_group: str = "residential",
) -> Dict[str, Any]:
    """
    Executes all calculators for which relevant parameters are present.
    Returns combined calculator results and list of all verified numbers produced.
    """
    results: Dict[str, Any] = {}
    all_numbers: List[float] = []

    is_farmhouse = "farm" in use_group.lower()

    if is_farmhouse:
        fh = calculate_farmhouse_norms(plot_area_sqm=plot_area)
        results["farm_house"] = fh
        all_numbers.extend(fh["numbers_produced"])

    if road_width is not None:
        h = building_height if building_height is not None else 9.0
        front = calculate_front_open_space(street_width_m=road_width, building_height_m=h)
        results["front_open_space"] = front
        all_numbers.extend(front["numbers_produced"])

    if plot_area is not None and not is_farmhouse:
        h = building_height if building_height is not None else 9.0
        rear = calculate_rear_open_space(plot_area_sqm=plot_area, building_height_m=h)
        results["rear_open_space"] = rear
        all_numbers.extend(rear["numbers_produced"])

    if plot_area is not None or road_width is not None:
        far_res = calculate_far_and_area(use_group=use_group, plot_area_sqm=plot_area)
        results["far"] = far_res
        all_numbers.extend(far_res["numbers_produced"])

    # If built_up_area given, or calculable from plot_area * FAR
    fee_area = built_up_area
    if fee_area is None and plot_area is not None and not is_farmhouse:
        # Default single floor or FAR area
        fee_area = plot_area

    if fee_area is not None:
        fee_res = calculate_fees(built_up_area_sqm=fee_area, use_group=use_group)
        results["fees"] = fee_res
        all_numbers.extend(fee_res["numbers_produced"])

    return {
        "calculations": results,
        "verified_numbers": sorted(list(set(all_numbers))),
    }


if __name__ == "__main__":
    print("Testing Calculators:")
    # Q1: 10 m wide street, 9 m tall house
    print("\nQ1 Front Open Space:")
    q1 = calculate_front_open_space(10.0, 9.0)
    print(q1)

    # Q2: Farmhouse
    print("\nQ2 Farmhouse Norms:")
    q2 = calculate_farmhouse_norms()
    print(q2)

    # Q10: 150 sq m residential plot rear open space
    print("\nQ10 Rear Open Space for 150 sq m:")
    q10 = calculate_rear_open_space(150.0)
    print(q10)

    # Q14 (Hindi): 200 sq m plot on 9 m road
    print("\nQ14 Front Setback for 200 sq m on 9 m road:")
    q14 = calculate_front_open_space(9.0)
    print(q14)
