"""
Configuration module for the NGSIM Scenario Extraction System.
Centralizes all configuration parameters for the monolithic application.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "")
AZURE_CONTAINER_RAW = os.getenv("AZURE_CONTAINER_RAW", "ngsim-raw")
AZURE_CONTAINER_OUTPUT = os.getenv("AZURE_CONTAINER_OUTPUT", "ngsim-output")

# Dataset
NGSIM_DATA_PATH = os.getenv("NGSIM_DATA_PATH", "data/trajectories-0750am-0805am.csv")
WINDOW_SIZE_SEC = int(os.getenv("WINDOW_SIZE_SEC", "5"))
SAMPLING_RATE_HZ = int(os.getenv("SAMPLING_RATE_HZ", "10"))
FRAMES_PER_WINDOW = WINDOW_SIZE_SEC * SAMPLING_RATE_HZ  # 50 frames

# NGSIM column names
NGSIM_COLUMNS = [
    "Vehicle_ID", "Frame_ID", "Total_Frames", "Global_Time",
    "Local_X", "Local_Y", "Global_X", "Global_Y",
    "v_Length", "v_Width", "v_Class",
    "v_Vel", "v_Acc", "Lane_ID",
    "Preceding", "Following",
    "Space_Hdwy", "Time_Hdwy"
]

# Scenario Detection Thresholds
# Car-Following
CF_MAX_SPACE_HEADWAY_FT = 200.0   # Max bumper-to-bumper gap (feet)
CF_MIN_VELOCITY_FT_S = 5.0        # Min velocity to be considered moving (ft/s)
CF_MAX_SPEED_DIFF_FT_S = 15.0     # Max speed difference between ego and lead (ft/s)

# Stop-and-Go
SG_DECEL_THRESHOLD_FT_S2 = -5.0   # Deceleration threshold (ft/s^2)
SG_ACCEL_THRESHOLD_FT_S2 = 3.0    # Acceleration threshold (ft/s^2)
SG_LOW_SPEED_THRESHOLD_FT_S = 10.0  # Speed considered "stopped" or very slow (ft/s)

# Lane Change
LC_LANE_MAINLINE = [1, 2, 3, 4, 5]  # Mainline lane IDs for US-101
LC_SURROUNDING_RADIUS_FT = 200.0    # Radius to search for surrounding vehicles (ft)

# Output
OUTPUT_DIR = os.getenv("OUTPUT_DIR", "outputs")
