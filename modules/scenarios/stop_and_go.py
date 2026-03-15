"""
Stop-and-Go Scenario Detection Module

Definition:
  A stop-and-go scenario is identified when a vehicle undergoes a significant
  deceleration (approaching a near-stop or very low speed) followed by a
  re-acceleration within a 5-second window. This pattern is characteristic
  of congested traffic conditions such as shockwave traffic jams.

Observable conditions:
  - Vehicle experiences strong deceleration (below a negative threshold)
  - Vehicle speed drops to a low value (near-stop)
  - Vehicle then accelerates again above a positive threshold
  - Nearby vehicles in the same or adjacent lanes exhibit similar behavior,
    confirming this is a traffic condition rather than an isolated event
"""

import pandas as pd
import numpy as np
import config


def detect_stop_and_go(df: pd.DataFrame) -> list:
    """
    Detect stop-and-go scenarios across all vehicles.
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

            # Check ego stays in the same lane
            if ego_window["Lane_ID"].nunique() != 1:
                i += window // 5
                continue

            ego_lane = ego_window["Lane_ID"].iloc[0]
            start_frame = ego_window["Frame_ID"].iloc[0]
            end_frame = ego_window["Frame_ID"].iloc[-1]

            # Check for deceleration-acceleration pattern
            accel_values = ego_window["v_Acc"].values
            vel_values = ego_window["v_Vel"].values

            has_decel = np.any(accel_values < config.SG_DECEL_THRESHOLD_FT_S2)
            has_accel = np.any(accel_values > config.SG_ACCEL_THRESHOLD_FT_S2)
            has_low_speed = np.any(vel_values < config.SG_LOW_SPEED_THRESHOLD_FT_S)

            if not (has_decel and has_accel and has_low_speed):
                i += window // 5
                continue

            # Verify the deceleration happens BEFORE the acceleration
            decel_indices = np.where(accel_values < config.SG_DECEL_THRESHOLD_FT_S2)[0]
            accel_indices = np.where(accel_values > config.SG_ACCEL_THRESHOLD_FT_S2)[0]

            if decel_indices[0] >= accel_indices[-1]:
                i += window // 5
                continue

            # Verify nearby vehicles also show signs of congestion
            nearby_congested = _check_nearby_congestion(
                df, ego_id, ego_lane, ego_window, start_frame, end_frame
            )

            if not nearby_congested:
                i += window // 5
                continue

            surrounding = _get_surrounding_vehicles(df, ego_id, ego_lane, ego_window, start_frame, end_frame)

            min_speed = float(np.min(vel_values))
            max_decel = float(np.min(accel_values))
            max_accel = float(np.max(accel_values))

            scenario = {
                "scenario_type": "stop_and_go",
                "ego_vehicle_id": int(ego_id),
                "start_frame": int(start_frame),
                "end_frame": int(end_frame),
                "start_time_ms": int(ego_window["Global_Time"].iloc[0]),
                "end_time_ms": int(ego_window["Global_Time"].iloc[-1]),
                "ego_lane": int(ego_lane),
                "min_speed_ft_s": round(min_speed, 2),
                "max_deceleration_ft_s2": round(max_decel, 2),
                "max_acceleration_ft_s2": round(max_accel, 2),
                "surrounding_vehicles": surrounding,
                "ego_trajectory": _extract_trajectory(ego_window),
            }
            scenarios.append(scenario)

            i += window
            continue

    return scenarios


def _check_nearby_congestion(df, ego_id, ego_lane, ego_window, start_frame, end_frame):
    """
    Verify at least one nearby vehicle also shows low speed or deceleration,
    confirming a traffic-level stop-and-go condition.
    """
    ego_y_mean = ego_window["Local_Y"].mean()
    nearby = df[
        (df["Frame_ID"] >= start_frame) &
        (df["Frame_ID"] <= end_frame) &
        (df["Vehicle_ID"] != ego_id) &
        (df["Lane_ID"].between(ego_lane - 1, ego_lane + 1)) &
        (df["Local_Y"].between(ego_y_mean - config.LC_SURROUNDING_RADIUS_FT,
                                ego_y_mean + config.LC_SURROUNDING_RADIUS_FT))
    ]

    if nearby.empty:
        return False

    for vid in nearby["Vehicle_ID"].unique()[:10]:  # Check up to 10 neighbors
        v_data = nearby[nearby["Vehicle_ID"] == vid]
        if len(v_data) >= 5:
            if (v_data["v_Vel"].min() < config.SG_LOW_SPEED_THRESHOLD_FT_S or
                v_data["v_Acc"].min() < config.SG_DECEL_THRESHOLD_FT_S2):
                return True
    return False


def _get_surrounding_vehicles(df, ego_id, ego_lane, ego_window, start_frame, end_frame):
    """Find surrounding vehicles during the window."""
    ego_y_mean = ego_window["Local_Y"].mean()
    surrounding_mask = (
        (df["Frame_ID"] >= start_frame) &
        (df["Frame_ID"] <= end_frame) &
        (df["Vehicle_ID"] != ego_id) &
        (df["Local_Y"].between(ego_y_mean - config.LC_SURROUNDING_RADIUS_FT,
                                ego_y_mean + config.LC_SURROUNDING_RADIUS_FT)) &
        (df["Lane_ID"].between(ego_lane - 1, ego_lane + 1))
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
