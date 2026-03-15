"""
Storage Module
Manages Azure Blob Storage operations for raw data and processed outputs.
"""

import json
import pandas as pd
from azure.storage.blob import BlobServiceClient
import config
from modules.ingestion import ensure_container


def upload_output(blob_service: BlobServiceClient, output_data: str, blob_name: str):
    """Upload processed scenario output to Azure Blob Storage output container."""
    container_client = ensure_container(blob_service, config.AZURE_CONTAINER_OUTPUT)
    blob_client = container_client.get_blob_client(blob_name)
    blob_client.upload_blob(output_data, overwrite=True)
    print(f"  Output uploaded: {blob_name}")


def upload_scenarios_json(blob_service: BlobServiceClient, scenarios: list, blob_name: str):
    """Upload scenario results as JSON to Azure Blob Storage."""
    container_client = ensure_container(blob_service, config.AZURE_CONTAINER_OUTPUT)
    blob_client = container_client.get_blob_client(blob_name)
    json_data = json.dumps(scenarios, indent=2, default=str)
    blob_client.upload_blob(json_data, overwrite=True)
    print(f"  Scenarios JSON uploaded: {blob_name} ({len(scenarios)} scenarios)")


def list_blobs(blob_service: BlobServiceClient, container_name: str) -> list:
    """List all blobs in a container."""
    container_client = blob_service.get_container_client(container_name)
    return [blob.name for blob in container_client.list_blobs()]


def save_output_local(scenarios: list, file_path: str):
    """Save scenario results to a local JSON file."""
    with open(file_path, "w") as f:
        json.dump(scenarios, f, indent=2, default=str)
    print(f"  Output saved locally: {file_path} ({len(scenarios)} scenarios)")


def save_output_csv(scenarios: list, file_path: str):
    """Save scenario results summary to a local CSV file."""
    rows = []
    for s in scenarios:
        rows.append({
            "scenario_id": s["scenario_id"],
            "scenario_type": s["scenario_type"],
            "ego_vehicle_id": s["ego_vehicle_id"],
            "start_frame": s["start_frame"],
            "end_frame": s["end_frame"],
            "start_time_ms": s["start_time_ms"],
            "end_time_ms": s["end_time_ms"],
            "ego_lane": s.get("ego_lane", ""),
            "num_surrounding_vehicles": len(s.get("surrounding_vehicles", [])),
            "surrounding_vehicle_ids": ",".join(str(v) for v in s.get("surrounding_vehicles", []))
        })
    df = pd.DataFrame(rows)
    df.to_csv(file_path, index=False)
    print(f"  Summary CSV saved: {file_path}")
