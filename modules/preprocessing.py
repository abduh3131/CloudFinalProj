"""
Preprocessing Module
Cleans and prepares NGSIM data for scenario detection.
"""

import pandas as pd
import numpy as np
import config


def preprocess(df: pd.DataFrame) -> pd.DataFrame:
    """
    Full preprocessing pipeline for NGSIM data.
    Steps:
      1. Validate and clean columns
      2. Filter to mainline lanes
      3. Sort by Vehicle_ID and Frame_ID
      4. Remove invalid records
      5. Compute derived features
    """
    print("  Preprocessing NGSIM data...")
    original_count = len(df)

    # Ensure correct column types
    df = enforce_types(df)

    # Remove records with missing critical fields
    df = df.dropna(subset=["Vehicle_ID", "Frame_ID", "Local_X", "Local_Y", "v_Vel", "Lane_ID"])

    # Filter to mainline lanes only (1-5 for US-101)
    df = df[df["Lane_ID"].isin(config.LC_LANE_MAINLINE)].copy()

    # Remove records with unrealistic values
    df = df[df["v_Vel"] >= 0].copy()  # No negative velocities
    df = df[df["v_Acc"].abs() < 40].copy()  # Filter extreme acceleration (>40 ft/s^2)

    # Sort for consistent processing
    df = df.sort_values(["Vehicle_ID", "Frame_ID"]).reset_index(drop=True)

    # Compute derived features
    df = compute_derived_features(df)

    removed = original_count - len(df)
    print(f"  Preprocessing complete: {len(df)} records retained ({removed} removed).")
    print(f"  Unique vehicles: {df['Vehicle_ID'].nunique()}, Frame range: {df['Frame_ID'].min()}-{df['Frame_ID'].max()}")
    return df


def enforce_types(df: pd.DataFrame) -> pd.DataFrame:
    """Ensure correct data types for all columns."""
    int_cols = ["Vehicle_ID", "Frame_ID", "Total_Frames", "v_Class", "Lane_ID", "Preceding", "Following"]
    float_cols = ["Global_Time", "Local_X", "Local_Y", "Global_X", "Global_Y",
                  "v_Length", "v_Width", "v_Vel", "v_Acc", "Space_Hdwy", "Time_Hdwy"]

    for col in int_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)
    for col in float_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    return df


def compute_derived_features(df: pd.DataFrame) -> pd.DataFrame:
    """Compute additional features useful for scenario detection."""
    # Relative time in seconds from the start of the dataset
    min_time = df["Global_Time"].min()
    df["Relative_Time_s"] = (df["Global_Time"] - min_time) / 1000.0

    # Speed in mph for readability (1 ft/s = 0.681818 mph)
    df["Speed_mph"] = df["v_Vel"] * 0.681818

    # Flag for each vehicle: number of frames it appears
    vehicle_frame_counts = df.groupby("Vehicle_ID")["Frame_ID"].transform("count")
    df["Vehicle_Frame_Count"] = vehicle_frame_counts

    return df
