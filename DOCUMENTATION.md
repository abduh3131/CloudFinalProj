# Phase 1 – Modular Monolithic System Documentation

## SOFE 4630U Cloud Computing – Group 11
**Project:** Cloud-based Scenario Extraction and Processing from the NGSIM Dataset

**Group Members:**
- Alexy Pichette (100822470)
- Malyka Sardar (100752640)
- Mohammad Al-Lozy (100829387)
- Abdullah Hanoosh (100749026)

**Date:** March 15, 2026

---

## 1. System Architecture

### 1.1 Overview

Phase 1 implements a **modular monolithic architecture** — a single deployable application with clearly separated internal modules, each responsible for a specific stage of the processing pipeline. The application is designed to run on **Microsoft Azure** cloud infrastructure.

### 1.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   MONOLITHIC APPLICATION                        │
│                        (main.py)                                │
│                                                                 │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────────────┐  │
│  │  Ingestion   │──▶│ Preprocessing │──▶│  Scenario Detection │  │
│  │  Module      │   │   Module      │   │                     │  │
│  │              │   │              │   │  ┌───────────────┐  │  │
│  │ - Load CSV   │   │ - Clean data │   │  │ Car-Following │  │  │
│  │ - Upload to  │   │ - Filter     │   │  └───────────────┘  │  │
│  │   Azure Blob │   │   lanes      │   │  ┌───────────────┐  │  │
│  │ - Download   │   │ - Type       │   │  │ Stop-and-Go   │  │  │
│  │   from Blob  │   │   enforce    │   │  └───────────────┘  │  │
│  └──────┬───────┘   │ - Derived    │   │  ┌───────────────┐  │  │
│         │           │   features   │   │  │ Lane Change   │  │  │
│         ▼           └──────────────┘   │  └───────────────┘  │  │
│  ┌─────────────┐                       └──────────┬──────────┘  │
│  │   Storage    │                                 │             │
│  │   Module     │◀────────────────────────────────┘             │
│  │              │                                               │
│  │ - Azure Blob │   ┌──────────────┐                            │
│  │   raw/output │──▶│    Output     │                           │
│  │ - Local file │   │    Module     │                           │
│  │   fallback   │   │              │                            │
│  └──────────────┘   │ - JSON/CSV   │                            │
│                     │ - Summary    │                            │
│                     │ - Examples   │                            │
│                     └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┼───────────┐
                ▼           ▼           ▼
        ┌────────────┐ ┌─────────┐ ┌─────────────┐
        │Azure Blob  │ │ Local   │ │ Console     │
        │Storage     │ │ Files   │ │ Output      │
        │(ngsim-raw) │ │(outputs)│ │(summary +   │
        │(ngsim-out) │ │         │ │ examples)   │
        └────────────┘ └─────────┘ └─────────────┘
```

### 1.3 Module Responsibilities

| Module | File | Responsibility |
|--------|------|----------------|
| **Config** | `config.py` | Centralized configuration, thresholds, Azure settings |
| **Ingestion** | `modules/ingestion.py` | Load NGSIM data locally or upload/download via Azure Blob |
| **Storage** | `modules/storage.py` | Azure Blob Storage operations, local file I/O |
| **Preprocessing** | `modules/preprocessing.py` | Data cleaning, type enforcement, derived features |
| **Car-Following** | `modules/scenarios/car_following.py` | Detect car-following scenarios |
| **Stop-and-Go** | `modules/scenarios/stop_and_go.py` | Detect stop-and-go scenarios |
| **Lane Change** | `modules/scenarios/lane_change.py` | Detect lane change scenarios |
| **Output** | `modules/output.py` | Format, combine, and export results |
| **Main** | `main.py` | Pipeline orchestrator |

---

## 2. Data Flow

### 2.1 Pipeline Stages

```
NGSIM CSV/TXT Data
       │
       ▼
[1. INGESTION] ────────────────────────────────┐
  Load from local file or Azure Blob Storage    │
  Upload raw data to Azure Blob (batch)         │
       │                                        │
       ▼                                        ▼
[2. PREPROCESSING]                     Azure Blob Storage
  - Validate column types               (ngsim-raw container)
  - Filter to mainline lanes (1-5)
  - Remove invalid records
  - Compute derived features
       │
       ▼
[3. SCENARIO DETECTION]
  Run three detection algorithms in sequence:
  a) Car-Following Detection
  b) Stop-and-Go Detection
  c) Lane Change Detection
  Each produces a list of 5-second scenario windows
       │
       ▼
[4. OUTPUT GENERATION]
  - Assign unique scenario IDs
  - Merge all scenarios
  - Save JSON (detailed) and CSV (summary)
  - Upload results to Azure Blob (ngsim-output)
  - Print summary and example outputs
```

### 2.2 Data Transformations

**Input:** Raw NGSIM trajectory records (18 fields per record, 10 Hz sampling)

**Processing:** For each vehicle, a sliding window of 50 frames (5 seconds) is evaluated against scenario-specific rules. Each detected scenario captures:
- Ego vehicle ID and trajectory
- Surrounding vehicle IDs
- Scenario type label
- Time and frame range
- Scenario-specific metrics

**Output:** JSON array of labeled 5-second scenario samples

---

## 3. Cloud Infrastructure (Azure)

### 3.1 Services Used

| Azure Service | Purpose | Justification |
|---------------|---------|---------------|
| **Azure Blob Storage** | Store raw NGSIM data and processed outputs | Cost-effective object storage ideal for large CSV files; supports batch upload/download; integrates with Azure SDK for Python |
| **Azure VM / Azure Container Instances** | Execute the monolithic application | Single-instance compute is sufficient for monolithic architecture; can scale vertically if needed |
| **Azure Container Registry** (optional) | Store Docker image | Enables reproducible deployment of the containerized application |

### 3.2 Why Azure Blob Storage

- **Scalability:** Handles files from KB to TB without configuration changes
- **Cost:** Pay-per-use model with cheap storage tiers (Hot/Cool/Archive)
- **Integration:** Native Python SDK (`azure-storage-blob`) for programmatic access
- **Separation:** Raw data and processed outputs stored in separate containers
- **Reliability:** Built-in redundancy (LRS/GRS) ensures data durability

### 3.3 Ingestion Approach — Batch Upload

The NGSIM dataset is static (historical data), so **batch ingestion** is the appropriate strategy:
- Upload the entire CSV file to Azure Blob Storage in one operation
- No need for streaming or real-time ingestion
- Supports reprocessing by re-downloading from Blob Storage
- Simple, reliable, and suitable for the data characteristics

---

## 4. Scenario Detection Logic

### 4.1 Car-Following

**Definition:** A car-following scenario occurs when an ego vehicle maintains a consistent gap with the vehicle directly ahead in the same lane over a 5-second window.

**Detection Algorithm:**
1. For each vehicle with a preceding vehicle (`Preceding > 0`)
2. Slide a 50-frame window across the vehicle's trajectory
3. Verify conditions:
   - Ego and lead vehicle remain in the **same lane** (no lane changes)
   - **Space headway** is between 0 and 200 feet
   - Both vehicles are **moving** (velocity > 5 ft/s)
   - **Speed difference** between ego and lead is < 15 ft/s
4. If all conditions met, record the scenario with ego trajectory, lead trajectory, and surrounding vehicles

**Data Features Used:** `Lane_ID`, `Space_Hdwy`, `v_Vel`, `Preceding`, `Local_Y`

### 4.2 Stop-and-Go

**Definition:** A stop-and-go scenario occurs when a vehicle undergoes significant deceleration (approaching a near-stop) followed by re-acceleration within a 5-second window, indicative of congested traffic.

**Detection Algorithm:**
1. For each vehicle, slide a 50-frame window
2. Within the window, check for:
   - **Deceleration** below -5 ft/s² at some point
   - **Acceleration** above +3 ft/s² at a later point
   - **Low speed** (< 10 ft/s) reached during the window
   - Deceleration occurs **before** acceleration (temporal ordering)
3. **Congestion verification:** At least one nearby vehicle (same or adjacent lane, within 200 ft) also shows low speed or strong deceleration
4. If all conditions met, record the scenario

**Data Features Used:** `v_Vel`, `v_Acc`, `Lane_ID`, `Local_Y`

### 4.3 Lane Change

**Definition:** A lane change scenario occurs when a vehicle transitions from one mainline lane to an adjacent lane within a 5-second window.

**Detection Algorithm:**
1. For each vehicle, slide a 50-frame window
2. Check if `Lane_ID` changes during the window
3. Verify:
   - Change is between **adjacent lanes** (lane difference = 1)
   - Both source and destination are **mainline lanes** (1–5)
4. Identify the exact frame of transition
5. Capture surrounding vehicles from **both** source and destination lanes
6. Record change direction (left or right)

**Data Features Used:** `Lane_ID`, `Local_X`, `Local_Y`

---

## 5. Dataset Details

### 5.1 NGSIM US-101 Dataset

- **Location:** Southbound US-101 (Hollywood Freeway), Los Angeles, CA
- **Collection Date:** June 15, 2005
- **Study Section:** ~2,100 feet (0.4 miles)
- **Lanes:** 5 mainline + auxiliary/ramp lanes
- **Sampling Rate:** 10 Hz (one record per vehicle per 0.1 seconds)
- **Time Periods:** Three 15-minute segments (7:50–8:05, 8:05–8:20, 8:20–8:35 AM)

### 5.2 Selected Segment

We use the **first time period** (7:50 AM – 8:05 AM) which captures the transition into congestion, providing a mix of free-flowing and congested traffic — ideal for detecting all three scenario types.

### 5.3 Data Fields

| Field | Unit | Description |
|-------|------|-------------|
| Vehicle_ID | — | Unique vehicle identifier |
| Frame_ID | — | Frame number (ascending by time) |
| Global_Time | ms | Unix timestamp in milliseconds |
| Local_X / Local_Y | feet | Position relative to road segment |
| v_Vel | ft/s | Instantaneous velocity |
| v_Acc | ft/s² | Instantaneous acceleration |
| Lane_ID | — | Lane number (1=leftmost, 5=rightmost mainline) |
| Preceding / Following | — | Vehicle IDs of lead and trailing vehicles |
| Space_Hdwy | feet | Bumper-to-bumper gap to preceding vehicle |
| Time_Hdwy | seconds | Time gap to preceding vehicle |

### 5.4 Assumptions and Limitations

- Only mainline lanes (1–5) are processed; ramp and auxiliary lanes (6–8) are excluded
- Records with extreme acceleration (|a| > 40 ft/s²) are filtered as sensor noise
- Each scenario window is non-overlapping (windows advance by 50 frames after a detection)
- The 5-second window (50 frames) provides sufficient temporal resolution for all three scenarios

---

## 6. How to Run

### 6.1 Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Generate sample data and run
python main.py --generate-sample

# Run with actual NGSIM data
python main.py --data data/trajectories-0750am-0805am.csv
```

### 6.2 With Azure Integration

```bash
# Set environment variables (or create .env file from .env.example)
export AZURE_STORAGE_CONNECTION_STRING="your-connection-string"

# Run with Azure Blob Storage
python main.py --data data/trajectories-0750am-0805am.csv --azure
```

### 6.3 Docker Deployment (Azure VM / Container Instances)

```bash
# Build the container
docker build -t ngsim-scenario-extractor .

# Run locally
docker run -v $(pwd)/outputs:/app/outputs ngsim-scenario-extractor

# Run with Azure integration
docker run -e AZURE_STORAGE_CONNECTION_STRING="..." \
  ngsim-scenario-extractor python main.py --azure --generate-sample

# Push to Azure Container Registry
az acr login --name yourregistry
docker tag ngsim-scenario-extractor yourregistry.azurecr.io/ngsim-scenario-extractor:v1
docker push yourregistry.azurecr.io/ngsim-scenario-extractor:v1

# Deploy to Azure Container Instances
az container create \
  --resource-group your-rg \
  --name ngsim-processor \
  --image yourregistry.azurecr.io/ngsim-scenario-extractor:v1 \
  --environment-variables AZURE_STORAGE_CONNECTION_STRING="..."
```

---

## 7. Output Format

### 7.1 JSON Output Structure

Each scenario sample is a JSON object:

```json
{
  "scenario_id": "CF-0001",
  "scenario_type": "car_following",
  "ego_vehicle_id": 5,
  "lead_vehicle_id": 4,
  "start_frame": 100,
  "end_frame": 149,
  "start_time_ms": 1118847010000,
  "end_time_ms": 1118847014900,
  "ego_lane": 3,
  "avg_space_headway_ft": 65.32,
  "ego_avg_speed_ft_s": 34.21,
  "lead_avg_speed_ft_s": 33.87,
  "surrounding_vehicles": [2, 7, 12, 15],
  "ego_trajectory": [
    {"frame": 100, "x": 18.0, "y": 450.2, "vel": 34.1, "acc": 0.5, "lane": 3},
    {"frame": 110, "x": 18.0, "y": 484.3, "vel": 34.5, "acc": -0.2, "lane": 3}
  ]
}
```

### 7.2 CSV Summary

A summary CSV is also generated with one row per scenario for quick analysis.

---

## 8. Project Structure

```
phase1-monolithic/
├── main.py                          # Pipeline orchestrator
├── config.py                        # Configuration and thresholds
├── generate_sample.py               # Sample data generator
├── requirements.txt                 # Python dependencies
├── Dockerfile                       # Container definition
├── .env.example                     # Environment variable template
├── DOCUMENTATION.md                 # This file
├── modules/
│   ├── __init__.py
│   ├── ingestion.py                 # Data ingestion (Azure Blob + local)
│   ├── storage.py                   # Storage operations
│   ├── preprocessing.py             # Data cleaning and preparation
│   ├── output.py                    # Output formatting and export
│   └── scenarios/
│       ├── __init__.py
│       ├── car_following.py         # Car-following detection
│       ├── stop_and_go.py           # Stop-and-go detection
│       └── lane_change.py           # Lane change detection
├── data/                            # Input data directory
│   └── sample_ngsim.csv             # Generated sample data
└── outputs/                         # Output directory
    ├── scenarios_output.json        # Detailed scenario results
    └── scenarios_summary.csv        # Summary table
```
