"""
Car-Following Scenario Detection Module

Definition:
  A car-following scenario occurs when an ego vehicle maintains a consistent
  gap with the vehicle directly ahead in the same lane. Both vehicles travel
  in the same direction without lane changes, and the following distance
  remains within a bounded range throughout the 5-second window.

Observable conditions:
  - Ego vehicle and preceding vehicle share the same Lane_ID
  - Space headway (bumper-to-bumper gap) is within a defined range
  - Both vehicles are moving above a minimum speed threshold
  - The speed difference between ego and lead remains moderate
  - Neither vehicle changes lanes during the window
"""

import pandas as pd
import numpy as np
import config


def detect_car_following(df: pd.DataFrame) -> list:
    """
    Detect car-following scenarios across all vehicles in the dataset.
    Uses record-based windowing (N consecutive records per vehicle)
    to handle non-consecutive frame IDs in the real NGSIM data.
    """
    scenarios = []
    window = config.FRAMES_PER_WINDOW  # 50 records

    # Get all vehicles that have a preceding vehicle
    vehicles_with_preceding = df[df["Preceding"] > 0]["Vehicle_ID"].unique()

    for ego_id in vehicles_with_preceding:
        ego_data = df[df["Vehicle_ID"] == ego_id].sort_values("Frame_ID").reset_index(drop=True)

        if len(ego_data) < window:
            continue

        # Slide window by record index (not frame ID)
        i = 0
        while i <= len(ego_data) - window:
            ego_window = ego_data.iloc[i:i + window]

            # Check: ego stays in the same lane
            if ego_window["Lane_ID"].nunique() != 1:
                i += window // 5
                continue

            ego_lane = ego_window["Lane_ID"].iloc[0]

            # Check: ego has a consistent preceding vehicle
            preceding_ids = ego_window["Preceding"].unique()
            preceding_ids = preceding_ids[preceding_ids > 0]
            if len(preceding_ids) == 0:
                i += window // 5
                continue

            # Use the most common preceding vehicle
            lead_id = int(ego_window["Preceding"].mode().iloc[0])
            if lead_id <= 0:
                i += window // 5
                continue

            # Get lead vehicle data overlapping this time range
            start_frame = ego_window["Frame_ID"].iloc[0]
            end_frame = ego_window["Frame_ID"].iloc[-1]
            lead_data = df[(df["Vehicle_ID"] == lead_id) &
                           (df["Frame_ID"] >= start_frame) &
                           (df["Frame_ID"] <= end_frame)].sort_values("Frame_ID")

            if len(lead_data) < window * 0.5:  # Need at least 50% coverage
                i += window // 5
                continue

            # Check: lead vehicle is in the same lane
            if lead_data["Lane_ID"].nunique() != 1 or lead_data["Lane_ID"].iloc[0] != ego_lane:
                i += window // 5
                continue

            # Check: space headway within bounds
            avg_headway = ego_window["Space_Hdwy"].mean()
            if avg_headway <= 0 or avg_headway > config.CF_MAX_SPACE_HEADWAY_FT:
                i += window // 5
                continue

            # Check: both vehicles moving
            ego_avg_vel = ego_window["v_Vel"].mean()
            lead_avg_vel = lead_data["v_Vel"].mean()
            if ego_avg_vel < config.CF_MIN_VELOCITY_FT_S or lead_avg_vel < config.CF_MIN_VELOCITY_FT_S:
                i += window // 5
                continue

            # Check: speed difference is moderate
            speed_diff = abs(ego_avg_vel - lead_avg_vel)
            if speed_diff > config.CF_MAX_SPEED_DIFF_FT_S:
                i += window // 5
                continue

            # Find surrounding vehicles
            surrounding = _get_surrounding_vehicles(df, ego_id, ego_lane, ego_window, start_frame, end_frame)

            scenario = {
                "scenario_type": "car_following",
                "ego_vehicle_id": int(ego_id),
                "lead_vehicle_id": int(lead_id),
                "start_frame": int(start_frame),
                "end_frame": int(end_frame),
                "start_time_ms": int(ego_window["Global_Time"].iloc[0]),
                "end_time_ms": int(ego_window["Global_Time"].iloc[-1]),
                "ego_lane": int(ego_lane),
                "avg_space_headway_ft": round(float(avg_headway), 2),
                "ego_avg_speed_ft_s": round(float(ego_avg_vel), 2),
                "lead_avg_speed_ft_s": round(float(lead_avg_vel), 2),
                "surrounding_vehicles": surrounding,
                "ego_trajectory": _extract_trajectory(ego_window),
                "lead_trajectory": _extract_trajectory(lead_data),
            }
            scenarios.append(scenario)

            # Jump forward to avoid overlapping windows
            i += window
            continue

    return scenarios


def _get_surrounding_vehicles(df, ego_id, ego_lane, ego_window, start_frame, end_frame):
    """Find vehicles near the ego vehicle during the window."""
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
    """Extract a compact trajectory summary for output."""
    data = vehicle_data.reset_index(drop=True) if "Frame_ID" in vehicle_data.columns else vehicle_data.reset_index()
    # Sample every 10 records (roughly 1 per second) for compact output
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
