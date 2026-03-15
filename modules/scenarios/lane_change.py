"""
Lane Change Scenario Detection Module

Definition:
  A lane change scenario occurs when a vehicle transitions from one lane
  to an adjacent lane within a 5-second window. The ego vehicle's Lane_ID
  changes during the observation period, indicating a lateral maneuver.

Observable conditions:
  - The ego vehicle's Lane_ID value changes at least once during the window
  - The change is between adjacent mainline lanes (difference of 1)
  - Surrounding vehicles in both the source and destination lanes are tracked
    to provide full context for the maneuver
"""

import pandas as pd
import numpy as np
import config


def detect_lane_change(df: pd.DataFrame) -> list:
    """
    Detect lane change scenarios across all vehicles.
    Uses record-based windowing to handle non-consecutive frame IDs.
    """
    scenarios = []
    window = config.FRAMES_PER_WINDOW
    vehicle_ids = df["Vehicle_ID"].unique()

    for ego_id in vehicle_ids:
        ego_data = df[df["Vehicle_ID"] == ego_id].sort_values("Frame_ID").reset_index(drop=True)

        if len(ego_data) < window:
            continue

        i = 0
        while i <= len(ego_data) - window:
            ego_window = ego_data.iloc[i:i + window]

            start_frame = ego_window["Frame_ID"].iloc[0]
            end_frame = ego_window["Frame_ID"].iloc[-1]

            # Check if lane changes during the window
            lanes_in_window = ego_window["Lane_ID"].values
            unique_lanes = np.unique(lanes_in_window)

            if len(unique_lanes) < 2:
                i += window // 5
                continue

            # Find the actual lane transition
            lane_changes = np.where(np.diff(lanes_in_window) != 0)[0]
            if len(lane_changes) == 0:
                i += window // 5
                continue

            change_idx = lane_changes[0]
            source_lane = int(lanes_in_window[change_idx])
            dest_lane = int(lanes_in_window[change_idx + 1])

            # Verify it's an adjacent lane change
            if abs(dest_lane - source_lane) != 1:
                i += window // 5
                continue

            # Both lanes must be mainline
            if source_lane not in config.LC_LANE_MAINLINE or dest_lane not in config.LC_LANE_MAINLINE:
                i += window // 5
                continue

            change_frame = int(ego_window["Frame_ID"].iloc[change_idx])

            # Get surrounding vehicles in BOTH source and destination lanes
            surrounding = _get_surrounding_both_lanes(
                df, ego_id, source_lane, dest_lane, ego_window, start_frame, end_frame
            )

            scenario = {
                "scenario_type": "lane_change",
                "ego_vehicle_id": int(ego_id),
                "start_frame": int(start_frame),
                "end_frame": int(end_frame),
                "start_time_ms": int(ego_window["Global_Time"].iloc[0]),
                "end_time_ms": int(ego_window["Global_Time"].iloc[-1]),
                "source_lane": int(source_lane),
                "destination_lane": int(dest_lane),
                "ego_lane": int(source_lane),
                "change_direction": "left" if dest_lane < source_lane else "right",
                "change_frame": change_frame,
                "ego_avg_speed_ft_s": round(float(ego_window["v_Vel"].mean()), 2),
                "surrounding_vehicles": surrounding,
                "ego_trajectory": _extract_trajectory(ego_window),
            }
            scenarios.append(scenario)

            i += window
            continue

    return scenarios


def _get_surrounding_both_lanes(df, ego_id, source_lane, dest_lane, ego_window, start_frame, end_frame):
    """Find surrounding vehicles in both the source and destination lanes."""
    ego_y_mean = ego_window["Local_Y"].mean()
    lanes_to_check = set()
    for lane in [source_lane, dest_lane]:
        lanes_to_check.add(lane)
        lanes_to_check.add(lane - 1)
        lanes_to_check.add(lane + 1)
    lanes_to_check = lanes_to_check.intersection(set(config.LC_LANE_MAINLINE))

    surrounding_mask = (
        (df["Frame_ID"] >= start_frame) &
        (df["Frame_ID"] <= end_frame) &
        (df["Vehicle_ID"] != ego_id) &
        (df["Local_Y"].between(ego_y_mean - config.LC_SURROUNDING_RADIUS_FT,
                                ego_y_mean + config.LC_SURROUNDING_RADIUS_FT)) &
        (df["Lane_ID"].isin(lanes_to_check))
    )
    return sorted(df[surrounding_mask]["Vehicle_ID"].unique().tolist())


def _extract_trajectory(vehicle_data):
    """Extract compact trajectory for output."""
    data = vehicle_data.reset_index(drop=True)
    sampled = data.iloc[::10] if len(data) > 10 else data
    trajectory = []
    for _, row in sampled.iterrows():
        trajectory.append({
            "frame": int(row["Frame_ID"]),
            "x": round(float(row["Local_X"]), 2),
            "y": round(float(row["Local_Y"]), 2),
            "vel": round(float(row["v_Vel"]), 2),
            "acc": round(float(row["v_Acc"]), 2),
            "lane": int(row["Lane_ID"])
        })
    return trajectory
