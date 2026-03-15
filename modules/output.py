"""
Output Module
Generates final labeled 5-second scenario samples and formats results.
"""

import json
import os
import pandas as pd
import config


def format_scenarios(car_following: list, stop_and_go: list, lane_change: list) -> list:
    """
    Combine all detected scenarios, assign unique IDs, and format for output.
    """
    all_scenarios = []
    scenario_id = 1

    for s in car_following:
        s["scenario_id"] = f"CF-{scenario_id:04d}"
        all_scenarios.append(s)
        scenario_id += 1

    for s in stop_and_go:
        s["scenario_id"] = f"SG-{scenario_id:04d}"
        all_scenarios.append(s)
        scenario_id += 1

    for s in lane_change:
        s["scenario_id"] = f"LC-{scenario_id:04d}"
        all_scenarios.append(s)
        scenario_id += 1

    # Sort by start frame
    all_scenarios.sort(key=lambda x: x["start_frame"])

    return all_scenarios


def print_summary(scenarios: list):
    """Print a summary of detected scenarios."""
    cf_count = sum(1 for s in scenarios if s["scenario_type"] == "car_following")
    sg_count = sum(1 for s in scenarios if s["scenario_type"] == "stop_and_go")
    lc_count = sum(1 for s in scenarios if s["scenario_type"] == "lane_change")

    print("\n" + "=" * 60)
    print("SCENARIO DETECTION SUMMARY")
    print("=" * 60)
    print(f"  Car-Following scenarios:  {cf_count}")
    print(f"  Stop-and-Go scenarios:    {sg_count}")
    print(f"  Lane Change scenarios:    {lc_count}")
    print(f"  Total scenarios:          {len(scenarios)}")
    print("=" * 60)


def print_example_outputs(scenarios: list, max_examples: int = 2):
    """Print example scenario outputs for documentation purposes."""
    print("\n" + "=" * 60)
    print("EXAMPLE OUTPUTS")
    print("=" * 60)

    types = ["car_following", "stop_and_go", "lane_change"]
    type_labels = {
        "car_following": "Car-Following",
        "stop_and_go": "Stop-and-Go",
        "lane_change": "Lane Change"
    }

    for stype in types:
        type_scenarios = [s for s in scenarios if s["scenario_type"] == stype]
        if not type_scenarios:
            print(f"\n--- {type_labels[stype]}: No scenarios detected ---")
            continue

        print(f"\n--- {type_labels[stype]} (showing {min(max_examples, len(type_scenarios))} of {len(type_scenarios)}) ---")

        for s in type_scenarios[:max_examples]:
            print(f"\n  Scenario ID: {s['scenario_id']}")
            print(f"  Ego Vehicle: {s['ego_vehicle_id']}")
            print(f"  Frame Range: {s['start_frame']} - {s['end_frame']}")
            print(f"  Time Range:  {s['start_time_ms']} - {s['end_time_ms']} ms")

            if stype == "car_following":
                print(f"  Lead Vehicle: {s.get('lead_vehicle_id', 'N/A')}")
                print(f"  Avg Headway:  {s.get('avg_space_headway_ft', 'N/A')} ft")
                print(f"  Ego Avg Speed: {s.get('ego_avg_speed_ft_s', 'N/A')} ft/s")
                print(f"  Lead Avg Speed: {s.get('lead_avg_speed_ft_s', 'N/A')} ft/s")
            elif stype == "stop_and_go":
                print(f"  Lane: {s.get('ego_lane', 'N/A')}")
                print(f"  Min Speed:   {s.get('min_speed_ft_s', 'N/A')} ft/s")
                print(f"  Max Decel:   {s.get('max_deceleration_ft_s2', 'N/A')} ft/s^2")
                print(f"  Max Accel:   {s.get('max_acceleration_ft_s2', 'N/A')} ft/s^2")
            elif stype == "lane_change":
                print(f"  Source Lane: {s.get('source_lane', 'N/A')}")
                print(f"  Dest Lane:   {s.get('destination_lane', 'N/A')}")
                print(f"  Direction:   {s.get('change_direction', 'N/A')}")
                print(f"  Avg Speed:   {s.get('ego_avg_speed_ft_s', 'N/A')} ft/s")

            print(f"  Surrounding Vehicles ({len(s.get('surrounding_vehicles', []))}): "
                  f"{s.get('surrounding_vehicles', [])[:10]}")

            # Show a few trajectory points
            traj = s.get("ego_trajectory", [])
            if traj:
                print(f"  Ego Trajectory Sample (per second):")
                for t in traj[:3]:
                    print(f"    Frame {t['frame']}: pos=({t['x']}, {t['y']}), "
                          f"vel={t['vel']} ft/s, acc={t['acc']} ft/s^2, lane={t['lane']}")

    print("\n" + "=" * 60)
